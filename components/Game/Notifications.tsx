'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'

const TYPE_STYLE: Record<string, string> = {
  info:        'bg-gray-800/90 border-gray-600',
  capture:     'bg-red-900/90 border-red-500',
  'triple-six': 'bg-purple-900/90 border-purple-400',
  win:         'bg-yellow-700/90 border-yellow-400',
  turn:        'bg-emerald-800/90 border-emerald-400',
  error:       'bg-red-800/90 border-red-400',
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
            className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border text-white text-sm
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
