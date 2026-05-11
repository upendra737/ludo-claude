import type { Server, Socket } from "socket.io"
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../../types/socket" 
import { serverState } from "../state"
import { rateLimiter } from "../rateLimiter"
import {
  processDiceRoll,
  moveToken,
  validateMove,
  shouldGetExtraTurn,
  advanceTurn,
} from "../../lib/gameEngine"
import { isGameEffectivelyOver } from "../../lib/turnManager"
import {
  socketRollDiceSchema,
  socketMoveTokenSchema,
} from "../../lib/validation"
import { db } from "../../lib/db"
import { rooms, gameStates } from "../../db/schema"
import { eq } from "drizzle-orm"

type IoServer = Server<any, any, any, SocketData>
type IoSocket = Socket<any, any, any, SocketData>

export async function handleRollDice(
  io: IoServer,
  socket: IoSocket,
  payload: { roomCode: string }
) {
  if (!rateLimiter.isAllowed(socket.id, "roll-dice")) return

  const result = socketRollDiceSchema.safeParse(payload)
  if (!result.success) return

  const { playerId, roomCode } = socket.data
  if (!playerId || !roomCode) return

  const gameState = serverState.getGameState(roomCode)
  if (!gameState) return

  if (gameState.status !== "active") return

  if (gameState.currentTurn !== playerId) {
    socket.emit("room-error", {
      code: "not-your-turn",
      message: "It is not your turn.",
    })
    return
  }

  if (gameState.lastDiceValue !== null) {
    socket.emit("room-error", {
      code: "not-your-turn",
      message: "You have already rolled. Please move a token.",
    })
    return
  }

  const diceResult = processDiceRoll(gameState, playerId)
  serverState.setGameState(roomCode, diceResult.gameState)

  io.to(roomCode).emit("dice-rolled", {
    value: diceResult.diceValue,
    validMoves: diceResult.validMoves,
    consecutiveSixes: diceResult.gameState.consecutiveSixes,
  })

  if (diceResult.turnForfeited) {
    io.to(roomCode).emit("turn-skipped", {
      playerId,
      reason: "triple-six",
    })
    // Sync full state so clients see the penalised token sent home
    io.to(roomCode).emit("game-state-sync", {
      gameState: diceResult.gameState,
    })
    io.to(roomCode).emit("turn-changed", {
      playerId: diceResult.gameState.currentTurn,
    })
    return
  }

  if (diceResult.validMoves.length === 0) {
    const skippedState = advanceTurn(diceResult.gameState)
    serverState.setGameState(roomCode, skippedState)

    io.to(roomCode).emit("turn-skipped", {
      playerId,
      reason: "no-valid-moves",
    })

    io.to(roomCode).emit("turn-changed", {
      playerId: skippedState.currentTurn,
    })
  }

  syncGameStateToDB(roomCode, diceResult.gameState)
}

export async function handleMoveToken(
  io: IoServer,
  socket: IoSocket,
  payload: { roomCode: string; tokenId: string }
) {
  if (!rateLimiter.isAllowed(socket.id, "move-token")) return

  const result = socketMoveTokenSchema.safeParse(payload)
  if (!result.success) return

  const { playerId, roomCode } = socket.data
  if (!playerId || !roomCode) return

  const gameState = serverState.getGameState(roomCode)
  if (!gameState) return

  if (gameState.status !== "active") return

  if (!validateMove(gameState, playerId, payload.tokenId)) {
    socket.emit("room-error", {
      code: "invalid-move",
      message: "Invalid move.",
    })
    return
  }

  const moveResult = moveToken(gameState, playerId, payload.tokenId)
  let newState = moveResult.gameState

  io.to(roomCode).emit("token-moved", {
    gameState: newState,
    capturedTokenIds: moveResult.capturedTokenIds,
  })

  if (moveResult.gameOver) {
    newState.status = "finished"
    serverState.setGameState(roomCode, newState)

    io.to(roomCode).emit("game-over", {
      finishOrder: newState.finishOrder,
    })

    await db
      .update(rooms)
      .set({ status: "finished" })
      .where(eq(rooms.code, roomCode))

    syncGameStateToDB(roomCode, newState)
    return
  }

  if (moveResult.playerFinished) {
    const player = newState.players.find((p: { id: string; finishPosition: number | null }) => p.id === playerId)
    if (player) {
      io.to(roomCode).emit("player-finished", {
        playerId,
        position: player.finishPosition!,
      })
    }
  }

  const extraTurn = shouldGetExtraTurn(
    gameState.lastDiceValue!,
    moveResult.capturedTokenIds
  )

  if (extraTurn && !moveResult.playerFinished) {
    newState.lastDiceValue = null
    newState.validMoves = []
    serverState.setGameState(roomCode, newState)

    io.to(roomCode).emit("turn-changed", {
      playerId,
    })
  } else {
    const advancedState = advanceTurn(newState)
    serverState.setGameState(roomCode, advancedState)

    io.to(roomCode).emit("turn-changed", {
      playerId: advancedState.currentTurn,
    })
  }

  syncGameStateToDB(roomCode, serverState.getGameState(roomCode)!)
}

async function syncGameStateToDB(
  roomCode: string,
  gameState: any
) {
  try {
    const roomRows = await db
      .select()
      .from(rooms)
      .where(eq(rooms.code, roomCode))
      .limit(1)

    if (!roomRows[0]) return

    await db
      .insert(gameStates)
      .values({
        roomId: roomRows[0].id,
        state: gameState,
        moveCount: gameState.moveCount ?? 0,
      })
      .onConflictDoUpdate({
        target: gameStates.roomId,
        set: {
          state: gameState,
          moveCount: gameState.moveCount ?? 0,
          updatedAt: new Date(),
        },
      })
  } catch (error) {
    console.error("DB sync error:", error)
  }
}