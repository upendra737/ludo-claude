'use client'
import type { Player } from '@/types/game'
import { COLORS } from '@/components/Board/LudoBoard'

interface PlayerCardProps {
  player: Player
  isCurrentTurn: boolean
  isMe: boolean
  compact?: boolean
}

const COLOR_LABEL: Record<string, string> = {
  red: 'Red', green: 'Green', yellow: 'Yellow', blue: 'Blue',
}

const FINISH_MEDAL = ['🥇', '🥈', '🥉', '🏅']

export function PlayerCard({ player, isCurrentTurn, isMe, compact }: PlayerCardProps) {
  const c = COLORS[player.color]
  const tokensFinished = player.tokens.filter((t) => t.state === 'finished').length

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 px-2 py-1 rounded-lg border bg-white text-sm transition-all
          ${isCurrentTurn ? 'ring-2 ring-yellow-300 shadow-lg scale-105' : ''}
          ${player.status === 'disconnected' ? 'opacity-50' : ''}`}
        style={{ borderColor: c.dark }}
      >
        <div className="w-3 h-3 rounded-sm" style={{ background: c.bg }} />
        <span className="font-black truncate max-w-[80px]" style={{ color: c.dark }}>
          {player.name}
          {isMe && <span className="text-xs opacity-60 ml-1">(you)</span>}
        </span>
        {player.finishPosition !== null && (
          <span>{FINISH_MEDAL[player.finishPosition - 1]}</span>
        )}
        {isCurrentTurn && (
          <span className="text-yellow-500 animate-bounce text-base">▶</span>
        )}
      </div>
    )
  }

  return (
    <div
      className={`rounded-lg border-2 bg-white p-3 text-zinc-950 shadow-lg shadow-black/20 transition-all select-none
        ${isCurrentTurn ? 'ring-2 ring-yellow-300 scale-[1.02]' : 'opacity-95'}
        ${player.status === 'disconnected' ? 'opacity-40 grayscale' : ''}`}
      style={{ borderColor: c.dark }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm border-2" style={{ background: c.bg, borderColor: c.dark }} />
          <span className="font-bold text-sm" style={{ color: c.dark }}>
            {player.name}
            {isMe && <span className="font-normal text-xs opacity-60 ml-1">(you)</span>}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {player.isHost && <span title="Host" className="text-xs">👑</span>}
          {player.status === 'disconnected' && <span title="Disconnected" className="text-xs">📴</span>}
          {player.finishPosition !== null && (
            <span className="text-lg">{FINISH_MEDAL[player.finishPosition - 1]}</span>
          )}
          {isCurrentTurn && (
            <span className="text-yellow-500">▶</span>
          )}
        </div>
      </div>

      {/* Token progress */}
      <div className="flex gap-1.5 flex-wrap">
        {player.tokens.map((token) => (
          <div
            key={token.id}
            className="w-5 h-5 rounded-md border flex items-center justify-center text-[9px] font-bold"
            style={{
              background: token.state === 'finished' ? c.bg : token.state === 'active' ? c.light : '#e5e5e5',
              borderColor: c.dark,
              color: token.state === 'finished' ? c.text : c.dark,
            }}
            title={`${token.state} — pos ${token.position}`}
          >
            {token.state === 'finished' ? '✓' : token.state === 'home' ? '⌂' : '●'}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1.5 rounded-sm bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-sm transition-all duration-500"
          style={{ width: `${(tokensFinished / 4) * 100}%`, background: c.bg }}
        />
      </div>
    </div>
  )
}
