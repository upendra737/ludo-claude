'use client'
import { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getSocket, type GameSocket } from '@/lib/socket'
import { useGameStore } from '@/store/gameStore'
import {
  playDiceRoll,
  playTokenMove,
  playTokenCapture,
  playTripleSix,
  playWin,
  playEmojiSound,
  playTease,
  playTokenHome,
  unlockAudio,
} from '@/lib/audio'
import { generateSessionToken } from '@/lib/sessionToken'

// Persists the session token across page loads
function getOrCreateSessionToken(): string {
  if (typeof window === 'undefined') return ''
  const key = 'ludo_session_token'
  let token = localStorage.getItem(key)
  if (!token) {
    token = generateSessionToken()
    localStorage.setItem(key, token)
  }
  return token
}

function notifyError(message: string) {
  useGameStore.getState().addNotification({ message, type: 'error' })
}

export function useGame() {
  const router = useRouter()
  const store = useGameStore()
  const socketRef = useRef<GameSocket | null>(null)

  // ── Init session ──────────────────────────────────────────────────────────
  useEffect(() => {
    const token = getOrCreateSessionToken()
    store.setSessionToken(token)
    const socket = getSocket(token)
    socketRef.current = socket

    // ── Server → Client events ──────────────────────────────────────────────

    socket.on('connect_error', (error) => {
      notifyError(`Could not connect to the game server: ${error.message}`)
    })

    socket.on('disconnect', (reason) => {
      if (reason === 'io client disconnect') return
      useGameStore.getState().addNotification({
        message: 'Disconnected from the game server. Reconnecting...',
        type: 'error',
      })
    })

    socket.on('room-created', ({ code, player, sessionToken, gameState }) => {
      store.setMyPlayerId(player.id)
      store.setRoomCode(code)
      if (sessionToken) localStorage.setItem('ludo_session_token', sessionToken)
      store.setGameState(gameState)
      store.setPhase('lobby')
      router.push(`/room/${code}`)
    })

    socket.on('room-joined', ({ player, sessionToken, gameState }) => {
      store.setMyPlayerId(player.id)
      store.setRoomCode(gameState.roomCode)
      if (sessionToken) localStorage.setItem('ludo_session_token', sessionToken)
      store.setGameState(gameState)
      store.setPhase(gameState.status === 'active' ? 'playing' : 'lobby')
    })

    socket.on('player-joined', ({ player }) => {
      const gs = useGameStore.getState().gameState
      if (!gs) return
      const already = gs.players.find((p) => p.id === player.id)
      if (!already) {
        store.setGameState({ ...gs, players: [...gs.players, player] })
      }
      store.addNotification({ message: `${player.name} joined`, type: 'info' })
    })

    socket.on('player-ready-update', ({ playerId, isReady }) => {
      const gs = useGameStore.getState().gameState
      if (!gs) return
      store.setGameState({
        ...gs,
        players: gs.players.map((p) =>
          p.id === playerId ? { ...p, isReady } : p
        ),
      })
    })

    socket.on('game-start', ({ gameState }) => {
      store.setGameState(gameState)
      store.setPhase('playing')
    })

    socket.on('dice-rolled', ({ value, validMoves, consecutiveSixes }) => {
      playDiceRoll()
      store.setDiceRolling(true)
      store.setConsecutiveSixes(consecutiveSixes)

      // Show dice then set value after animation delay
      setTimeout(() => {
        store.setDiceValue(value)
        store.setDiceRolling(false)

        const gs = useGameStore.getState().gameState
        if (!gs) return
        store.setGameState({ ...gs, validMoves, lastDiceValue: value, consecutiveSixes })
      }, 1000)
    })

    socket.on('token-moved', ({ gameState, capturedTokenIds }) => {
      if (capturedTokenIds.length > 0) {
        playTokenCapture()
        playTease()
        store.addNotification({
          message: `Token captured!`,
          type: 'capture',
        })
      } else {
        playTokenMove()
      }

      // Check if any token just entered home column (position >= 53)
      const prev = useGameStore.getState().gameState
      if (prev) {
        for (const player of gameState.players) {
          for (const token of player.tokens) {
            const prevToken = prev.players
              .find((p) => p.id === player.id)
              ?.tokens.find((t) => t.id === token.id)
            if (prevToken && prevToken.position < 53 && token.position >= 53) {
              playTokenHome()
            }
          }
        }
      }

      store.setGameState(gameState)
      store.setDiceValue(null)
    })

    socket.on('turn-changed', ({ playerId }) => {
      const gs = useGameStore.getState().gameState
      if (!gs) return
      store.setGameState({
        ...gs,
        currentTurn: playerId,
        lastDiceValue: null,
        validMoves: [],
      })
      store.setDiceValue(null)

      const myId = useGameStore.getState().myPlayerId
      if (playerId === myId) {
        store.addNotification({ message: "Your turn!", type: 'turn' })
      }
    })

    socket.on('turn-skipped', ({ playerId, reason }) => {
      const gs = useGameStore.getState().gameState
      const name = gs?.players.find((p) => p.id === playerId)?.name ?? 'Player'

      if (reason === 'triple-six') {
        playTripleSix()
        store.addNotification({
          message: `${name} rolled triple 6! Farthest token sent home 😱`,
          type: 'triple-six',
        })
      } else if (reason === 'no-valid-moves') {
        store.addNotification({ message: `${name} has no valid moves`, type: 'info' })
      }
    })

    socket.on('game-state-sync', ({ gameState }) => {
      store.setGameState(gameState)
    })

    socket.on('player-finished', ({ playerId, position }) => {
      const gs = useGameStore.getState().gameState
      const name = gs?.players.find((p) => p.id === playerId)?.name ?? 'Player'
      const ordinal = ['1st', '2nd', '3rd', '4th'][position - 1] ?? `${position}th`
      store.addNotification({ message: `${name} finished ${ordinal}! 🎉`, type: 'win' })
    })

    socket.on('game-over', ({ finishOrder }) => {
      playWin()
      const gs = useGameStore.getState().gameState
      if (gs) store.setGameState({ ...gs, status: 'finished', finishOrder })
      store.setPhase('finished')
    })

    socket.on('player-disconnected', ({ playerId, timeoutSecs }) => {
      const gs = useGameStore.getState().gameState
      const name = gs?.players.find((p) => p.id === playerId)?.name ?? 'Player'
      store.addNotification({
        message: `${name} disconnected (${timeoutSecs}s to reconnect)`,
        type: 'info',
      })
    })

    socket.on('player-reconnected', ({ playerId }) => {
      const gs = useGameStore.getState().gameState
      const name = gs?.players.find((p) => p.id === playerId)?.name ?? 'Player'
      store.addNotification({ message: `${name} reconnected`, type: 'info' })
    })

    socket.on('host-transferred', ({ newHostId }) => {
      const gs = useGameStore.getState().gameState
      if (!gs) return
      store.setGameState({
        ...gs,
        players: gs.players.map((p) => ({ ...p, isHost: p.id === newHostId })),
      })
    })

    socket.on('emoji-received', ({ playerId, playerName, emoji }) => {
      playEmojiSound(emoji)
      store.addEmojiReaction({ playerId, playerName, emoji, timestamp: Date.now() })
    })

    socket.on('room-error', ({ message }) => {
      store.addNotification({ message, type: 'error' })
    })

    return () => {
      socket.off('room-created')
      socket.off('room-joined')
      socket.off('player-joined')
      socket.off('player-ready-update')
      socket.off('game-start')
      socket.off('dice-rolled')
      socket.off('token-moved')
      socket.off('turn-changed')
      socket.off('turn-skipped')
      socket.off('game-state-sync')
      socket.off('player-finished')
      socket.off('game-over')
      socket.off('player-disconnected')
      socket.off('player-reconnected')
      socket.off('host-transferred')
      socket.off('emoji-received')
      socket.off('room-error')
      socket.off('connect_error')
      socket.off('disconnect')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Client → Server actions ─────────────────────────────────────────────────

  const createRoom = useCallback((name: string) => {
    void unlockAudio()
    const socket = socketRef.current
    const sessionToken = useGameStore.getState().sessionToken
    if (!socket || !sessionToken) {
      notifyError('Game connection is not ready yet. Please try again.')
      return false
    }
    if (!socket.connected) socket.connect()
    socket.emit('create-room', { name, sessionToken })
    return true
  }, [])

  const joinRoom = useCallback((code: string, name: string) => {
    void unlockAudio()
    const socket = socketRef.current
    const sessionToken = useGameStore.getState().sessionToken
    if (!socket || !sessionToken) {
      notifyError('Game connection is not ready yet. Please try again.')
      return false
    }
    if (!socket.connected) socket.connect()
    socket.emit('join-room', { code: code.toUpperCase(), name, sessionToken })
    return true
  }, [])

  const rejoinRoom = useCallback((code: string) => {
    const socket = socketRef.current
    const sessionToken = useGameStore.getState().sessionToken
    if (!socket || !sessionToken) return
    if (!socket.connected) socket.connect()
    socket.emit('rejoin-room', { code, sessionToken })
  }, [])

  const setReady = useCallback(() => {
    void unlockAudio()
    const socket = socketRef.current
    const roomCode = useGameStore.getState().roomCode
    if (!socket || !roomCode) return
    if (!socket.connected) socket.connect()
    socket.emit('player-ready', { roomCode })
  }, [])

  const startGame = useCallback(() => {
    void unlockAudio()
    const socket = socketRef.current
    const roomCode = useGameStore.getState().roomCode
    if (!socket || !roomCode) return
    if (!socket.connected) socket.connect()
    socket.emit('start-game', { roomCode })
  }, [])

  const rollDice = useCallback(() => {
    void unlockAudio()
    const socket = socketRef.current
    const roomCode = useGameStore.getState().roomCode
    const gs = useGameStore.getState().gameState
    const myId = useGameStore.getState().myPlayerId
    if (!socket || !roomCode || !gs) return
    if (gs.currentTurn !== myId) return
    if (gs.lastDiceValue !== null) return
    if (!socket.connected) socket.connect()
    socket.emit('roll-dice', { roomCode })
  }, [])

  const moveToken = useCallback((tokenId: string) => {
    void unlockAudio()
    const socket = socketRef.current
    const roomCode = useGameStore.getState().roomCode
    if (!socket || !roomCode) return
    if (!socket.connected) socket.connect()
    socket.emit('move-token', { roomCode, tokenId })
  }, [])

  const sendEmoji = useCallback((emoji: string) => {
    void unlockAudio()
    const socket = socketRef.current
    const roomCode = useGameStore.getState().roomCode
    if (!socket || !roomCode) return
    if (!socket.connected) socket.connect()
    socket.emit('send-emoji', { roomCode, emoji })
    // Play own sound immediately (don't wait for server echo)
    playEmojiSound(emoji)
  }, [])

  return {
    createRoom,
    joinRoom,
    rejoinRoom,
    setReady,
    startGame,
    rollDice,
    moveToken,
    sendEmoji,
  }
}
