'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGame } from '@/hooks/useGame'
import { useGameStore } from '@/store/gameStore'
import { Lobby } from './Lobby'
import { GameBoard } from './GameBoard'
import { GameOver } from './GameOver'
import { Notifications } from './Notifications'

interface RoomPageProps {
  code: string
}

export function RoomPage({ code }: RoomPageProps) {
  const router = useRouter()
  const { rejoinRoom, setReady, startGame, rollDice, moveToken, sendEmoji } = useGame()
  const phase = useGameStore((s) => s.phase)
  const roomCode = useGameStore((s) => s.roomCode)
  const sessionToken = useGameStore((s) => s.sessionToken)

  // Attempt to rejoin when landing on this page (handles refresh / direct link)
  useEffect(() => {
    if (!sessionToken) return
    // Only rejoin if we don't already have this room loaded
    if (roomCode !== code) {
      rejoinRoom(code)
    }
  }, [sessionToken, code, roomCode, rejoinRoom])

  // If rejoin fails and we have no room, redirect home after a moment
  useEffect(() => {
    if (!roomCode && phase === 'home') {
      const t = setTimeout(() => router.push('/'), 3000)
      return () => clearTimeout(t)
    }
  }, [roomCode, phase, router])

  return (
    <>
      {(phase === 'home' || phase === 'lobby') && (
        <Lobby onReady={setReady} onStart={startGame} />
      )}
      {phase === 'playing' && (
        <GameBoard
          onRoll={rollDice}
          onMoveToken={moveToken}
          onSendEmoji={sendEmoji}
        />
      )}
      {phase === 'finished' && (
        <GameOver onPlayAgain={() => router.push('/')} />
      )}
      <Notifications />
    </>
  )
}
