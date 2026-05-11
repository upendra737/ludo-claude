'use client'
import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { useGameStore } from '@/store/gameStore'
import { COLORS } from '@/components/Board/LudoBoard'
import type { Color } from '@/types/game'

const MEDALS = ['🥇', '🥈', '🥉', '🏅']
const MEDAL_LABELS = ['1st Place', '2nd Place', '3rd Place', '4th Place']

interface GameOverProps {
  onPlayAgain: () => void
}

export function GameOver({ onPlayAgain }: GameOverProps) {
  const gameState = useGameStore((s) => s.gameState)
  const myPlayerId = useGameStore((s) => s.myPlayerId)
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    const winner = gameState?.players.find((p) => p.finishPosition === 1)
    const isWinner = winner?.id === myPlayerId
    if (isWinner) {
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } })
      setTimeout(() => confetti({ particleCount: 100, spread: 70, origin: { y: 0.4 } }), 600)
    }
  }, [gameState, myPlayerId])

  if (!gameState) return null

  const ordered = [...gameState.players].sort(
    (a, b) => (a.finishPosition ?? 99) - (b.finishPosition ?? 99)
  )
  const myPosition = gameState.players.find((p) => p.id === myPlayerId)?.finishPosition

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950
                    flex flex-col items-center justify-center p-6">
      {/* Title */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="text-center mb-8"
      >
        <div className="text-6xl mb-3">
          {myPosition === 1 ? '🏆' : myPosition === 2 ? '🥈' : '🎮'}
        </div>
        <h1 className="text-4xl font-black text-white mb-2">Game Over!</h1>
        {myPosition === 1 && (
          <p className="text-yellow-400 font-bold text-xl">You won! 🎉</p>
        )}
        {myPosition && myPosition > 1 && (
          <p className="text-white/60 text-lg">You finished {MEDAL_LABELS[myPosition - 1]}</p>
        )}
      </motion.div>

      {/* Leaderboard */}
      <div className="w-full max-w-sm space-y-3 mb-8">
        {ordered.map((player, idx) => {
          const c = COLORS[player.color as Color]
          const isMe = player.id === myPlayerId
          const pos = player.finishPosition ?? idx + 1

          return (
            <motion.div
              key={player.id}
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.12, type: 'spring', stiffness: 260, damping: 22 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2
                ${isMe ? 'ring-2 ring-yellow-400' : ''}`}
              style={{ borderColor: c.dark, background: `${c.bg}22` }}
            >
              <span className="text-2xl w-8 text-center">{MEDALS[pos - 1] ?? '🏅'}</span>
              <div
                className="w-4 h-4 rounded-full border-2 shrink-0"
                style={{ background: c.bg, borderColor: c.dark }}
              />
              <span className="font-bold text-white flex-1">
                {player.name}
                {isMe && <span className="text-white/40 text-xs font-normal ml-1">(you)</span>}
              </span>
              <span className="text-white/50 text-sm">{MEDAL_LABELS[pos - 1]}</span>
            </motion.div>
          )
        })}
      </div>

      {/* Play again */}
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={onPlayAgain}
        className="px-8 py-3 rounded-xl font-bold text-white text-base
                   bg-gradient-to-r from-indigo-500 to-purple-600
                   hover:from-indigo-400 hover:to-purple-500
                   active:scale-95 transition-all shadow-xl"
      >
        🏠 Back to Home
      </motion.button>
    </div>
  )
}
