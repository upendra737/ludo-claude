import type { GameState, Player } from "./game"

// ============================================
// API: POST /api/room — create a room
// ============================================

export interface CreateRoomRequest {
  name: string
  sessionToken: string
}

export interface CreateRoomResponse {
  success: boolean
  code?: string
  error?: string
}

// ============================================
// API: GET /api/room/[code] — validate room
// ============================================

export interface GetRoomResponse {
  success: boolean
  exists?: boolean
  status?: string
  playerCount?: number
  maxPlayers?: number
  error?: string
}

// ============================================
// API: GET /api/health — Railway healthcheck
// ============================================

export interface HealthResponse {
  status: "ok"
  timestamp: number
}