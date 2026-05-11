import type { GameState, Player } from "@/types/game"
import { advanceTurn, getValidMoves } from "./gameEngine"

// ============================================
// GET NEXT CONNECTED PLAYER
// Finds the next player who is connected
// and hasn't finished yet
// ============================================

export function getNextConnectedPlayer(
  gameState: GameState
): Player | null {
  if (gameState.turnOrder.length === 0) return null

  const currentIndex = gameState.turnOrder.indexOf(
    gameState.currentTurn
  )

  for (let i = 1; i <= gameState.turnOrder.length; i++) {
    const nextIndex =
      (currentIndex + i) % gameState.turnOrder.length
    const nextPlayerId = gameState.turnOrder[nextIndex]
    const nextPlayer = gameState.players.find(
      (p) => p.id === nextPlayerId
    )

    if (
      nextPlayer &&
      nextPlayer.status === "connected" &&
      nextPlayer.finishPosition === null
    ) {
      return nextPlayer
    }
  }

  return null
}

// ============================================
// SHOULD SKIP TURN
// Returns true if current player's turn
// should be skipped automatically
// ============================================

export function shouldSkipTurn(gameState: GameState): boolean {
  const currentPlayer = gameState.players.find(
    (p) => p.id === gameState.currentTurn
  )

  if (!currentPlayer) return true

  // Skip if disconnected
  if (currentPlayer.status !== "connected") return true

  // Skip if finished
  if (currentPlayer.finishPosition !== null) return true

  return false
}

// ============================================
// GET TURN SKIP REASON
// ============================================

export type SkipReason =
  | "no-valid-moves"
  | "disconnected"
  | "triple-six"
  | "finished"

export function getTurnSkipReason(
  gameState: GameState,
  playerId: string
): SkipReason {
  const player = gameState.players.find((p) => p.id === playerId)

  if (!player) return "disconnected"
  if (player.status === "disconnected") return "disconnected"
  if (player.finishPosition !== null) return "finished"

  return "no-valid-moves"
}

// ============================================
// PROCESS AUTO SKIP
// Used when disconnected player's turn times out
// ============================================

export function processAutoSkip(
  gameState: GameState,
  playerId: string
): GameState {
  // Only skip if it's actually their turn
  if (gameState.currentTurn !== playerId) return gameState

  return advanceTurn(gameState)
}

// ============================================
// IS GAME EFFECTIVELY OVER
// Only one active connected player left
// ============================================

export function isGameEffectivelyOver(
  gameState: GameState
): boolean {
  if (gameState.status === "finished") return true

  const activePlayers = gameState.turnOrder.filter((id) => {
    const player = gameState.players.find((p) => p.id === id)
    return (
      player &&
      player.status !== "abandoned" &&
      player.finishPosition === null
    )
  })

  return activePlayers.length <= 1
}