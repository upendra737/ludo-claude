import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import { config } from "dotenv"
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "./types/socket"
import { handleCreateRoom, handleJoinRoom, handleRejoinRoom, handlePlayerReady, handleStartGame } from "./server/handlers/room"
import { handleRollDice, handleMoveToken } from "./server/handlers/game"
import { handleDisconnect } from "./server/handlers/disconnect"
import { rateLimiter } from "./server/rateLimiter"
import { startCleanupJob } from "./server/cleanup"
import { serverState } from "./server/state"

config({ path: ".env.local" })

const PORT = process.env.PORT || 3001
const CLIENT_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

const app = express()
app.use(express.json())

// ============================================
// HEALTH CHECK
// Required for Railway deployment
// ============================================

app.get("/api/health", (req: express.Request, res: express.Response) => {
  res.json({ status: "ok", timestamp: Date.now() })
})

// ============================================
// HTTP SERVER
// ============================================

const httpServer = createServer(app)

// ============================================
// SOCKET.IO SERVER
// This is the critical part Gemini got wrong
// CORS must point to your actual frontend URL
// not localhost in production
// ============================================

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      CLIENT_URL,
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
})

// ============================================
// SOCKET MIDDLEWARE
// Runs before every connection
// ============================================

io.use((socket, next) => {
  const sessionToken = socket.handshake.auth.sessionToken
  if (!sessionToken) {
    return next(new Error("No session token provided"))
  }
  next()
})

// ============================================
// SOCKET CONNECTION HANDLER
// ============================================

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`)

  // ============================================
  // ROOM EVENTS
  // ============================================

  socket.on("create-room", (payload) => {
    handleCreateRoom(io, socket, payload)
  })

  socket.on("join-room", (payload) => {
    handleJoinRoom(io, socket, payload)
  })

  socket.on("rejoin-room", (payload) => {
    handleRejoinRoom(io, socket, payload)
  })

  socket.on("player-ready", (payload) => {
    handlePlayerReady(io, socket, payload)
  })

  socket.on("start-game", (payload) => {
    handleStartGame(io, socket, payload)
  })

  // ============================================
  // GAME EVENTS
  // ============================================

  socket.on("roll-dice", (payload) => {
    handleRollDice(io, socket, payload)
  })

  socket.on("move-token", (payload) => {
    handleMoveToken(io, socket, payload)
  })

  // ============================================
  // EMOJI REACTIONS
  // ============================================

  socket.on("send-emoji", (payload: { roomCode: string; emoji: string }) => {
    const { playerId, roomCode } = socket.data
    if (!playerId || !roomCode || roomCode !== payload.roomCode) return
    const gameState = serverState.getGameState(roomCode)
    if (!gameState) return
    const player = gameState.players.find((p: { id: string; name: string }) => p.id === playerId)
    if (!player) return
    io.to(roomCode).emit("emoji-received", {
      playerId,
      playerName: player.name,
      emoji: payload.emoji,
    })
  })

  // ============================================
  // KEEPALIVE
  // ============================================

  socket.on("ping", () => {
    socket.emit("pong")
  })

  // ============================================
  // DISCONNECT
  // ============================================

  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected: ${socket.id} reason: ${reason}`)
    handleDisconnect(io, socket)
    rateLimiter.clearSocket(socket.id)
  })
})

// ============================================
// START SERVER
// ============================================

httpServer.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`)
  console.log(`Accepting connections from: ${CLIENT_URL}`)
  startCleanupJob()
})

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully")
  httpServer.close(() => {
    console.log("Server closed")
    process.exit(0)
  })
})

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully")
  httpServer.close(() => {
    console.log("Server closed")
    process.exit(0)
  })
})