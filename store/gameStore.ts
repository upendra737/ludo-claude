'use client'
import { create } from 'zustand'
import type { GameState, Player } from '@/types/game'

export interface EmojiReaction {
  id: string
  playerId: string
  playerName: string
  emoji: string
  timestamp: number
}

export interface Notification {
  id: string
  message: string
  type: 'info' | 'capture' | 'triple-six' | 'win' | 'turn' | 'error'
}

export type Phase = 'home' | 'lobby' | 'playing' | 'finished'

interface GameStore {
  // Identity
  sessionToken: string | null
  myPlayerId: string | null

  // Room
  roomCode: string | null

  // State
  gameState: GameState | null
  myPlayer: Player | null

  // Dice UI
  diceValue: number | null
  diceRolling: boolean
  consecutiveSixes: number

  // Phase
  phase: Phase

  // Notifications
  notifications: Notification[]

  // Emoji reactions
  emojiReactions: EmojiReaction[]

  // Actions
  setSessionToken: (token: string) => void
  setMyPlayerId: (id: string) => void
  setRoomCode: (code: string) => void
  setGameState: (state: GameState) => void
  setDiceValue: (value: number | null) => void
  setDiceRolling: (rolling: boolean) => void
  setConsecutiveSixes: (n: number) => void
  setPhase: (phase: Phase) => void
  addNotification: (n: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  addEmojiReaction: (r: Omit<EmojiReaction, 'id'>) => void
  reset: () => void
}

const initial = {
  sessionToken: null,
  myPlayerId: null,
  roomCode: null,
  gameState: null,
  myPlayer: null,
  diceValue: null,
  diceRolling: false,
  consecutiveSixes: 0,
  phase: 'home' as Phase,
  notifications: [] as Notification[],
  emojiReactions: [] as EmojiReaction[],
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initial,

  setSessionToken: (token) => set({ sessionToken: token }),
  setMyPlayerId: (id) => set({ myPlayerId: id }),
  setRoomCode: (code) => set({ roomCode: code }),

  setGameState: (gameState) => {
    const myPlayerId = get().myPlayerId
    const myPlayer = myPlayerId
      ? (gameState.players.find((p) => p.id === myPlayerId) ?? null)
      : null
    set({ gameState, myPlayer })
  },

  setDiceValue: (diceValue) => set({ diceValue }),
  setDiceRolling: (diceRolling) => set({ diceRolling }),
  setConsecutiveSixes: (consecutiveSixes) => set({ consecutiveSixes }),
  setPhase: (phase) => set({ phase }),

  addNotification: (n) => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ notifications: [...s.notifications, { ...n, id }] }))
    setTimeout(() => get().removeNotification(id), 4000)
  },

  removeNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

  addEmojiReaction: (r) => {
    const id = Math.random().toString(36).slice(2)
    const reaction = { ...r, id }
    set((s) => ({ emojiReactions: [...s.emojiReactions, reaction] }))
    setTimeout(
      () =>
        set((s) => ({
          emojiReactions: s.emojiReactions.filter((e) => e.id !== id),
        })),
      4000
    )
  },

  reset: () => set({ ...initial }),
}))
