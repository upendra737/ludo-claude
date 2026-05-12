'use client'
import { io, type Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/types/socket'

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let socket: GameSocket | null = null

function getDefaultSocketUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:3001'

  const { protocol, hostname, port, origin } = window.location
  if (process.env.NODE_ENV === 'development') {
    const devPort = port === '3000' ? '3001' : port || '3001'
    return `${protocol}//${hostname}:${devPort}`
  }

  return origin
}

export function getSocket(sessionToken: string): GameSocket {
  if (socket && socket.connected) return socket

  if (socket) {
    socket.disconnect()
    socket = null
  }

  const url = process.env.NEXT_PUBLIC_SOCKET_URL || getDefaultSocketUrl()

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
