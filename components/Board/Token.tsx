'use client'
import { motion, AnimatePresence } from 'framer-motion'
import type { Token as TokenType } from '@/types/game'
import { getPixelPosition, HOME_BASE_POSITIONS } from '@/lib/boardMap'
import { COLORS } from './LudoBoard'

interface TokenProps {
  token: TokenType
  tokenIndex: number
  isValidMove: boolean
  isMyToken: boolean
  onClick: () => void
  stackOffset?: { dx: number; dy: number }
}

export function Token({
  token,
  tokenIndex,
  isValidMove,
  isMyToken,
  onClick,
  stackOffset = { dx: 0, dy: 0 },
}: TokenProps) {
  const pos = getPixelPosition(token.color, tokenIndex, token.position)
  const c = COLORS[token.color]

  const x = pos.x + stackOffset.dx
  const y = pos.y + stackOffset.dy

  const r = 14
  const label = ['①', '②', '③', '④'][tokenIndex] ?? ''

  return (
    <AnimatePresence>
      <motion.g
        key={token.id}
        animate={{ x, y }}
        initial={{ x, y }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        style={{ cursor: isValidMove && isMyToken ? 'pointer' : 'default' }}
        onClick={isValidMove && isMyToken ? onClick : undefined}
      >
        {/* Glow ring for valid moves */}
        {isValidMove && isMyToken && (
          <motion.circle
            cx={0} cy={0} r={r + 6}
            fill="none"
            stroke="#FFD700"
            strokeWidth={3}
            animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0.4, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
        )}

        {/* Shadow */}
        <circle cx={2} cy={2} r={r} fill="rgba(0,0,0,0.25)" />

        {/* Token body */}
        <circle
          cx={0} cy={0} r={r}
          fill={c.bg}
          stroke={c.dark}
          strokeWidth={2}
        />

        {/* Highlight gloss */}
        <circle cx={-4} cy={-4} r={r * 0.35} fill="white" opacity={0.4} />

        {/* Label */}
        <text
          x={0} y={4}
          textAnchor="middle"
          fontSize={9}
          fontWeight="bold"
          fill={c.text}
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {label}
        </text>
      </motion.g>
    </AnimatePresence>
  )
}

// ─── Stack layout helpers ─────────────────────────────────────────────────────
// When multiple tokens occupy the same square, offset them slightly.
const STACK_OFFSETS: { dx: number; dy: number }[][] = [
  [{ dx: 0, dy: 0 }],
  [{ dx: -7, dy: 0 }, { dx: 7, dy: 0 }],
  [{ dx: -7, dy: 5 }, { dx: 7, dy: 5 }, { dx: 0, dy: -7 }],
  [{ dx: -7, dy: -7 }, { dx: 7, dy: -7 }, { dx: -7, dy: 7 }, { dx: 7, dy: 7 }],
]

export function getStackOffset(stackSize: number, stackIndex: number) {
  const offsets = STACK_OFFSETS[Math.min(stackSize - 1, 3)]
  return offsets[Math.min(stackIndex, offsets.length - 1)]
}
