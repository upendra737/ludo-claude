'use client'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { PlayerCard } from './PlayerCard'
import { COLORS } from '@/components/Board/LudoBoard'

interface LobbyProps {
  onReady: () => void
  onStart: () => void
}

export function Lobby({ onReady, onStart }: LobbyProps) {
  const gameState = useGameStore((s) => s.gameState)
  const myPlayerId = useGameStore((s) => s.myPlayerId)
  const roomCode = useGameStore((s) => s.roomCode)

  if (!gameState || !roomCode) return null

  const me = gameState.players.find((p) => p.id === myPlayerId)
  const isHost = me?.isHost ?? false
  const allReady = gameState.players.length >= 2 &&
    gameState.players.every((p) => p.isReady)
  const canStart = isHost && allReady

  async function copyCode() {
    await navigator.clipboard.writeText(roomCode!)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900
                    flex flex-col items-center justify-center p-4">
      {/* Header */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">
          🎲 Ludo Room
        </h1>
        <p className="text-white/50 text-sm">Share the code with friends to join</p>
      </motion.div>

      {/* Room code card */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl
                   px-8 py-5 mb-8 text-center cursor-pointer hover:bg-white/15 transition"
        onClick={copyCode}
        title="Click to copy"
      >
        <p className="text-white/50 text-xs mb-1 uppercase tracking-widest">Room Code</p>
        <p className="text-5xl font-black text-white tracking-[0.2em] font-mono">{roomCode}</p>
        <p className="text-white/40 text-xs mt-2">click to copy</p>
      </motion.div>

      {/* Players */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md space-y-3 mb-8"
      >
        <h2 className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-3">
          Players ({gameState.players.length}/4)
        </h2>

        {gameState.players.map((player, i) => (
          <motion.div
            key={player.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 * i }}
          >
            <div
              className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all
                ${player.isReady ? 'border-green-400 bg-green-900/20' : 'border-white/20 bg-white/5'}`}
              style={player.isReady ? {} : { borderColor: `${COLORS[player.color].bg}55` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full border-2"
                  style={{ background: COLORS[player.color].bg, borderColor: COLORS[player.color].dark }}
                />
                <div>
                  <span className="text-white font-semibold text-sm">{player.name}</span>
                  {player.id === myPlayerId && (
                    <span className="text-white/40 text-xs ml-2">(you)</span>
                  )}
                  {player.isHost && <span className="ml-2 text-xs">👑</span>}
                </div>
              </div>
              <span className={`text-sm font-bold ${player.isReady ? 'text-green-400' : 'text-white/30'}`}>
                {player.isReady ? '✓ Ready' : 'Not ready'}
              </span>
            </div>
          </motion.div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: Math.max(0, 2 - gameState.players.length) }).map((_, i) => (
          <div key={`empty-${i}`}
            className="flex items-center px-4 py-3 rounded-xl border-2 border-dashed border-white/10 bg-white/5">
            <span className="text-white/20 text-sm">Waiting for player…</span>
          </div>
        ))}
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center gap-3 w-full max-w-md"
      >
        {!me?.isReady && (
          <button
            onClick={onReady}
            className="w-full py-3 rounded-xl font-bold text-white text-base
                       bg-gradient-to-r from-indigo-500 to-purple-600
                       hover:from-indigo-400 hover:to-purple-500
                       active:scale-95 transition-all shadow-lg"
          >
            ✓ I&apos;m Ready
          </button>
        )}

        {isHost && (
          <button
            onClick={onStart}
            disabled={!canStart}
            className={`w-full py-3 rounded-xl font-bold text-base transition-all shadow-lg
              ${canStart
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white active:scale-95'
                : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
          >
            {canStart ? '🚀 Start Game' : `Waiting for players to ready…`}
          </button>
        )}
      </motion.div>
    </div>
  )
}
