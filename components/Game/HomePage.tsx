'use client'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useGame } from '@/hooks/useGame'
import { useGameStore } from '@/store/gameStore'

type Mode = 'none' | 'create' | 'join'

export function HomePage() {
  const { createRoom, joinRoom } = useGame()
  const phase = useGameStore((s) => s.phase)

  const [mode, setMode] = useState<Mode>('none')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    createRoom(name.trim())
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || code.length < 6) return
    setLoading(true)
    joinRoom(code.trim(), name.trim())
  }

  // Reset loading if phase changes back (error)
  if (phase !== 'home' && loading) setLoading(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900
                    flex flex-col items-center justify-center p-6 overflow-hidden">

      {/* Animated background circles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-10"
            style={{
              width: 200 + i * 80,
              height: 200 + i * 80,
              background: ['#E74C3C','#27AE60','#F1C40F','#2980B9','#9B59B6','#E67E22'][i],
              left: `${10 + i * 15}%`,
              top: `${5 + i * 12}%`,
            }}
            animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Title */}
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-center mb-10"
        >
          <div className="text-7xl mb-3">🎲</div>
          <h1 className="text-5xl font-black text-white tracking-tight">Ludo</h1>
          <p className="text-white/50 mt-2 text-lg">Multiplayer · Real-time · Fun</p>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-7 shadow-2xl"
        >
          {mode === 'none' && (
            <div className="space-y-4">
              <button
                onClick={() => setMode('create')}
                className="w-full py-4 rounded-2xl font-bold text-white text-lg
                           bg-gradient-to-r from-indigo-500 to-purple-600
                           hover:from-indigo-400 hover:to-purple-500
                           active:scale-95 transition-all shadow-lg
                           flex items-center justify-center gap-3"
              >
                <span className="text-2xl">🏠</span> Create Room
              </button>
              <button
                onClick={() => setMode('join')}
                className="w-full py-4 rounded-2xl font-bold text-white text-lg
                           bg-gradient-to-r from-emerald-600 to-teal-600
                           hover:from-emerald-500 hover:to-teal-500
                           active:scale-95 transition-all shadow-lg
                           flex items-center justify-center gap-3"
              >
                <span className="text-2xl">🚪</span> Join Room
              </button>
            </div>
          )}

          {mode === 'create' && (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleCreate}
              className="space-y-4"
            >
              <button
                type="button"
                onClick={() => setMode('none')}
                className="text-white/50 hover:text-white text-sm flex items-center gap-1 mb-2 transition"
              >
                ← Back
              </button>
              <h2 className="text-white font-bold text-xl">Create a New Room</h2>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                autoFocus
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3
                           text-white placeholder-white/30 outline-none
                           focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 transition"
              />
              <button
                type="submit"
                disabled={!name.trim() || loading}
                className={`w-full py-3 rounded-xl font-bold text-white text-base transition-all
                  ${name.trim() && !loading
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 active:scale-95'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
              >
                {loading ? 'Creating…' : '🏠 Create Room'}
              </button>
            </motion.form>
          )}

          {mode === 'join' && (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleJoin}
              className="space-y-4"
            >
              <button
                type="button"
                onClick={() => setMode('none')}
                className="text-white/50 hover:text-white text-sm flex items-center gap-1 mb-2 transition"
              >
                ← Back
              </button>
              <h2 className="text-white font-bold text-xl">Join a Room</h2>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                autoFocus
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3
                           text-white placeholder-white/30 outline-none
                           focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 transition"
              />
              <input
                type="text"
                placeholder="Room code (6 letters)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                maxLength={6}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3
                           text-white placeholder-white/30 outline-none font-mono text-xl tracking-[0.2em]
                           focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 transition"
              />
              <button
                type="submit"
                disabled={!name.trim() || code.length < 6 || loading}
                className={`w-full py-3 rounded-xl font-bold text-white text-base transition-all
                  ${name.trim() && code.length >= 6 && !loading
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
              >
                {loading ? 'Joining…' : '🚪 Join Room'}
              </button>
            </motion.form>
          )}
        </motion.div>

        {/* Feature callouts */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 grid grid-cols-2 gap-3 text-center"
        >
          {[
            ['🎲', '3D Dice'],
            ['🔊', 'Sound FX'],
            ['😂', 'Emoji Reactions'],
            ['⚡', 'Real-time'],
          ].map(([icon, label]) => (
            <div key={label}
              className="bg-white/5 border border-white/10 rounded-xl py-2.5 text-white/60 text-sm">
              {icon} {label}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
