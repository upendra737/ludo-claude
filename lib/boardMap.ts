import type { Color } from "@/types/game"
import { START_SQUARES, HOME_COLUMN_START, FINISHED_POSITION } from "./rules"

// ============================================
// PIXEL COORDINATES
// Based on our 630x630 SVG board
// offset 25px from edge
// each cell = 42px
// ============================================

export interface Position {
  x: number
  y: number
}

// ============================================
// OUTER PATH COORDINATES
// 52 squares going clockwise
// Starting from square 1 (red start)
// ============================================

// These are the center pixel coordinates
// of each outer path square
// Index 0 = position 1, index 51 = position 52
const OUTER_PATH: Position[] = [
  // Column 6 going down (squares 1-6) — left of center top
  { x: 298, y: 46 },   // 1  red start + safe
  { x: 298, y: 88 },   // 2
  { x: 298, y: 130 },  // 3
  { x: 298, y: 172 },  // 4
  { x: 298, y: 214 },  // 5
  { x: 298, y: 256 },  // 6

  // Row 6 going left (squares 7-8)
  { x: 256, y: 298 },  // 7
  { x: 214, y: 298 },  // 8

  // Square 9 safe
  { x: 172, y: 298 },  // 9  safe
  { x: 130, y: 298 },  // 10
  { x: 88, y: 298 },   // 11
  { x: 46, y: 298 },   // 12

  // Row 7 far left going down
  { x: 46, y: 340 },   // 13

  // Row 8 going right (squares 14-18)
  { x: 46, y: 382 },   // 14 green start + safe
  { x: 88, y: 382 },   // 15
  { x: 130, y: 382 },  // 16
  { x: 172, y: 382 },  // 17
  { x: 214, y: 382 },  // 18

  // Column 5 going down (squares 19-21)
  { x: 256, y: 382 },  // 19
  { x: 256, y: 424 },  // 20
  { x: 256, y: 466 },  // 21

  // Square 22 safe
  { x: 256, y: 508 },  // 22 safe
  { x: 256, y: 550 },  // 23
  { x: 256, y: 592 },  // 24

  // Bottom going right
  { x: 298, y: 634 },  // 25
  { x: 340, y: 634 },  // 26

  // Square 27 yellow start
  { x: 382, y: 634 },  // 27 yellow start + safe
  { x: 382, y: 592 },  // 28
  { x: 382, y: 550 },  // 29
  { x: 382, y: 508 },  // 30

  // Square 35 safe
  { x: 382, y: 466 },  // 31
  { x: 382, y: 424 },  // 32
  { x: 382, y: 382 },  // 33
  { x: 424, y: 382 },  // 34

  // Square 35 safe
  { x: 466, y: 382 },  // 35 safe
  { x: 508, y: 382 },  // 36
  { x: 550, y: 382 },  // 37
  { x: 592, y: 382 },  // 38

  // Right side going up
  { x: 634, y: 382 },  // 39
  { x: 634, y: 340 },  // 40 blue start + safe
  { x: 634, y: 298 },  // 41

  // Row 6 going left from right
  { x: 592, y: 298 },  // 42
  { x: 550, y: 298 },  // 43
  { x: 508, y: 298 },  // 44
  { x: 466, y: 298 },  // 45
  { x: 424, y: 298 },  // 46

  // Square 48 safe
  { x: 382, y: 298 },  // 47
  { x: 382, y: 256 },  // 48 safe
  { x: 382, y: 214 },  // 49
  { x: 382, y: 172 },  // 50
  { x: 382, y: 130 },  // 51
  { x: 382, y: 88 },   // 52
]

// ============================================
// HOME COLUMN COORDINATES
// Positions 53-57 per color
// Leading to the center
// ============================================

const HOME_COLUMNS: Record<Color, Position[]> = {
  red: [
    { x: 340, y: 298 }, // 53
    { x: 340, y: 340 }, // 54
    { x: 340, y: 382 }, // 55 -- wait these need to go toward center
    { x: 340, y: 256 }, // 53 red goes down from top
    { x: 340, y: 214 }, // 54
    { x: 340, y: 172 }, // 55
    { x: 340, y: 130 }, // 56 -- wrong, let me redo
  ],
  green: [],
  yellow: [],
  blue: [],
}

// ============================================
// CORRECTED HOME COLUMNS
// Red enters from top, goes down to center
// Green enters from left, goes right to center
// Yellow enters from bottom, goes up to center
// Blue enters from right, goes left to center
// ============================================

const CORRECTED_HOME_COLUMNS: Record<Color, Position[]> = {
  red: [
    { x: 340, y: 256 }, // 53
    { x: 340, y: 214 }, // 54
    { x: 340, y: 172 }, // 55
    { x: 340, y: 130 }, // 56
    { x: 340, y: 88 },  // 57
  ],
  green: [
    { x: 88, y: 340 },  // 53
    { x: 130, y: 340 }, // 54
    { x: 172, y: 340 }, // 55
    { x: 214, y: 340 }, // 56
    { x: 256, y: 340 }, // 57
  ],
  yellow: [
    { x: 340, y: 424 }, // 53
    { x: 340, y: 466 }, // 54
    { x: 340, y: 508 }, // 55
    { x: 340, y: 550 }, // 56
    { x: 340, y: 592 }, // 57
  ],
  blue: [
    { x: 592, y: 340 }, // 53
    { x: 550, y: 340 }, // 54
    { x: 508, y: 340 }, // 55
    { x: 466, y: 340 }, // 56
    { x: 424, y: 340 }, // 57
  ],
}

// Center finish position
const CENTER: Position = { x: 340, y: 340 }

// Home base positions for each token
// 4 tokens per color in their home zone
const HOME_BASE_POSITIONS: Record<Color, Position[]> = {
  red: [
    { x: 97, y: 97 },
    { x: 181, y: 97 },
    { x: 97, y: 181 },
    { x: 181, y: 181 },
  ],
  green: [
    { x: 499, y: 97 },
    { x: 583, y: 97 },
    { x: 499, y: 181 },
    { x: 583, y: 181 },
  ],
  yellow: [
    { x: 97, y: 499 },
    { x: 181, y: 499 },
    { x: 97, y: 583 },
    { x: 181, y: 583 },
  ],
  blue: [
    { x: 499, y: 499 },
    { x: 583, y: 499 },
    { x: 499, y: 583 },
    { x: 583, y: 583 },
  ],
}

// ============================================
// MAIN EXPORT FUNCTION
// Given a color, token index (0-3),
// and position (0-58), returns pixel coords
// ============================================

export function getPixelPosition(
  color: Color,
  tokenIndex: number,
  position: number
): Position {
  // At home base
  if (position === 0) {
    return HOME_BASE_POSITIONS[color][tokenIndex]
  }

  // Finished at center
  if (position === 58) {
    return CENTER
  }

  // In home column (53-57)
  if (position >= HOME_COLUMN_START && position < 58) {
    const colIndex = position - HOME_COLUMN_START // 0-4
    return CORRECTED_HOME_COLUMNS[color][colIndex]
  }

  // On outer path (1-52)
  return OUTER_PATH[position - 1]
}

// ============================================
// CALCULATE NEXT POSITION
// Given current position, dice value and color,
// returns the new position number
// Returns null if move is not possible
// ============================================

export function calculateNextPosition(
  currentPosition: number,
  diceValue: number,
  color: Color
): number | null {
  // Cannot move from home without a 6
  if (currentPosition === 0) {
    if (diceValue === 6) {
      return START_SQUARES[color]
    }
    return null
  }

  // Already finished
  if (currentPosition === 58) {
    return null
  }

  // In home column
  if (currentPosition >= HOME_COLUMN_START) {
    const newPosition = currentPosition + diceValue
    // Cannot overshoot finish
    if (newPosition > 58) return null
    return newPosition
  }

  // On outer path
  const homeEntry = getHomeEntrySquare(color)
  const newPosition = ((currentPosition - 1 + diceValue) % 52) + 1

  // Check if token passes or lands on home entry
  const stepsToEntry = getStepsToEntry(currentPosition, color)
  if (diceValue === stepsToEntry + 1) {
    // Enters home column at position 53
    return HOME_COLUMN_START
  } else if (diceValue > stepsToEntry + 1) {
    // Goes into home column
    const stepsIntoColumn = diceValue - stepsToEntry - 1
    if (HOME_COLUMN_START + stepsIntoColumn > 58) return null
    return HOME_COLUMN_START + stepsIntoColumn
  }

  return newPosition
}

// How many steps from current position
// to the home entry square
function getStepsToEntry(
  currentPosition: number,
  color: Color
): number {
  const entry = getHomeEntrySquare(color)
  if (currentPosition <= entry) {
    return entry - currentPosition
  }
  return 52 - currentPosition + entry
}

function getHomeEntrySquare(color: Color): number {
  const entries: Record<Color, number> = {
    red: 51,
    green: 12,
    yellow: 25,
    blue: 38,
  }
  return entries[color]
}

export { HOME_BASE_POSITIONS, CORRECTED_HOME_COLUMNS, OUTER_PATH }