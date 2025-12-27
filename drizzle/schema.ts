import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * YouTube Playlists
 */
export const playlists = mysqlTable("playlists", {
  id: int("id").autoincrement().primaryKey(),
  youtubeId: varchar("youtubeId", { length: 64 }).notNull().unique(),
  title: text("title"),
  description: text("description"),
  channelId: varchar("channelId", { length: 64 }),
  channelTitle: text("channelTitle"),
  thumbnailUrl: text("thumbnailUrl"),
  videoCount: int("videoCount").default(0),
  publishedAt: timestamp("publishedAt"),
  rawData: json("rawData"),
  userId: int("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Playlist = typeof playlists.$inferSelect;
export type InsertPlaylist = typeof playlists.$inferInsert;

/**
 * YouTube Videos
 */
export const videos = mysqlTable("videos", {
  id: int("id").autoincrement().primaryKey(),
  youtubeId: varchar("youtubeId", { length: 64 }).notNull().unique(),
  playlistId: int("playlistId"),
  title: text("title"),
  description: text("description"),
  channelId: varchar("channelId", { length: 64 }),
  channelTitle: text("channelTitle"),
  thumbnailUrl: text("thumbnailUrl"),
  duration: varchar("duration", { length: 32 }),
  viewCount: bigint("viewCount", { mode: "number" }).default(0),
  likeCount: bigint("likeCount", { mode: "number" }).default(0),
  commentCount: bigint("commentCount", { mode: "number" }).default(0),
  publishedAt: timestamp("publishedAt"),
  tags: json("tags"),
  rawData: json("rawData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

/**
 * YouTube Comments
 */
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  youtubeId: varchar("youtubeId", { length: 64 }).notNull().unique(),
  videoId: int("videoId"),
  parentCommentId: int("parentCommentId"),
  authorChannelId: varchar("authorChannelId", { length: 64 }),
  authorDisplayName: text("authorDisplayName"),
  authorProfileImageUrl: text("authorProfileImageUrl"),
  textDisplay: text("textDisplay"),
  textOriginal: text("textOriginal"),
  likeCount: int("likeCount").default(0),
  replyCount: int("replyCount").default(0),
  publishedAt: timestamp("publishedAt"),
  updatedAt: timestamp("updatedAt"),
  rawData: json("rawData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

/**
 * Analysis Sessions - tracks user analysis history
 */
export const analysisSessions = mysqlTable("analysisSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  playlistId: int("playlistId"),
  name: varchar("name", { length: 255 }),
  inputUrls: text("inputUrls"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  videosFetched: int("videosFetched").default(0),
  commentsFetched: int("commentsFetched").default(0),
  totalViews: bigint("totalViews", { mode: "number" }).default(0),
  totalLikes: bigint("totalLikes", { mode: "number" }).default(0),
  videosData: json("videosData"),
  commentsData: json("commentsData"),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type AnalysisSession = typeof analysisSessions.$inferSelect;
export type InsertAnalysisSession = typeof analysisSessions.$inferInsert;