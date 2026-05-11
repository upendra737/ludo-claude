// Unified production server: Next.js + Socket.IO on one port.
// Used by Railway (railway.toml) so both services share one public URL.
import { createServer } from "http"
import next from "next"
import { Server } from "socket.io"
import { config } from "dotenv"
import {
  handleCreateRoom,
  handleJoinRoom,
  handleRejoinRoom,
  handlePlayerReady,
  handleStartGame,
} from "./server/handlers/room"
import { handleRollDice, handleMoveToken } from "./server/handlers/game"
import { handleDisconnect } from "./server/handlers/disconnect"
import { rateLimiter } from "./server/rateLimiter"
import { startCleanupJob } from "./server/cleanup"
import { serverState } from "./server/state"

config({ path: ".env.local" })

const PORT = parseInt(process.env.PORT ?? "3000", 10)
const dev = process.env.NODE_ENV !== "production"
const CLIENT_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${PORT}`

async function main() {
  const app = next({ dev, port: PORT })
  const handle = app.getRequestHandler()

  await app.prepare()

  const httpServer = createServer((req, res) => {
    handle(req, res)
  })

  // Health check
  httpServer.on("request", (req, res) => {
    if (req.url === "/api/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ status: "ok", timestamp: Date.now() }))
    }
  })

  const io = new Server(httpServer, {
    cors: {
      origin: [CLIENT_ORIGIN, "http://localhost:3000"].filter(Boolean),
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
  })

  io.use((socket, next) => {
    const sessionToken = socket.handshake.auth.sessionToken
    if (!sessionToken) return next(new Error("No session token provided"))
    next()
  })

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`)

    socket.on("create-room", (payload) => handleCreateRoom(io, socket, payload))
    socket.on("join-room", (payload) => handleJoinRoom(io, socket, payload))
    socket.on("rejoin-room", (payload) => handleRejoinRoom(io, socket, payload))
    socket.on("player-ready", (payload) => handlePlayerReady(io, socket, payload))
    socket.on("start-game", (payload) => handleStartGame(io, socket, payload))
    socket.on("roll-dice", (payload) => handleRollDice(io, socket, payload))
    socket.on("move-token", (payload) => handleMoveToken(io, socket, payload))

    socket.on("send-emoji", (payload: { roomCode: string; emoji: string }) => {
      const { playerId, roomCode } = socket.data
      if (!playerId || !roomCode || roomCode !== payload.roomCode) return
      const gameState = serverState.getGameState(roomCode)
      if (!gameState) return
      const player = gameState.players.find(
        (p: { id: string; name: string }) => p.id === playerId
      )
      if (!player) return
      io.to(roomCode).emit("emoji-received", {
        playerId,
        playerName: player.name,
        emoji: payload.emoji,
      })
    })

    socket.on("ping", () => socket.emit("pong"))

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} reason: ${reason}`)
      handleDisconnect(io, socket)
      rateLimiter.clearSocket(socket.id)
    })
  })

  httpServer.listen(PORT, () => {
    console.log(`Unified server running on port ${PORT} (${dev ? "dev" : "production"})`)
    startCleanupJob()
  })

  process.on("SIGTERM", () => {
    httpServer.close(() => {
      console.log("Server closed")
      process.exit(0)
    })
  })
}

main().catch((err) => {
  console.error("Server failed to start:", err)
  process.exit(1)
})
