import type {
  GameState,
  Player,
  Color,
} from "./game"

// ============================================
// EVENTS: CLIENT → SERVER
// ============================================

export interface ClientToServerEvents {
  "create-room": (payload: {
    name: string
    sessionToken: string
  }) => void

  "join-room": (payload: {
    code: string
    name: string
    sessionToken: string
  }) => void

  "rejoin-room": (payload: {
    code: string
    sessionToken: string
  }) => void

  "player-ready": (payload: {
    roomCode: string
  }) => void

  "start-game": (payload: {
    roomCode: string
  }) => void

  "roll-dice": (payload: {
    roomCode: string
  }) => void

  "move-token": (payload: {
    roomCode: string
    tokenId: string
  }) => void

  "send-emoji": (payload: {
    roomCode: string
    emoji: string
  }) => void

  ping: () => void
}

// ============================================
// EVENTS: SERVER → CLIENT
// ============================================

export interface ServerToClientEvents {
  "room-created": (payload: {
    code: string
    player: Player
    sessionToken: string
    gameState: GameState
  }) => void

  "room-joined": (payload: {
    player: Player
    sessionToken: string
    gameState: GameState
  }) => void

  "player-joined": (payload: {
    player: Player
  }) => void

  "player-ready-update": (payload: {
    playerId: string
    isReady: boolean
  }) => void

  "game-start": (payload: {
    gameState: GameState
  }) => void

  "dice-rolled": (payload: {
    value: number
    validMoves: string[]
    consecutiveSixes: number
  }) => void

  "token-moved": (payload: {
    gameState: GameState
    capturedTokenIds: string[]
  }) => void

  "turn-changed": (payload: {
    playerId: string
  }) => void

  "turn-skipped": (payload: {
    playerId: string
    reason: "no-valid-moves" | "disconnected" | "triple-six"
  }) => void

  "player-finished": (payload: {
    playerId: string
    position: number
  }) => void

  "game-over": (payload: {
    finishOrder: string[]
  }) => void

  "game-state-sync": (payload: {
    gameState: GameState
  }) => void

  "emoji-received": (payload: {
    playerId: string
    playerName: string
    emoji: string
  }) => void

  "player-disconnected": (payload: {
    playerId: string
    timeoutSecs: number
  }) => void

  "player-reconnected": (payload: {
    playerId: string
  }) => void

  "player-abandoned": (payload: {
    playerId: string
  }) => void

  "host-transferred": (payload: {
    newHostId: string
  }) => void

  "room-error": (payload: {
    code:
      | "room-not-found"
      | "room-full"
      | "game-in-progress"
      | "invalid-session"
      | "not-your-turn"
      | "invalid-move"
      | "not-host"
      | "already-in-room"
    message: string
  }) => void

  pong: () => void
}

// ============================================
// SOCKET DATA (attached to each socket)
// ============================================

export interface SocketData {
  playerId: string
  roomCode: string
  sessionToken: string
}
