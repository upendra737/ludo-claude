'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'

const TYPE_STYLE: Record<string, string> = {
  info:        'bg-zinc-950/95 border-white/15',
  capture:     'bg-red-950/95 border-red-400',
  'triple-six': 'bg-zinc-950/95 border-yellow-300',
  win:         'bg-yellow-500 border-yellow-200 text-zinc-950',
  turn:        'bg-emerald-500 border-emerald-200 text-zinc-950',
  error:       'bg-red-600 border-red-200',
}

const TYPE_ICON: Record<string, string> = {
  info: 'ℹ️', capture: '💥', 'triple-six': '😱', win: '🎉', turn: '🎲', error: '⚠️',
}

export function Notifications() {
  const notifications = useGameStore((s) => s.notifications)
  const remove = useGameStore((s) => s.removeNotification)

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 max-w-xs w-full pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border text-white text-sm
                        shadow-2xl backdrop-blur-sm pointer-events-auto cursor-pointer
                        ${TYPE_STYLE[n.type] ?? TYPE_STYLE.info}`}
            onClick={() => remove(n.id)}
          >
            <span className="text-base mt-0.5 shrink-0">{TYPE_ICON[n.type]}</span>
            <span className="font-medium leading-snug">{n.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
