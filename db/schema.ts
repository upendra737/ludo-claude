import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core"
import type { GameState } from "@/types/game"

// ============================================
// ENUMS
// ============================================

export const gameStatusEnum = pgEnum("game_status", [
  "waiting",
  "starting",
  "active",
  "finished",
])

export const colorEnum = pgEnum("color", [
  "red",
  "green",
  "yellow",
  "blue",
])

export const playerStatusEnum = pgEnum("player_status", [
  "connected",
  "disconnected",
  "abandoned",
])

// ============================================
// ROOMS TABLE
// ============================================

export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 6 }).unique().notNull(),
  status: gameStatusEnum("status").default("waiting").notNull(),
  hostId: uuid("host_id"),
  minPlayers: integer("min_players").default(2).notNull(),
  maxPlayers: integer("max_players").default(4).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
})

// ============================================
// PLAYERS TABLE
// ============================================

export const players = pgTable("players", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id")
    .references(() => rooms.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 20 }).notNull(),
  color: colorEnum("color").notNull(),
  slot: integer("slot").notNull(),
  isHost: boolean("is_host").default(false).notNull(),
  isReady: boolean("is_ready").default(false).notNull(),
  sessionToken: varchar("session_token", { length: 21 }).unique().notNull(),
  socketId: varchar("socket_id", { length: 100 }),
  status: playerStatusEnum("status").default("connected").notNull(),
  finishPosition: integer("finish_position"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
})

// ============================================
// GAME STATE TABLE
// ============================================

export const gameStates = pgTable("game_states", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id")
    .references(() => rooms.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  state: jsonb("state").$type<GameState>().notNull(),
  currentTurn: uuid("current_turn"),
  moveCount: integer("move_count").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ============================================
// INFERRED TYPES
// ============================================

export type Room = typeof rooms.$inferSelect
export type NewRoom = typeof rooms.$inferInsert
export type DbPlayer = typeof players.$inferSelect
export type NewPlayer = typeof players.$inferInsert
export type DbGameState = typeof gameStates.$inferSelect
export type NewGameState = typeof gameStates.$inferInsert