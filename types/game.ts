// ============================================
// CORE PRIMITIVES
// ============================================

export type Color = "red" | "green" | "yellow" | "blue"

export type TokenState = "home" | "active" | "finished"

export type GameStatus =
  | "waiting"
  | "starting"
  | "active"
  | "finished"

export type PlayerStatus =
  | "connected"
  | "disconnected"
  | "abandoned"

// ============================================
// TOKEN
// Position system:
// 0        = home base (not on board yet)
// 1–52     = outer shared path (clockwise)
// 53–57    = color-specific home column (5 squares)
// 58       = finished (center)
// ============================================

export interface Token {
  id: string        // e.g. "red-0", "red-1", "red-2", "red-3"
  color: Color
  position: number  // 0-58
  state: TokenState
}

// ============================================
// PLAYER
// ============================================

export interface Player {
  id: string
  name: string
  color: Color
  slot: 1 | 2 | 3 | 4
  isHost: boolean
  isReady: boolean
  status: PlayerStatus
  sessionToken: string
  finishPosition: number | null  // 1st, 2nd, 3rd, 4th
  tokens: Token[]
}

// ============================================
// GAME STATE
// This is the single source of truth for
// the entire game — lives on the server,
// synced to all clients on every change
// ============================================

export interface GameState {
  roomCode: string
  status: GameStatus
  players: Player[]           // 2–4 players
  currentTurn: string         // playerId whose turn it is
  turnOrder: string[]         // playerIds in order, cycles
  lastDiceValue: number | null
  consecutiveSixes: number    // resets on non-6, forfeit at 3
  validMoves: string[]        // tokenIds the current player can move
  finishOrder: string[]       // playerIds as they complete
  moveCount: number
  createdAt: number           // unix timestamp
  lastActivityAt: number      // unix timestamp
}

// ============================================
// ROOM
// ============================================

export interface Room {
  id: string
  code: string
  status: GameStatus
  hostId: string
  minPlayers: number
  maxPlayers: number
  createdAt: number
  expiresAt: number
}

// ============================================
// CONSTANTS
// ============================================

// Which outer path square each color starts on
export const START_SQUARES: Record<Color, number> = {
  red: 1,
  green: 14,
  yellow: 27,
  blue: 40,
}

// Which outer path square each color enters
// their home column from
export const HOME_ENTRY_SQUARES: Record<Color, number> = {
  red: 51,
  green: 12,
  yellow: 25,
  blue: 38,
}

// Safe squares where tokens cannot be captured
export const SAFE_SQUARE_POSITIONS = [
  1, 9, 14, 22, 27, 35, 40, 48,
] as const

// Color assigned by join order
export const SLOT_COLORS: Record<1 | 2 | 3 | 4, Color> = {
  1: "red",
  2: "green",
  3: "yellow",
  4: "blue",
}