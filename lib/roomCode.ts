import { db } from "./db"
import { rooms } from "../db/schema"
import { eq } from "drizzle-orm"

// ============================================
// GENERATE UNIQUE ROOM CODE
// 6 character alphanumeric uppercase code
// Retries up to 5 times if collision occurs
// ============================================

export function generateRoomCode(): string {
  // Generate 6 char code, uppercase letters + numbers
  // Exclude confusing characters: 0, O, I, 1
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function generateUniqueRoomCode(
  maxRetries = 5
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const code = generateRoomCode()

    // Check if code already exists
    const existing = await db
      .select()
      .from(rooms)
      .where(eq(rooms.code, code))
      .limit(1)

    if (existing.length === 0) {
      return code
    }
  }

  return generateRoomCode() + generateRoomCode().slice(0, 2)
}