'use client'
import { useMemo } from 'react'
import { LudoBoard, COLORS } from '@/components/Board/LudoBoard'
import { Token, getStackOffset } from '@/components/Board/Token'
import { Dice3D } from './Dice3D'
import { PlayerCard } from './PlayerCard'
import { EmojiPanel } from './EmojiPanel'
import { useGameStore } from '@/store/gameStore'
import type { Token as TokenType, Player } from '@/types/game'

interface GameBoardProps {
  onRoll: () => void
  onMoveToken: (tokenId: string) => void
  onSendEmoji: (emoji: string) => void
}

// Group tokens by board position for stacking
function groupByPosition(players: Player[]) {
  const map = new Map<number, { token: TokenType; player: Player; tokenIndex: number }[]>()
  for (const player of players) {
    player.tokens.forEach((token, idx) => {
      const key = token.position
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push({ token, player, tokenIndex: idx })
    })
  }
  return map
}

export function GameBoard({ onRoll, onMoveToken, onSendEmoji }: GameBoardProps) {
  const gameState = useGameStore((s) => s.gameState)
  const myPlayerId = useGameStore((s) => s.myPlayerId)
  const diceValue = useGameStore((s) => s.diceValue)
  const diceRolling = useGameStore((s) => s.diceRolling)
  const consecutiveSixes = useGameStore((s) => s.consecutiveSixes)

  const groups = useMemo(
    () => (gameState ? groupByPosition(gameState.players) : new Map()),
    [gameState]
  )

  if (!gameState) return null

  const isMyTurn = gameState.currentTurn === myPlayerId
  const hasRolled = gameState.lastDiceValue !== null
  const canRoll = isMyTurn && !hasRolled && !diceRolling
  const currentPlayer = gameState.players.find((p) => p.id === gameState.currentTurn)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950
                    flex flex-col lg:flex-row items-center justify-center gap-4 p-4 select-none">

      {/* ── Left panel: players (desktop) ── */}
      <div className="hidden lg:flex flex-col gap-3 w-56">
        {gameState.players
          .filter((_, i) => i % 2 === 0)
          .map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isCurrentTurn={gameState.currentTurn === player.id}
              isMe={player.id === myPlayerId}
            />
          ))}
      </div>

      {/* ── Board ── */}
      <div className="relative flex flex-col items-center gap-4">
        {/* Current turn banner */}
        <div className="flex items-center gap-2">
          {gameState.players.map((p) => (
            <PlayerCard key={p.id} player={p}
              isCurrentTurn={gameState.currentTurn === p.id}
              isMe={p.id === myPlayerId}
              compact />
          ))}
        </div>

        {/* Board with tokens */}
        <div className="relative w-full" style={{ maxWidth: 580 }}>
          <LudoBoard>
            {/* Render tokens grouped by position */}
            {Array.from(groups.entries()).flatMap(([_pos, items]) =>
              items.map(({ token, player, tokenIndex }: { token: import('@/types/game').Token; player: import('@/types/game').Player; tokenIndex: number }, stackIdx: number) => {
                const validMoves = gameState.validMoves ?? []
                const isValidMove = validMoves.includes(token.id)
                const isMyToken = player.id === myPlayerId
                const offset = getStackOffset(items.length, stackIdx)

                return (
                  <Token
                    key={token.id}
                    token={token}
                    tokenIndex={tokenIndex}
                    isValidMove={isValidMove}
                    isMyToken={isMyToken}
                    onClick={() => onMoveToken(token.id)}
                    stackOffset={offset}
                  />
                )
              })
            )}
          </LudoBoard>
        </div>

        {/* Bottom controls row */}
        <div className="flex items-center justify-between w-full px-2 gap-4">
          {/* Consecutive sixes indicator */}
          <div className="flex gap-1">
            {[1, 2].map((n) => (
              <div
                key={n}
                className={`w-6 h-6 rounded-md border text-xs flex items-center justify-center font-bold transition-all
                  ${consecutiveSixes >= n ? 'bg-yellow-400 border-yellow-600 text-black' : 'bg-white/10 border-white/20 text-white/30'}`}
              >
                6
              </div>
            ))}
            <div
              className={`w-6 h-6 rounded-md border text-xs flex items-center justify-center font-bold transition-all
                ${consecutiveSixes >= 3 ? 'bg-red-500 border-red-700 text-white animate-pulse' : 'bg-white/10 border-white/20 text-white/30'}`}
            >
              6
            </div>
          </div>

          {/* Dice */}
          <div className="flex flex-col items-center">
            {isMyTurn && !hasRolled && (
              <p className="text-emerald-400 text-xs font-bold mb-1 animate-pulse">Your turn!</p>
            )}
            {!isMyTurn && currentPlayer && (
              <p className="text-white/40 text-xs mb-1">
                {currentPlayer.name}&apos;s turn
              </p>
            )}
            <Dice3D
              value={diceValue}
              rolling={diceRolling}
              canRoll={canRoll}
              onRoll={onRoll}
            />
            {isMyTurn && hasRolled && (gameState.validMoves?.length ?? 0) > 0 && (
              <p className="text-yellow-400 text-xs mt-1 animate-pulse">Pick a token ↑</p>
            )}
          </div>

          {/* Emoji panel */}
          <EmojiPanel onSend={onSendEmoji} />
        </div>
      </div>

      {/* ── Right panel: players (desktop) ── */}
      <div className="hidden lg:flex flex-col gap-3 w-56">
        {gameState.players
          .filter((_, i) => i % 2 === 1)
          .map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isCurrentTurn={gameState.currentTurn === player.id}
              isMe={player.id === myPlayerId}
            />
          ))}
      </div>
    </div>
  )
}
