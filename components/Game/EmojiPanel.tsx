'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'

const EMOJIS = ['😂', '🤣', '😭', '🔥', '💀', '👑', '🎯', '💪']

interface EmojiPanelProps {
  onSend: (emoji: string) => void
}

export function EmojiPanel({ onSend }: EmojiPanelProps) {
  const [open, setOpen] = useState(false)
  const reactions = useGameStore((s) => s.emojiReactions)

  return (
    <>
      {/* Floating reaction bubbles */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 flex gap-2 z-50 pointer-events-none">
        <AnimatePresence>
          {reactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ y: 20, opacity: 0, scale: 0.5 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -40, opacity: 0, scale: 0.5 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col items-center rounded-lg border border-white/15 bg-zinc-950/90 px-3 py-1.5 shadow-xl backdrop-blur-sm"
            >
              <span className="text-2xl">{r.emoji}</span>
              <span className="text-white/70 text-[10px] font-medium">{r.playerName}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Toggle button */}
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white transition hover:bg-white/20 active:scale-95"
        >
          <span>😊</span>
          <span className="hidden sm:inline">React</span>
        </button>

        {/* Emoji grid */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="absolute bottom-full mb-2 right-0 bg-gray-900/95 backdrop-blur-sm
                         border border-white/15 rounded-lg p-2 grid grid-cols-4 gap-1 shadow-2xl z-40"
            >
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onSend(emoji)
                    setOpen(false)
                  }}
                  className="rounded-md p-1.5 text-2xl transition-all hover:bg-white/20 active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
