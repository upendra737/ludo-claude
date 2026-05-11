import { db } from "../lib/db"
import { rooms } from "../db/schema"
import { lt } from "drizzle-orm"
import { serverState } from "./state"

// ============================================
// CLEANUP EXPIRED ROOMS
// Runs every 30 minutes
// Deletes rooms older than 2 hours
// ============================================

export function startCleanupJob(): void {
  const THIRTY_MINUTES = 30 * 60 * 1000

  setInterval(async () => {
    try {
      const now = new Date()

      // Delete expired rooms from DB
      const deleted = await db
        .delete(rooms)
        .where(lt(rooms.expiresAt, now))
        .returning()

      if (deleted.length > 0) {
        console.log(`Cleaned up ${deleted.length} expired rooms`)

        // Also remove from in-memory state
        deleted.forEach((room) => {
          if (serverState.hasRoom(room.code)) {
            serverState.deleteRoom(room.code)
          }
        })
      }
    } catch (error) {
      console.error("Cleanup job error:", error)
    }
  }, THIRTY_MINUTES)

  console.log("Cleanup job started")
}