import type { Color } from "@/types/game"

// ============================================
// BOARD CONSTANTS
// ============================================

// Total squares on the outer shared path
export const OUTER_PATH_LENGTH = 52

// Home column length (squares 53-57)
export const HOME_COLUMN_LENGTH = 5

// Position when a token is finished
export const FINISHED_POSITION = 58

// Position when a token is at home base
export const HOME_BASE_POSITION = 0

// ============================================
// SAFE SQUARES
// Tokens on these squares cannot be captured
// ============================================

export const SAFE_SQUARES = new Set([
  1, 9, 14, 22, 27, 35, 40, 48,
])

// ============================================
// START SQUARES
// The outer path square each color starts on
// when leaving home base
// ============================================

export const START_SQUARES: Record<Color, number> = {
  red: 1,
  green: 14,
  yellow: 27,
  blue: 40,
}

// ============================================
// HOME ENTRY SQUARES
// The outer path square just before each
// color enters their home column
// ============================================

export const HOME_ENTRY_SQUARES: Record<Color, number> = {
  red: 51,
  green: 12,
  yellow: 25,
  blue: 38,
}

// ============================================
// HOME COLUMN START
// The position number where each color's
// home column begins (position 53)
// All colors share positions 53-57
// for their own home column
// ============================================

export const HOME_COLUMN_START = 53

// ============================================
// DICE RULES
// ============================================

export const MAX_CONSECUTIVE_SIXES = 3
export const DICE_MIN = 1
export const DICE_MAX = 6

// ============================================
// TIMING
// ============================================

// Seconds before a disconnected player is
// considered abandoned
export const DISCONNECT_TIMEOUT_SECS = 60

// Seconds to auto-skip a disconnected
// player's turn
export const DISCONNECTED_TURN_SKIP_SECS = 10

// Minutes before an inactive room expires
export const ROOM_EXPIRY_HOURS = 2

// ============================================
// HELPER FUNCTIONS
// ============================================

export function isSafeSquare(position: number): boolean {
  return SAFE_SQUARES.has(position)
}

export function isHomeColumn(position: number): boolean {
  return position >= HOME_COLUMN_START && position < FINISHED_POSITION
}

export function isFinished(position: number): boolean {
  return position === FINISHED_POSITION
}

export function isOnBoard(position: number): boolean {
  return position >= 1 && position <= OUTER_PATH_LENGTH
}

export function isAtHomeBase(position: number): boolean {
  return position === HOME_BASE_POSITION
}

// Get the outer path position relative to
// a color's perspective (1 = their start square)
export function getRelativePosition(
  absolutePosition: number,
  color: Color
): number {
  const start = START_SQUARES[color]
  if (absolutePosition < start) {
    return absolutePosition + OUTER_PATH_LENGTH - start + 1
  }
  return absolutePosition - start + 1
}