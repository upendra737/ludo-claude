import type { Server, Socket } from "socket.io"
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../../types/socket"
import type { Player } from "../../types/game"
import { db } from "../../lib/db"
import { rooms, players } from "../../db/schema"
import { eq } from "drizzle-orm"
import { serverState } from "../state"
import { rateLimiter } from "../rateLimiter"
import { generateUniqueRoomCode } from "../../lib/roomCode"
import { SLOT_COLORS } from "../../types/game"
import {
  socketCreateRoomSchema,
  socketJoinRoomSchema,
  socketRejoinRoomSchema,
} from "../../lib/validation"
import {
  createInitialGameState,
  canStartGame,
  createInitialTokens,
} from "../../lib/gameEngine"
import { randomUUID } from "crypto"

type IoServer = Server<any, any, any, SocketData>
type IoSocket = Socket<any, any, any, SocketData>

export async function handleCreateRoom(
  io: IoServer,
  socket: IoSocket,
  payload: { name: string; sessionToken: string }
): Promise<void> {
  if (!rateLimiter.isAllowed(socket.id, "create-room")) {
    socket.emit("room-error", {
      code: "room-not-found",
      message: "Too many requests. Please wait a moment.",
    })
    return
  }

  const result = socketCreateRoomSchema.safeParse(payload)
  if (!result.success) {
    socket.emit("room-error", {
      code: "room-not-found",
      message: "Invalid request data.",
    })
    return
  }

  const { name, sessionToken } = result.data

  try {
    const code = await generateUniqueRoomCode()
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000)
    const playerId = randomUUID()

    const [room] = await db
      .insert(rooms)
      .values({
        code,
        status: "waiting",
        hostId: playerId,
        expiresAt,
      })
      .returning()

    await db.insert(players).values({
      id: playerId,
      roomId: room.id,
      name,
      color: "red",
      slot: 1,
      isHost: true,
      isReady: false,
      sessionToken,
      socketId: socket.id,
      status: "connected",
    })

    const player: Player = {
      id: playerId,
      name,
      color: "red",
      slot: 1,
      isHost: true,
      isReady: false,
      status: "connected",
      sessionToken,
      finishPosition: null,
      tokens: createInitialTokens("red"),
    }

    socket.join(code)
    socket.data.playerId = playerId
    socket.data.roomCode = code
    socket.data.sessionToken = sessionToken

    const initialGameState = {
      roomCode: code,
      status: "waiting" as const,
      players: [player],
      currentTurn: "",
      turnOrder: [],
      lastDiceValue: null,
      consecutiveSixes: 0,
      validMoves: [],
      finishOrder: [],
      moveCount: 0,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    }

    serverState.setGameState(code, initialGameState)

    socket.emit("room-created", {
      code,
      player,
      sessionToken,
    })

    console.log(`Room ${code} created by ${name}`)
  } catch (error) {
    console.error("Create room error:", error)
    socket.emit("room-error", {
      code: "room-not-found",
      message: "Failed to create room. Please try again.",
    })
  }
}

export async function handleJoinRoom(
  io: IoServer,
  socket: IoSocket,
  payload: { code: string; name: string; sessionToken: string }
): Promise<void> {
  if (!rateLimiter.isAllowed(socket.id, "join-room")) {
    socket.emit("room-error", {
      code: "room-not-found",
      message: "Too many requests. Please wait a moment.",
    })
    return
  }

  const result = socketJoinRoomSchema.safeParse(payload)
  if (!result.success) {
    socket.emit("room-error", {
      code: "room-not-found",
      message: "Invalid request data.",
    })
    return
  }

  const { code, name, sessionToken } = result.data

  try {
    const [room] = await db
      .select()
      .from(rooms)
      .where(eq(rooms.code, code))
      .limit(1)

    if (!room) {
      socket.emit("room-error", {
        code: "room-not-found",
        message: "Room not found. Check your code and try again.",
      })
      return
    }

    if (room.status === "active" || room.status === "finished") {
      socket.emit("room-error", {
        code: "game-in-progress",
        message: "This game has already started.",
      })
      return
    }

    const existingPlayers = await db
      .select()
      .from(players)
      .where(eq(players.roomId, room.id))

    if (existingPlayers.length >= room.maxPlayers) {
      socket.emit("room-error", {
        code: "room-full",
        message: "This room is full.",
      })
      return
    }

    const alreadyJoined = existingPlayers.find(
      (p) => p.sessionToken === sessionToken
    )
    if (alreadyJoined) {
      await handleRejoinRoom(io, socket, { code, sessionToken })
      return
    }

    const usedSlots = existingPlayers.map((p) => p.slot)
    const nextSlot = ([1, 2, 3, 4] as const).find(
      (s) => !usedSlots.includes(s)
    )!
    const color = SLOT_COLORS[nextSlot]
    const playerId = randomUUID()

    await db.insert(players).values({
      id: playerId,
      roomId: room.id,
      name,
      color,
      slot: nextSlot,
      isHost: false,
      isReady: false,
      sessionToken,
      socketId: socket.id,
      status: "connected",
    })

    const player: Player = {
      id: playerId,
      name,
      color,
      slot: nextSlot,
      isHost: false,
      isReady: false,
      status: "connected",
      sessionToken,
      finishPosition: null,
      tokens: createInitialTokens(color),
    }

    socket.join(code)
    socket.data.playerId = playerId
    socket.data.roomCode = code
    socket.data.sessionToken = sessionToken

    const gameState = serverState.getGameState(code)
    if (gameState) {
      gameState.players.push(player)
      serverState.setGameState(code, gameState)
    }

    socket.emit("room-joined", {
      player,
      sessionToken,
      gameState: serverState.getGameState(code)!,
    })

    socket.to(code).emit("player-joined", { player })

    console.log(`${name} joined room ${code}`)
  } catch (error) {
    console.error("Join room error:", error)
    socket.emit("room-error", {
      code: "room-not-found",
      message: "Failed to join room. Please try again.",
    })
  }
}

export async function handleRejoinRoom(
  io: IoServer,
  socket: IoSocket,
  payload: { code: string; sessionToken: string }
): Promise<void> {
  const result = socketRejoinRoomSchema.safeParse(payload)
  if (!result.success) {
    socket.emit("room-error", {
      code: "invalid-session",
      message: "Invalid session.",
    })
    return
  }

  const { code, sessionToken } = result.data

  try {
    const [player] = await db
      .select()
      .from(players)
      .where(eq(players.sessionToken, sessionToken))
      .limit(1)

    if (!player) {
      socket.emit("room-error", {
        code: "invalid-session",
        message: "Session not found. Please join again.",
      })
      return
    }

    const gameState = serverState.getGameState(code)
    if (!gameState) {
      socket.emit("room-error", {
        code: "room-not-found",
        message: "Room no longer exists.",
      })
      return
    }

    await db
      .update(players)
      .set({ socketId: socket.id, status: "connected" })
      .where(eq(players.sessionToken, sessionToken))

    const playerInState = gameState.players.find(
      (p) => p.sessionToken === sessionToken
    )
    if (playerInState) {
      playerInState.status = "connected"
      serverState.setGameState(code, gameState)
    }

    serverState.clearDisconnectTimer(code, player.id)

    socket.join(code)
    socket.data.playerId = player.id
    socket.data.roomCode = code
    socket.data.sessionToken = sessionToken

    socket.emit("game-state-sync", {
      gameState: serverState.getGameState(code)!,
    })

    socket.to(code).emit("player-reconnected", {
      playerId: player.id,
    })

    console.log(`Player ${player.name} rejoined room ${code}`)
  } catch (error) {
    console.error("Rejoin room error:", error)
    socket.emit("room-error", {
      code: "invalid-session",
      message: "Failed to rejoin. Please try again.",
    })
  }
}

export async function handlePlayerReady(
  io: IoServer,
  socket: IoSocket,
  payload: { roomCode: string }
): Promise<void> {
  if (!rateLimiter.isAllowed(socket.id, "player-ready")) return

  const { playerId, roomCode } = socket.data
  if (!playerId || !roomCode) return

  const gameState = serverState.getGameState(roomCode)
  if (!gameState) return

  const player = gameState.players.find((p) => p.id === playerId)
  if (!player) return

  player.isReady = !player.isReady
  serverState.setGameState(roomCode, gameState)

  await db
    .update(players)
    .set({ isReady: player.isReady })
    .where(eq(players.id, playerId))

  io.to(roomCode).emit("player-ready-update", {
    playerId,
    isReady: player.isReady,
  })
}

export async function handleStartGame(
  io: IoServer,
  socket: IoSocket,
  payload: { roomCode: string }
): Promise<void> {
  const { playerId, roomCode } = socket.data
  if (!playerId || !roomCode) return

  const gameState = serverState.getGameState(roomCode)
  if (!gameState) return

  const player = gameState.players.find((p) => p.id === playerId)
  if (!player || !player.isHost) {
    socket.emit("room-error", {
      code: "not-host",
      message: "Only the host can start the game.",
    })
    return
  }

  if (!canStartGame(gameState.players)) {
    socket.emit("room-error", {
      code: "room-not-found",
      message: "Need at least 2 players and all must be ready.",
    })
    return
  }

  const newGameState = createInitialGameState(
    roomCode,
    gameState.players
  )

  serverState.setGameState(roomCode, newGameState)

  await db
    .update(rooms)
    .set({ status: "active" })
    .where(eq(rooms.code, roomCode))

  io.to(roomCode).emit("game-start", { gameState: newGameState })

  console.log(`Game started in room ${roomCode}`)
}