import { nanoid } from "nanoid"

// ============================================
// SESSION TOKEN
// 21 character unique ID stored in
// localStorage on client
// Used to identify and reconnect players
// ============================================

export function generateSessionToken(): string {
  return nanoid(21)
}

export function isValidSessionToken(token: unknown): boolean {
  return (
    typeof token === "string" &&
    token.length === 21 &&
    /^[a-zA-Z0-9_-]+$/.test(token)
  )
}