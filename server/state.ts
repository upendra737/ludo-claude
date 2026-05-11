import type { GameState } from "@/types/game"

// ============================================
// IN-MEMORY GAME STATE
// This is the source of truth during a game
// DB is synced async after every move
// Key = roomCode, Value = GameState
// ============================================

interface RoomState {
  gameState: GameState
  disconnectTimers: Map<string, NodeJS.Timeout>
  turnSkipTimers: Map<string, NodeJS.Timeout>
}

class ServerState {
  private rooms = new Map<string, RoomState>()

  // ============================================
  // ROOM OPERATIONS
  // ============================================

  hasRoom(roomCode: string): boolean {
    return this.rooms.has(roomCode)
  }

  getRoom(roomCode: string): RoomState | null {
    return this.rooms.get(roomCode) ?? null
  }

  getGameState(roomCode: string): GameState | null {
    return this.rooms.get(roomCode)?.gameState ?? null
  }

  setGameState(roomCode: string, gameState: GameState): void {
    const existing = this.rooms.get(roomCode)
    if (existing) {
      existing.gameState = gameState
    } else {
      this.rooms.set(roomCode, {
        gameState,
        disconnectTimers: new Map(),
        turnSkipTimers: new Map(),
      })
    }
  }

  deleteRoom(roomCode: string): void {
    const room = this.rooms.get(roomCode)
    if (room) {
      // Clear all timers
      room.disconnectTimers.forEach((timer) => clearTimeout(timer))
      room.turnSkipTimers.forEach((timer) => clearTimeout(timer))
    }
    this.rooms.delete(roomCode)
  }

  // ============================================
  // DISCONNECT TIMERS
  // 60s before player is considered abandoned
  // ============================================

  setDisconnectTimer(
    roomCode: string,
    playerId: string,
    timer: NodeJS.Timeout
  ): void {
    const room = this.rooms.get(roomCode)
    if (room) {
      // Clear existing timer first
      const existing = room.disconnectTimers.get(playerId)
      if (existing) clearTimeout(existing)
      room.disconnectTimers.set(playerId, timer)
    }
  }

  clearDisconnectTimer(roomCode: string, playerId: string): void {
    const room = this.rooms.get(roomCode)
    if (room) {
      const timer = room.disconnectTimers.get(playerId)
      if (timer) {
        clearTimeout(timer)
        room.disconnectTimers.delete(playerId)
      }
    }
  }

  // ============================================
  // TURN SKIP TIMERS
  // 10s auto-skip when disconnected player's
  // turn comes around
  // ============================================

  setTurnSkipTimer(
    roomCode: string,
    playerId: string,
    timer: NodeJS.Timeout
  ): void {
    const room = this.rooms.get(roomCode)
    if (room) {
      const existing = room.turnSkipTimers.get(playerId)
      if (existing) clearTimeout(existing)
      room.turnSkipTimers.set(playerId, timer)
    }
  }

  clearTurnSkipTimer(roomCode: string, playerId: string): void {
    const room = this.rooms.get(roomCode)
    if (room) {
      const timer = room.turnSkipTimers.get(playerId)
      if (timer) {
        clearTimeout(timer)
        room.turnSkipTimers.delete(playerId)
      }
    }
  }

  // ============================================
  // CLEANUP
  // ============================================

  getAllRoomCodes(): string[] {
    return Array.from(this.rooms.keys())
  }

  getRoomCount(): number {
    return this.rooms.size
  }
}

// Singleton instance
export const serverState = new ServerState()