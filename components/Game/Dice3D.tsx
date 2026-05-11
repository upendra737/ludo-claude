'use client'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

// Final resting rotation for each face (rotateX, rotateY)
// Convention: face 1 = front, face 6 = back, etc.
const FACE_ROTATION: Record<number, { x: number; y: number }> = {
  1: { x: 0,   y: 0   },
  2: { x: 0,   y: 90  },
  3: { x: -90, y: 0   },
  4: { x: 90,  y: 0   },
  5: { x: 0,   y: -90 },
  6: { x: 0,   y: 180 },
}

// Dot layout for each face value
const DOTS: Record<number, { cx: number; cy: number }[]> = {
  1: [{ cx: 50, cy: 50 }],
  2: [{ cx: 25, cy: 25 }, { cx: 75, cy: 75 }],
  3: [{ cx: 25, cy: 25 }, { cx: 50, cy: 50 }, { cx: 75, cy: 75 }],
  4: [{ cx: 25, cy: 25 }, { cx: 75, cy: 25 }, { cx: 25, cy: 75 }, { cx: 75, cy: 75 }],
  5: [{ cx: 25, cy: 25 }, { cx: 75, cy: 25 }, { cx: 50, cy: 50 }, { cx: 25, cy: 75 }, { cx: 75, cy: 75 }],
  6: [{ cx: 25, cy: 20 }, { cx: 75, cy: 20 }, { cx: 25, cy: 50 }, { cx: 75, cy: 50 }, { cx: 25, cy: 80 }, { cx: 75, cy: 80 }],
}

function DieFace({ value, transform }: { value: number; transform: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        transform,
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        borderRadius: 12,
        background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
        border: '2px solid #d0d0d0',
        boxShadow: 'inset 0 0 12px rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg viewBox="0 0 100 100" width="80%" height="80%">
        {DOTS[value].map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={9}
            fill="#1a1a1a" />
        ))}
      </svg>
    </div>
  )
}

interface Dice3DProps {
  value: number | null
  rolling: boolean
  canRoll: boolean
  onRoll: () => void
}

export function Dice3D({ value, rolling, canRoll, onRoll }: Dice3DProps) {
  const [rotX, setRotX] = useState(0)
  const [rotY, setRotY] = useState(0)

  useEffect(() => {
    if (rolling) {
      // Spin wildly during roll
      setRotX(720 + Math.random() * 360)
      setRotY(720 + Math.random() * 360)
    } else if (value !== null) {
      // Land on correct face
      const target = FACE_ROTATION[value]
      setRotX(target.x)
      setRotY(target.y)
    }
  }, [rolling, value])

  const size = 80

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        style={{ perspective: 400, width: size, height: size }}
        className={canRoll && !rolling ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
        onClick={canRoll && !rolling ? onRoll : undefined}
        title={canRoll ? 'Click to roll' : ''}
      >
        <motion.div
          animate={{ rotateX: rotX, rotateY: rotY }}
          transition={
            rolling
              ? { duration: 0.9, ease: 'easeOut' }
              : { duration: 0.5, ease: 'easeOut' }
          }
          style={{
            width: size,
            height: size,
            position: 'relative',
            transformStyle: 'preserve-3d',
          }}
        >
          <DieFace value={1} transform={`translateZ(${size/2}px)`} />
          <DieFace value={2} transform={`rotateY(-90deg) translateZ(${size/2}px)`} />
          <DieFace value={3} transform={`rotateX(90deg) translateZ(${size/2}px)`} />
          <DieFace value={4} transform={`rotateX(-90deg) translateZ(${size/2}px)`} />
          <DieFace value={5} transform={`rotateY(90deg) translateZ(${size/2}px)`} />
          <DieFace value={6} transform={`rotateY(180deg) translateZ(${size/2}px)`} />
        </motion.div>
      </div>

      {canRoll && !rolling && (
        <span className="text-xs text-white/60 animate-pulse">tap to roll</span>
      )}
      {rolling && (
        <span className="text-xs text-white/60">Rolling…</span>
      )}
      {value !== null && !rolling && !canRoll && (
        <span className="text-2xl font-bold text-white drop-shadow">{value}</span>
      )}
    </div>
  )
}
