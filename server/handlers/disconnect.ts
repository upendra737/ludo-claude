import type { Server, Socket } from "socket.io"
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../../types/socket"
import { serverState } from "../state"
import { db } from "../../lib/db"
import { players, rooms } from "../../db/schema"
import { eq } from "drizzle-orm"
import {
  updatePlayerStatus,
  removeFromTurnOrder,
  advanceTurn,
} from "../../lib/gameEngine"
import { isGameEffectivelyOver } from "../../lib/turnManager"
import {
  DISCONNECT_TIMEOUT_SECS,
  DISCONNECTED_TURN_SKIP_SECS,
} from "../../lib/rules"

type IoServer = Server<any, any, any, SocketData>
type IoSocket = Socket<any, any, any, SocketData>

export async function handleDisconnect(
  io: IoServer,
  socket: IoSocket
): Promise<void> {
  const { playerId, roomCode } = socket.data
  if (!playerId || !roomCode) return

  const gameState = serverState.getGameState(roomCode)
  if (!gameState) return

  const player = gameState.players.find((p) => p.id === playerId)
  if (!player) return

  console.log(`Player ${player.name} disconnected from ${roomCode}`)

  const updatedState = updatePlayerStatus(
    gameState,
    playerId,
    "disconnected"
  )
  serverState.setGameState(roomCode, updatedState)

  await db
    .update(players)
    .set({ status: "disconnected" })
    .where(eq(players.id, playerId))

  io.to(roomCode).emit("player-disconnected", {
    playerId,
    timeoutSecs: DISCONNECT_TIMEOUT_SECS,
  })

  if (gameState.status === "waiting" && player.isHost) {
    await transferHost(io, roomCode, playerId)
  }

  const abandonTimer = setTimeout(async () => {
    await handleAbandon(io, roomCode, playerId)
  }, DISCONNECT_TIMEOUT_SECS * 1000)

  serverState.setDisconnectTimer(roomCode, playerId, abandonTimer)

  const currentState = serverState.getGameState(roomCode)
  if (
    currentState &&
    currentState.status === "active" &&
    currentState.currentTurn === playerId
  ) {
    startTurnSkipTimer(io, roomCode, playerId)
  }
}

function startTurnSkipTimer(
  io: IoServer,
  roomCode: string,
  playerId: string
): void {
  const skipTimer = setTimeout(() => {
    const currentState = serverState.getGameState(roomCode)
    if (!currentState) return
    if (currentState.status !== "active") return
    if (currentState.currentTurn !== playerId) return

    const player = currentState.players.find((p) => p.id === playerId)
    if (!player || player.status !== "disconnected") return

    const skippedState = advanceTurn(currentState)
    serverState.setGameState(roomCode, skippedState)

    io.to(roomCode).emit("turn-skipped", {
      playerId,
      reason: "disconnected",
    })

    io.to(roomCode).emit("turn-changed", {
      playerId: skippedState.currentTurn,
    })

    console.log(`Auto-skipped turn for disconnected player ${playerId}`)
  }, DISCONNECTED_TURN_SKIP_SECS * 1000)

  serverState.setTurnSkipTimer(roomCode, playerId, skipTimer)
}

async function handleAbandon(
  io: IoServer,
  roomCode: string,
  playerId: string
): Promise<void> {
  const gameState = serverState.getGameState(roomCode)
  if (!gameState) return

  const player = gameState.players.find((p) => p.id === playerId)
  if (!player) return
  if (player.status !== "disconnected") return

  console.log(`Player ${player.name} abandoned room ${roomCode}`)

  let newState = updatePlayerStatus(gameState, playerId, "abandoned")
  newState = removeFromTurnOrder(newState, playerId)

  if (gameState.currentTurn === playerId && newState.turnOrder.length > 0) {
    newState = advanceTurn(newState)
  }

  serverState.setGameState(roomCode, newState)

  await db
    .update(players)
    .set({ status: "abandoned" })
    .where(eq(players.id, playerId))

  io.to(roomCode).emit("player-abandoned", { playerId })

  if (isGameEffectivelyOver(newState)) {
    newState.status = "finished"
    serverState.setGameState(roomCode, newState)

    io.to(roomCode).emit("game-over", {
      finishOrder: newState.finishOrder,
    })

    await db
      .update(rooms)
      .set({ status: "finished" })
      .where(eq(rooms.code, roomCode))
  } else if (newState.currentTurn !== gameState.currentTurn) {
    io.to(roomCode).emit("turn-changed", {
      playerId: newState.currentTurn,
    })
  }
}

async function transferHost(
  io: IoServer,
  roomCode: string,
  oldHostId: string
): Promise<void> {
  const gameState = serverState.getGameState(roomCode)
  if (!gameState) return

  const nextHost = gameState.players.find(
    (p) => p.id !== oldHostId && p.status === "connected"
  )
  if (!nextHost) return

  const oldHost = gameState.players.find((p) => p.id === oldHostId)
  if (oldHost) oldHost.isHost = false
  nextHost.isHost = true

  serverState.setGameState(roomCode, gameState)

  await db
    .update(players)
    .set({ isHost: false })
    .where(eq(players.id, oldHostId))

  await db
    .update(players)
    .set({ isHost: true })
    .where(eq(players.id, nextHost.id))

  await db
    .update(rooms)
    .set({ hostId: nextHost.id })
    .where(eq(rooms.code, roomCode))

  io.to(roomCode).emit("host-transferred", {
    newHostId: nextHost.id,
  })

  console.log(`Host transferred to ${nextHost.name} in room ${roomCode}`)
}