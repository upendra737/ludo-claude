import { z } from "zod"

// ============================================
// API VALIDATION SCHEMAS
// ============================================

export const createRoomSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(20, "Name must be 20 characters or less")
    .trim(),
  sessionToken: z
    .string()
    .length(21, "Invalid session token"),
})

export const joinRoomSchema = z.object({
  code: z
    .string()
    .length(6, "Room code must be 6 characters")
    .toUpperCase(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(20, "Name must be 20 characters or less")
    .trim(),
  sessionToken: z
    .string()
    .length(21, "Invalid session token"),
})

export const moveTokenSchema = z.object({
  roomCode: z.string().length(6),
  tokenId: z.string().min(1),
})

export const rollDiceSchema = z.object({
  roomCode: z.string().length(6),
})

// ============================================
// SOCKET EVENT VALIDATION
// ============================================

export const socketCreateRoomSchema = z.object({
  name: z.string().min(1).max(20).trim(),
  sessionToken: z.string().length(21),
})

export const socketJoinRoomSchema = z.object({
  code: z.string().length(6),
  name: z.string().min(1).max(20).trim(),
  sessionToken: z.string().length(21),
})

export const socketRejoinRoomSchema = z.object({
  code: z.string().length(6),
  sessionToken: z.string().length(21),
})

export const socketMoveTokenSchema = z.object({
  roomCode: z.string().length(6),
  tokenId: z.string().min(1),
})

export const socketRollDiceSchema = z.object({
  roomCode: z.string().length(6),
})