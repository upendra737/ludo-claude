'use client'
import { io, type Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/types/socket'

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let socket: GameSocket | null = null

export function getSocket(sessionToken: string): GameSocket {
  if (socket && socket.connected) return socket

  if (socket) {
    socket.disconnect()
    socket = null
  }

  // In dev, connect to the separate socket server (port 3001).
  // In production (unified server), connect to the same origin.
  const url = process.env.NEXT_PUBLIC_SOCKET_URL
    ?? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001')

  socket = io(url, {
    auth: { sessionToken },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  }) as GameSocket

  return socket
}

export function getExistingSocket(): GameSocket | null {
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
