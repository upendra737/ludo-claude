'use client'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { COLORS } from '@/components/Board/LudoBoard'
import { unlockAudio } from '@/lib/audio'

interface LobbyProps {
  onReady: () => void
  onStart: () => void
}

export function Lobby({ onReady, onStart }: LobbyProps) {
  const gameState = useGameStore((s) => s.gameState)
  const myPlayerId = useGameStore((s) => s.myPlayerId)
  const roomCode = useGameStore((s) => s.roomCode)
  const [copied, setCopied] = useState(false)

  if (!gameState || !roomCode) return null

  const me = gameState.players.find((p) => p.id === myPlayerId)
  const isHost = me?.isHost ?? false
  const allReady =
    gameState.players.length >= 2 && gameState.players.every((p) => p.isReady)
  const canStart = isHost && allReady

  async function copyCode() {
    await navigator.clipboard.writeText(roomCode!)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <main className="game-shell min-h-screen px-4 py-6 text-white sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-5xl content-center gap-5 lg:grid-cols-[340px_1fr]">
        <motion.section
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22 }}
          className="rounded-lg border border-white/15 bg-zinc-950/90 p-5 shadow-2xl shadow-black/35 backdrop-blur"
        >
          <p className="mb-2 text-sm font-semibold uppercase text-white/55">Ludo Room</p>
          <h1 className="text-4xl font-black text-white">Lobby</h1>

          <div className="mt-6 rounded-lg border border-white/15 bg-white p-4 text-zinc-950">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-black uppercase text-zinc-500">Room Code</span>
              <button
                type="button"
                onClick={copyCode}
                className="rounded-md bg-zinc-950 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-zinc-800 active:scale-95"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="mt-3 font-mono text-5xl font-black text-zinc-950">{roomCode}</p>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2">
            {(['red', 'green', 'yellow', 'blue'] as const).map((color) => (
              <div
                key={color}
                className="h-2 rounded-sm"
                style={{ background: COLORS[color].bg }}
              />
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 180, damping: 22 }}
          className="rounded-lg border border-white/15 bg-zinc-950/90 p-5 shadow-2xl shadow-black/35 backdrop-blur"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase text-white/55">
                Players {gameState.players.length}/4
              </p>
              <h2 className="mt-1 text-2xl font-black text-white">Ready Check</h2>
            </div>
            {me && (
              <span className="rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white/75">
                {me.isReady ? 'Ready' : 'Not Ready'}
              </span>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {gameState.players.map((player, i) => {
              const color = COLORS[player.color]
              return (
                <motion.div
                  key={player.id}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.06 * i }}
                  className="rounded-lg border bg-white p-4 text-zinc-950 shadow-lg shadow-black/20"
                  style={{ borderColor: player.isReady ? '#22c55e' : `${color.bg}66` }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="h-9 w-9 shrink-0 rounded-lg border-2"
                        style={{ background: color.bg, borderColor: color.dark }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-black">{player.name}</p>
                          {player.id === myPlayerId && (
                            <span className="rounded-sm bg-zinc-100 px-1.5 py-0.5 text-xs font-bold text-zinc-600">
                              You
                            </span>
                          )}
                          {player.isHost && <span title="Host">♛</span>}
                        </div>
                        <p className="text-sm font-semibold text-zinc-500">
                          {player.color}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-md px-2.5 py-1 text-sm font-black ${
                        player.isReady
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {player.isReady ? 'Ready' : 'Waiting'}
                    </span>
                  </div>
                </motion.div>
              )
            })}

            {Array.from({ length: Math.max(0, 4 - gameState.players.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="grid min-h-[74px] place-items-center rounded-lg border border-dashed border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white/35"
              >
                Open Seat
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => {
                void unlockAudio()
                onReady()
              }}
              className={`rounded-lg px-4 py-3 font-black shadow-lg transition active:scale-[0.98] ${
                me?.isReady
                  ? 'border border-white/15 bg-white/10 text-white hover:bg-white/15'
                  : 'bg-emerald-400 text-zinc-950 shadow-emerald-950/25 hover:bg-emerald-300'
              }`}
            >
              {me?.isReady ? 'Set Not Ready' : 'Ready'}
            </button>

            {isHost ? (
              <button
                onClick={() => {
                  void unlockAudio()
                  onStart()
                }}
                disabled={!canStart}
                className={`rounded-lg px-4 py-3 font-black shadow-lg transition active:scale-[0.98] ${
                  canStart
                    ? 'bg-red-500 text-white shadow-red-950/30 hover:bg-red-400'
                    : 'cursor-not-allowed bg-white/10 text-white/35 shadow-none'
                }`}
              >
                {canStart ? 'Start Game' : 'Waiting for Ready'}
              </button>
            ) : (
              <div className="grid place-items-center rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white/45">
                Host Starts
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </main>
  )
}
