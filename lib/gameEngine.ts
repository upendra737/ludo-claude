import type { GameState, Player, Token, Color } from "@/types/game"
import {
  SAFE_SQUARES,
  START_SQUARES,
  HOME_COLUMN_START,
  FINISHED_POSITION,
  HOME_BASE_POSITION,
  MAX_CONSECUTIVE_SIXES,
  DICE_MIN,
  DICE_MAX,
  isSafeSquare,
  isHomeColumn,
  isFinished,
  isAtHomeBase,
  getRelativePosition,
} from "./rules"
import { calculateNextPosition } from "./boardMap"

// ============================================
// DICE
// Always rolled server-side — never trust
// the client with this
// ============================================

export function rollDice(): number {
  return Math.floor(Math.random() * DICE_MAX) + DICE_MIN
}

// ============================================
// CREATE INITIAL TOKENS
// 4 tokens per player, all start at home base
// ============================================

export function createInitialTokens(color: Color): Token[] {
  return [0, 1, 2, 3].map((index) => ({
    id: `${color}-${index}`,
    color,
    position: HOME_BASE_POSITION,
    state: "home" as const,
  }))
}

// ============================================
// CREATE INITIAL GAME STATE
// Called when host presses start
// ============================================

export function createInitialGameState(
  roomCode: string,
  players: Player[]
): GameState {
  // Turn order follows slot order
  const turnOrder = [...players]
    .sort((a, b) => a.slot - b.slot)
    .map((p) => p.id)

  const now = Date.now()

  return {
    roomCode,
    status: "active",
    players: players.map((p) => ({
      ...p,
      tokens: createInitialTokens(p.color),
      isReady: false,
      status: "connected",
      finishPosition: null,
    })),
    currentTurn: turnOrder[0],
    turnOrder,
    lastDiceValue: null,
    consecutiveSixes: 0,
    validMoves: [],
    finishOrder: [],
    moveCount: 0,
    createdAt: now,
    lastActivityAt: now,
  }
}

// ============================================
// GET VALID MOVES
// Returns tokenIds the current player can move
// given the dice value rolled
// ============================================

export function getValidMoves(
  gameState: GameState,
  playerId: string,
  diceValue: number
): string[] {
  const player = gameState.players.find((p) => p.id === playerId)
  if (!player) return []

  const validTokenIds: string[] = []

  for (const token of player.tokens) {
    // Skip finished tokens
    if (token.state === "finished") continue

    // Token at home base — only moveable with a 6
    if (token.state === "home") {
      if (diceValue === 6) {
        validTokenIds.push(token.id)
      }
      continue
    }

    // Token is active on the board
    const newPosition = calculateNextPosition(
      token.position,
      diceValue,
      player.color
    )

    if (newPosition === null) continue

    // Check if landing on own token that creates
    // a block at a non-safe square — still valid
    // but cannot land on own finished token
    if (newPosition === FINISHED_POSITION) {
      validTokenIds.push(token.id)
      continue
    }

    // Check if path is blocked by opponent block
    if (isBlockedByOpponent(gameState, player, token, diceValue)) {
      continue
    }

    validTokenIds.push(token.id)
  }

  return validTokenIds
}

// ============================================
// CHECK IF PATH IS BLOCKED
// Two opponent tokens on same square = block
// Cannot land on or pass through a block
// ============================================

function isBlockedByOpponent(
  gameState: GameState,
  currentPlayer: Player,
  token: Token,
  diceValue: number
): boolean {
  // Check each square between current and destination
  for (let step = 1; step <= diceValue; step++) {
    const checkPosition = calculateNextPosition(
      token.position,
      step,
      currentPlayer.color
    )

    if (checkPosition === null) break
    if (isHomeColumn(checkPosition)) break
    if (checkPosition === FINISHED_POSITION) break

    // Count opponent tokens at this position
    for (const opponent of gameState.players) {
      if (opponent.id === currentPlayer.id) continue

      const tokensAtPosition = opponent.tokens.filter(
        (t) => t.position === checkPosition && t.state === "active"
      )

      // Two or more opponent tokens = block
      if (tokensAtPosition.length >= 2) {
        return true
      }
    }
  }

  return false
}

// ============================================
// MOVE TOKEN
// Applies a token move to the game state
// Returns the new game state and any
// captured token IDs
// ============================================

export interface MoveResult {
  gameState: GameState
  capturedTokenIds: string[]
  playerFinished: boolean
  gameOver: boolean
}

export function moveToken(
  gameState: GameState,
  playerId: string,
  tokenId: string
): MoveResult {
  // Deep clone to avoid mutation
  const newState: GameState = JSON.parse(JSON.stringify(gameState))
  const capturedTokenIds: string[] = []

  const playerIndex = newState.players.findIndex((p) => p.id === playerId)
  if (playerIndex === -1) {
    return {
      gameState: newState,
      capturedTokenIds: [],
      playerFinished: false,
      gameOver: false,
    }
  }

  const player = newState.players[playerIndex]
  const tokenIndex = player.tokens.findIndex((t) => t.id === tokenId)
  if (tokenIndex === -1) {
    return {
      gameState: newState,
      capturedTokenIds: [],
      playerFinished: false,
      gameOver: false,
    }
  }

  const token = player.tokens[tokenIndex]
  const diceValue = newState.lastDiceValue!

  // Calculate new position
  const newPosition = calculateNextPosition(
    token.position,
    diceValue,
    player.color
  )

  if (newPosition === null) {
    return {
      gameState: newState,
      capturedTokenIds: [],
      playerFinished: false,
      gameOver: false,
    }
  }

  // Move the token
  const oldPosition = token.position
  token.position = newPosition

  // Update token state
  if (newPosition === FINISHED_POSITION) {
    token.state = "finished"
  } else if (newPosition === HOME_BASE_POSITION) {
    token.state = "home"
  } else {
    token.state = "active"
  }

  // Handle captures — only on outer path
  // not on safe squares, not in home column
  if (
    token.state === "active" &&
    !isSafeSquare(newPosition) &&
    !isHomeColumn(newPosition)
  ) {
    for (let i = 0; i < newState.players.length; i++) {
      if (newState.players[i].id === playerId) continue

      const opponent = newState.players[i]
      for (let j = 0; j < opponent.tokens.length; j++) {
        const opponentToken = opponent.tokens[j]

        if (
          opponentToken.position === newPosition &&
          opponentToken.state === "active"
        ) {
          // Capture — send back to home
          opponentToken.position = HOME_BASE_POSITION
          opponentToken.state = "home"
          capturedTokenIds.push(opponentToken.id)
        }
      }
    }
  }

  // Check if player finished all tokens
  const playerFinished = player.tokens.every(
    (t) => t.state === "finished"
  )

  if (playerFinished) {
    const finishPosition = newState.finishOrder.length + 1
    player.finishPosition = finishPosition
    newState.finishOrder.push(playerId)

    // Remove from turn order
    newState.turnOrder = newState.turnOrder.filter(
      (id) => id !== playerId
    )
  }

  // Check if game is over
  // Game over when only 1 or 0 active players remain
  const activePlayers = newState.turnOrder.filter((id) => {
    const p = newState.players.find((pl) => pl.id === id)
    return p && p.status !== "abandoned"
  })

  let gameOver = false
  if (activePlayers.length <= 1) {
    // Assign last place to remaining player
    if (activePlayers.length === 1) {
      const lastPlayerId = activePlayers[0]
      const lastPlayer = newState.players.find(
        (p) => p.id === lastPlayerId
      )
      if (lastPlayer) {
        lastPlayer.finishPosition = newState.finishOrder.length + 1
        newState.finishOrder.push(lastPlayerId)
      }
    }
    newState.status = "finished"
    gameOver = true
  }

  // Update activity timestamp
  newState.lastActivityAt = Date.now()
  newState.moveCount += 1

  return {
    gameState: newState,
    capturedTokenIds,
    playerFinished,
    gameOver,
  }
}

// ============================================
// SEND FARTHEST TOKEN HOME
// Used for triple-six penalty
// Returns the tokenId sent home, or null
// ============================================

function getProgressScore(position: number, color: Color): number {
  if (position === 0 || position === 58) return -1
  if (position >= 53) return 52 + (position - 52)
  return getRelativePosition(position, color)
}

function sendFarthestTokenHome(
  gameState: GameState,
  playerId: string
): string | null {
  const player = gameState.players.find((p) => p.id === playerId)
  if (!player) return null

  const candidates = player.tokens.filter(
    (t) => t.state === "active" || t.state === "home"
  )

  if (candidates.length === 0) return null

  // Prefer active tokens; only use a home token if nothing is active
  const activeTokens = candidates.filter((t) => t.state === "active")
  const pool = activeTokens.length > 0 ? activeTokens : candidates

  const farthest = pool.reduce((best, token) => {
    const bestScore = getProgressScore(best.position, player.color)
    const score = getProgressScore(token.position, player.color)
    return score > bestScore ? token : best
  })

  farthest.position = 0
  farthest.state = "home"
  return farthest.id
}

// ============================================
// PROCESS DICE ROLL
// Handles consecutive sixes logic and
// returns updated state + valid moves
// ============================================

export interface DiceResult {
  gameState: GameState
  diceValue: number
  validMoves: string[]
  turnForfeited: boolean
  penaltyTokenId?: string
}

export function processDiceRoll(
  gameState: GameState,
  playerId: string
): DiceResult {
  const newState: GameState = JSON.parse(JSON.stringify(gameState))
  const diceValue = rollDice()

  // Track consecutive sixes
  if (diceValue === 6) {
    newState.consecutiveSixes += 1
  } else {
    newState.consecutiveSixes = 0
  }

  newState.lastDiceValue = diceValue

  // Triple six — send farthest active token back home, forfeit turn
  if (newState.consecutiveSixes >= MAX_CONSECUTIVE_SIXES) {
    newState.consecutiveSixes = 0
    newState.lastDiceValue = null

    const penaltyTokenId = sendFarthestTokenHome(newState, playerId)
    const nextState = advanceTurn(newState)

    return {
      gameState: nextState,
      diceValue,
      validMoves: [],
      turnForfeited: true,
      penaltyTokenId: penaltyTokenId ?? undefined,
    }
  }

  // Get valid moves for this roll
  const validMoves = getValidMoves(newState, playerId, diceValue)
  newState.validMoves = validMoves

  return {
    gameState: newState,
    diceValue,
    validMoves,
    turnForfeited: false,
  }
}

// ============================================
// ADVANCE TURN
// Moves to the next player in turn order
// Skips disconnected and finished players
// ============================================

export function advanceTurn(gameState: GameState): GameState {
  const newState: GameState = JSON.parse(JSON.stringify(gameState))

  if (newState.turnOrder.length === 0) return newState

  const currentIndex = newState.turnOrder.indexOf(newState.currentTurn)
  let nextIndex = (currentIndex + 1) % newState.turnOrder.length

  // Skip disconnected players
  let attempts = 0
  while (attempts < newState.turnOrder.length) {
    const nextPlayerId = newState.turnOrder[nextIndex]
    const nextPlayer = newState.players.find(
      (p) => p.id === nextPlayerId
    )

    if (
      nextPlayer &&
      nextPlayer.status === "connected" &&
      nextPlayer.finishPosition === null
    ) {
      break
    }

    nextIndex = (nextIndex + 1) % newState.turnOrder.length
    attempts++
  }

  newState.currentTurn = newState.turnOrder[nextIndex]
  newState.validMoves = []
  newState.lastDiceValue = null
  newState.consecutiveSixes = 0
  newState.lastActivityAt = Date.now()

  return newState
}

// ============================================
// SHOULD GET EXTRA TURN
// Player gets extra turn on:
// - Rolling a 6
// - Capturing an opponent token
// ============================================

export function shouldGetExtraTurn(
  diceValue: number,
  capturedTokenIds: string[]
): boolean {
  return diceValue === 6 || capturedTokenIds.length > 0
}

// ============================================
// GET PLAYER BY SESSION TOKEN
// ============================================

export function getPlayerBySessionToken(
  gameState: GameState,
  sessionToken: string
): Player | null {
  return (
    gameState.players.find((p) => p.sessionToken === sessionToken) ??
    null
  )
}

// ============================================
// UPDATE PLAYER STATUS
// ============================================

export function updatePlayerStatus(
  gameState: GameState,
  playerId: string,
  status: Player["status"]
): GameState {
  const newState: GameState = JSON.parse(JSON.stringify(gameState))
  const player = newState.players.find((p) => p.id === playerId)
  if (player) {
    player.status = status
  }
  return newState
}

// ============================================
// REMOVE PLAYER FROM TURN ORDER
// Used when player abandons
// ============================================

export function removeFromTurnOrder(
  gameState: GameState,
  playerId: string
): GameState {
  const newState: GameState = JSON.parse(JSON.stringify(gameState))
  newState.turnOrder = newState.turnOrder.filter(
    (id) => id !== playerId
  )

  // If it was this player's turn advance to next
  if (newState.currentTurn === playerId && newState.turnOrder.length > 0) {
    newState.currentTurn = newState.turnOrder[0]
  }

  return newState
}

// ============================================
// CHECK IF ROOM HAS ENOUGH PLAYERS TO START
// ============================================

export function canStartGame(players: Player[]): boolean {
  const connectedPlayers = players.filter(
    (p) => p.status === "connected"
  )
  const readyPlayers = players.filter((p) => p.isReady)

  return (
    connectedPlayers.length >= 2 &&
    connectedPlayers.length === readyPlayers.length
  )
}

// ============================================
// VALIDATE MOVE
// Double checks a move is valid before
// applying it — never trust client
// ============================================

export function validateMove(
  gameState: GameState,
  playerId: string,
  tokenId: string
): boolean {
  // Must be this player's turn
  if (gameState.currentTurn !== playerId) return false

  // Must have rolled dice
  if (gameState.lastDiceValue === null) return false

  // Token must be in valid moves list
  if (!gameState.validMoves.includes(tokenId)) return false

  // Player must exist and be connected
  const player = gameState.players.find((p) => p.id === playerId)
  if (!player || player.status !== "connected") return false

  // Token must belong to this player
  const token = player.tokens.find((t) => t.id === tokenId)
  if (!token) return false

  return true
}