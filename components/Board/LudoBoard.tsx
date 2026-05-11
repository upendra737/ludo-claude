'use client'
import React from 'react'
import type { Color } from '@/types/game'

// ─── Board geometry ──────────────────────────────────────────────────────────
// 15×15 grid, each cell 42 px, origin (top-left of cell 0,0) at (25, 25).
// Center of cell (col, row) = (col*42 + 46, row*42 + 46)
const CS = 42   // cell size
const OFF = 25  // grid offset from SVG edge (= 46 - 21)

function cx(col: number) { return col * CS + OFF + CS / 2 }
function cy(row: number) { return row * CS + OFF + CS / 2 }
function cellX(col: number) { return col * CS + OFF }
function cellY(row: number) { return row * CS + OFF }

// ─── Color palette ───────────────────────────────────────────────────────────
const COLORS: Record<Color, { bg: string; light: string; dark: string; text: string }> = {
  red:    { bg: '#E74C3C', light: '#FADBD8', dark: '#C0392B', text: '#fff' },
  green:  { bg: '#27AE60', light: '#D5F5E3', dark: '#1E8449', text: '#fff' },
  yellow: { bg: '#F1C40F', light: '#FDEBD0', dark: '#D4AC0D', text: '#333' },
  blue:   { bg: '#2980B9', light: '#D6EAF8', dark: '#1A5276', text: '#fff' },
}

// ─── Cell classification ─────────────────────────────────────────────────────
type CellKind =
  | { t: 'corner'; c: Color }
  | { t: 'home'; c: Color }
  | { t: 'start'; c: Color }
  | { t: 'safe' }
  | { t: 'path' }
  | { t: 'center' }

function classify(col: number, row: number): CellKind {
  if (col <= 5 && row <= 5) return { t: 'corner', c: 'red' }
  if (col >= 9 && row <= 5) return { t: 'corner', c: 'green' }
  if (col <= 5 && row >= 9) return { t: 'corner', c: 'yellow' }
  if (col >= 9 && row >= 9) return { t: 'corner', c: 'blue' }
  if (col >= 6 && col <= 8 && row >= 6 && row <= 8) return { t: 'center' }
  if (col === 7 && row >= 1 && row <= 5)  return { t: 'home', c: 'red' }
  if (col === 7 && row >= 9 && row <= 13) return { t: 'home', c: 'yellow' }
  if (row === 7 && col >= 1 && col <= 5)  return { t: 'home', c: 'green' }
  if (row === 7 && col >= 9 && col <= 13) return { t: 'home', c: 'blue' }
  if (col === 6 && row === 0)  return { t: 'start', c: 'red' }
  if (col === 0 && row === 8)  return { t: 'start', c: 'green' }
  if (col === 8 && row === 14) return { t: 'start', c: 'yellow' }
  if (col === 14 && row === 7) return { t: 'start', c: 'blue' }
  if ((col === 3 && row === 6) || (col === 5 && row === 11) ||
      (col === 10 && row === 8) || (col === 8 && row === 5))
    return { t: 'safe' }
  return { t: 'path' }
}

// ─── Token home base slot positions (inside corner zones) ────────────────────
const HOME_SLOTS: Record<Color, { col: number; row: number }[]> = {
  red:    [{ col:1,row:1 },{ col:3,row:1 },{ col:1,row:3 },{ col:3,row:3 }],
  green:  [{ col:11,row:1 },{ col:13,row:1 },{ col:11,row:3 },{ col:13,row:3 }],
  yellow: [{ col:1,row:11 },{ col:3,row:11 },{ col:1,row:13 },{ col:3,row:13 }],
  blue:   [{ col:11,row:11 },{ col:13,row:11 },{ col:11,row:13 },{ col:13,row:13 }],
}

// ─── Star icon path (safe square marker) ─────────────────────────────────────
function starPath(x: number, y: number, r = 8): string {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2
    const rad = i % 2 === 0 ? r : r * 0.45
    pts.push(`${(x + Math.cos(a) * rad).toFixed(1)},${(y + Math.sin(a) * rad).toFixed(1)}`)
  }
  return `M${pts.join('L')}Z`
}

// ─── Board cells ─────────────────────────────────────────────────────────────
function BoardCells() {
  const cells: React.ReactNode[] = []

  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      const kind = classify(col, row)
      const x = cellX(col)
      const y = cellY(row)
      const key = `${col}-${row}`

      if (kind.t === 'corner') {
        // Corner zone cells — drawn as one big rect below, skip individual cells
        continue
      }

      if (kind.t === 'center') {
        // Drawn separately as a star/triangle shape below
        continue
      }

      if (kind.t === 'home') {
        const c = COLORS[kind.c]
        cells.push(
          <rect key={key} x={x} y={y} width={CS} height={CS}
            fill={c.bg} stroke={c.dark} strokeWidth={0.5} />,
          <rect key={`${key}-i`} x={x+3} y={y+3} width={CS-6} height={CS-6}
            fill={c.light} stroke="none" rx={4} />
        )
        continue
      }

      if (kind.t === 'start') {
        const c = COLORS[kind.c]
        cells.push(
          <rect key={key} x={x} y={y} width={CS} height={CS}
            fill={c.light} stroke="#ccc" strokeWidth={0.5} />,
          <circle key={`${key}-dot`} cx={x + CS/2} cy={y + CS/2} r={CS/2 - 6}
            fill={c.bg} stroke={c.dark} strokeWidth={1.5} />,
          <path key={`${key}-star`} d={starPath(x + CS/2, y + CS/2, 7)}
            fill="#fff" opacity={0.8} />
        )
        continue
      }

      if (kind.t === 'safe') {
        cells.push(
          <rect key={key} x={x} y={y} width={CS} height={CS}
            fill="#FFFDE7" stroke="#ccc" strokeWidth={0.5} />,
          <path key={`${key}-s`} d={starPath(x + CS/2, y + CS/2, 9)}
            fill="#F1C40F" stroke="#D4AC0D" strokeWidth={1} />
        )
        continue
      }

      // Plain path cell
      cells.push(
        <rect key={key} x={x} y={y} width={CS} height={CS}
          fill="#FAFAFA" stroke="#E0E0E0" strokeWidth={0.5} />
      )
    }
  }
  return <>{cells}</>
}

// ─── Corner zones ─────────────────────────────────────────────────────────────
function CornerZones() {
  const zones: [Color, number, number][] = [
    ['red',    0, 0],
    ['green',  9, 0],
    ['yellow', 0, 9],
    ['blue',   9, 9],
  ]

  return (
    <>
      {zones.map(([color, startCol, startRow]) => {
        const c = COLORS[color]
        const x = cellX(startCol)
        const y = cellY(startRow)
        const size = CS * 6

        // Inner yard where tokens sit
        const pad = 8
        const yardR = 18

        return (
          <g key={color}>
            {/* Outer colored zone */}
            <rect x={x} y={y} width={size} height={size}
              fill={c.bg} rx={4} />
            {/* Inner white yard */}
            <rect x={x + pad} y={y + pad}
              width={size - pad*2} height={size - pad*2}
              fill="white" fillOpacity={0.92} rx={yardR} />
            {/* 4 token slots */}
            {HOME_SLOTS[color].map(({ col, row }, i) => (
              <circle key={i}
                cx={cx(col)} cy={cy(row)} r={CS/2 - 4}
                fill={c.light} stroke={c.dark} strokeWidth={1.5} />
            ))}
          </g>
        )
      })}
    </>
  )
}

// ─── Center star ──────────────────────────────────────────────────────────────
function CenterStar() {
  const x0 = cellX(6), y0 = cellY(6)
  const size = CS * 3
  const mid = x0 + size / 2

  // 4 triangles pointing inward
  const triangles: [Color, string][] = [
    ['red',    `${x0},${y0} ${x0+size},${y0} ${mid},${y0+size/2}`],
    ['green',  `${x0},${y0} ${x0},${y0+size} ${mid},${y0+size/2}`],
    ['yellow', `${x0},${y0+size} ${x0+size},${y0+size} ${mid},${y0+size/2}`],
    ['blue',   `${x0+size},${y0} ${x0+size},${y0+size} ${mid},${y0+size/2}`],
  ]

  return (
    <g>
      {triangles.map(([color, pts]) => (
        <polygon key={color} points={pts} fill={COLORS[color].bg} opacity={0.9} />
      ))}
      {/* Center circle */}
      <circle cx={mid} cy={y0 + size/2} r={18}
        fill="white" stroke="#bbb" strokeWidth={1} />
      <text x={mid} y={y0 + size/2 + 5} textAnchor="middle"
        fontSize={14} fill="#555">🏠</text>
    </g>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface LudoBoardProps {
  children?: React.ReactNode  // Tokens rendered by parent
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function LudoBoard({ children }: LudoBoardProps) {
  return (
    <svg
      viewBox="0 0 680 680"
      className="w-full h-full"
      style={{ maxWidth: 640, maxHeight: 640 }}
    >
      {/* Board background */}
      <rect x={0} y={0} width={680} height={680} fill="#F5F0E8" rx={8} />
      <rect x={23} y={23} width={634} height={634} fill="none"
        stroke="#C8B89A" strokeWidth={2} rx={6} />

      <CornerZones />
      <BoardCells />
      <CenterStar />

      {/* Token layer passed in from parent */}
      {children}
    </svg>
  )
}

// Re-export for convenience
export { cx, cy, HOME_SLOTS, COLORS }
export type { CellKind }
