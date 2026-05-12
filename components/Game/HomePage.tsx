'use client'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useGame } from '@/hooks/useGame'
import { useGameStore } from '@/store/gameStore'
import { unlockAudio } from '@/lib/audio'
import { Notifications } from './Notifications'

type Mode = 'none' | 'create' | 'join'

const BOARD_COLORS = ['#E74C3C', '#27AE60', '#F1C40F', '#2980B9']

export function HomePage() {
  const { createRoom, joinRoom } = useGame()
  const phase = useGameStore((s) => s.phase)
  const latestErrorId = useGameStore((s) => {
    const last = s.notifications.at(-1)
    return last?.type === 'error' ? last.id : null
  })

  const [mode, setMode] = useState<Mode>('none')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  function chooseMode(nextMode: Mode) {
    void unlockAudio()
    setMode(nextMode)
    setLoading(false)
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    if (!createRoom(name.trim())) setLoading(false)
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || code.length < 6) return
    setLoading(true)
    if (!joinRoom(code.trim(), name.trim())) setLoading(false)
  }

  useEffect(() => {
    if (phase !== 'home') setLoading(false)
  }, [phase])

  useEffect(() => {
    if (latestErrorId) setLoading(false)
  }, [latestErrorId])

  useEffect(() => {
    if (!loading) return
    const timeout = window.setTimeout(() => {
      setLoading(false)
      useGameStore.getState().addNotification({
        message: 'The game server did not answer. Please try again.',
        type: 'error',
      })
    }, 12000)
    return () => window.clearTimeout(timeout)
  }, [loading])

  return (
    <main className="game-shell min-h-screen overflow-hidden px-4 py-6 text-white sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full gap-7 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <motion.section
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 22 }}
            className="mx-auto w-full max-w-md lg:mx-0"
          >
            <div className="mb-6 grid aspect-square w-32 grid-cols-2 overflow-hidden rounded-lg border border-white/20 bg-white shadow-2xl shadow-black/35 sm:w-40">
              {BOARD_COLORS.map((color) => (
                <div key={color} className="grid place-items-center" style={{ background: color }}>
                  <div className="h-9 w-9 rounded-lg border-4 border-white/80 bg-white/20 shadow-inner sm:h-11 sm:w-11" />
                </div>
              ))}
            </div>
            <p className="mb-3 text-sm font-semibold uppercase text-white/55">Private match</p>
            <h1 className="text-5xl font-black text-white sm:text-6xl">Ludo</h1>
            <p className="mt-4 max-w-sm text-base leading-7 text-white/70">
              Create a room, invite friends, and play the board with real-time turns, dice, and sound.
            </p>
          </motion.section>

          <motion.section
            initial={{ y: 22, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.08, type: 'spring', stiffness: 180, damping: 22 }}
            className="mx-auto w-full max-w-md rounded-lg border border-white/15 bg-zinc-950/90 p-5 shadow-2xl shadow-black/40 backdrop-blur"
          >
            {mode === 'none' && (
              <div className="space-y-3">
                <button
                  onClick={() => chooseMode('create')}
                  className="group flex w-full items-center justify-between rounded-lg border border-red-300/30 bg-red-500 px-4 py-4 text-left font-bold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-400 active:scale-[0.98]"
                >
                  <span>Create Room</span>
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-white/20 text-lg">+</span>
                </button>
                <button
                  onClick={() => chooseMode('join')}
                  className="group flex w-full items-center justify-between rounded-lg border border-emerald-300/30 bg-emerald-500 px-4 py-4 text-left font-bold text-zinc-950 shadow-lg shadow-emerald-950/25 transition hover:bg-emerald-400 active:scale-[0.98]"
                >
                  <span>Join Room</span>
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-zinc-950/10 text-lg">→</span>
                </button>
              </div>
            )}

            {mode === 'create' && (
              <motion.form
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleCreate}
                className="space-y-4"
              >
                <button
                  type="button"
                  onClick={() => chooseMode('none')}
                  className="text-sm font-semibold text-white/55 transition hover:text-white"
                >
                  Back
                </button>
                <div>
                  <h2 className="text-2xl font-black text-white">Create Room</h2>
                  <p className="mt-1 text-sm text-white/55">Your name appears on the board.</p>
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white/70">Name</span>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={20}
                    autoFocus
                    className="w-full rounded-lg border border-white/15 bg-white px-4 py-3 text-base font-semibold text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-red-300 focus:ring-4 focus:ring-red-400/20"
                  />
                </label>
                <button
                  type="submit"
                  disabled={!name.trim() || loading}
                  className={`w-full rounded-lg px-4 py-3 font-black text-white shadow-lg transition active:scale-[0.98]
                    ${name.trim() && !loading
                      ? 'bg-red-500 shadow-red-950/30 hover:bg-red-400'
                      : 'cursor-not-allowed bg-white/10 text-white/35 shadow-none'}`}
                >
                  {loading ? 'Creating...' : 'Create Room'}
                </button>
              </motion.form>
            )}

            {mode === 'join' && (
              <motion.form
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleJoin}
                className="space-y-4"
              >
                <button
                  type="button"
                  onClick={() => chooseMode('none')}
                  className="text-sm font-semibold text-white/55 transition hover:text-white"
                >
                  Back
                </button>
                <div>
                  <h2 className="text-2xl font-black text-white">Join Room</h2>
                  <p className="mt-1 text-sm text-white/55">Enter the six-character code.</p>
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white/70">Name</span>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={20}
                    autoFocus
                    className="w-full rounded-lg border border-white/15 bg-white px-4 py-3 text-base font-semibold text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-400/20"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white/70">Room Code</span>
                  <input
                    type="text"
                    placeholder="ABC123"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                    maxLength={6}
                    className="w-full rounded-lg border border-white/15 bg-white px-4 py-3 font-mono text-xl font-black text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-400/20"
                  />
                </label>
                <button
                  type="submit"
                  disabled={!name.trim() || code.length < 6 || loading}
                  className={`w-full rounded-lg px-4 py-3 font-black shadow-lg transition active:scale-[0.98]
                    ${name.trim() && code.length >= 6 && !loading
                      ? 'bg-emerald-400 text-zinc-950 shadow-emerald-950/25 hover:bg-emerald-300'
                      : 'cursor-not-allowed bg-white/10 text-white/35 shadow-none'}`}
                >
                  {loading ? 'Joining...' : 'Join Room'}
                </button>
              </motion.form>
            )}
          </motion.section>
        </div>
      </div>
      <Notifications />
    </main>
  )
}
