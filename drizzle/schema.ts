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

/**
 * Folders - organize projects
 */
export const folders = mysqlTable("folders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3B82F6"),
  parentFolderId: int("parentFolderId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = typeof folders.$inferInsert;

/**
 * Tags - for organizing and filtering
 */
export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 7 }).default("#6366F1"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

/**
 * Projects - main workspace for comment intelligence
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  folderId: int("folderId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  analysisSessionId: int("analysisSessionId"),
  // Stored search queries and filters
  searchQueries: json("searchQueries"),
  // Selected comments for the canvas
  selectedComments: json("selectedComments"),
  // AI-generated insights
  audienceInsights: json("audienceInsights"),
  psychographicProfile: json("psychographicProfile"),
  // Canvas state (generated assets)
  canvasState: json("canvasState"),
  // Generated marketing assets
  generatedAssets: json("generatedAssets"),
  status: mysqlEnum("status", ["draft", "active", "archived"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Project Tags - many-to-many relationship
 */
export const projectTags = mysqlTable("projectTags", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  tagId: int("tagId").notNull(),
});

export type ProjectTag = typeof projectTags.$inferSelect;
export type InsertProjectTag = typeof projectTags.$inferInsert;

/**
 * Comment Insights - AI-analyzed comments with categories
 */
export const commentInsights = mysqlTable("commentInsights", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  commentId: varchar("commentId", { length: 64 }).notNull(),
  videoId: varchar("videoId", { length: 64 }),
  videoTitle: text("videoTitle"),
  authorName: text("authorName"),
  commentText: text("commentText"),
  likeCount: int("likeCount").default(0),
  replyCount: int("replyCount").default(0),
  // AI-detected categories
  category: mysqlEnum("category", [
    "personal_story",
    "testimonial",
    "product_request",
    "pain_point",
    "humor",
    "question",
    "praise",
    "criticism",
    "suggestion",
    "other"
  ]).default("other").notNull(),
  // Sentiment score (-1 to 1)
  sentimentScore: int("sentimentScore").default(0),
  // Marketing potential score (0-100)
  marketingPotential: int("marketingPotential").default(0),
  // AI-extracted insights
  extractedInsights: json("extractedInsights"),
  // Suggested use cases
  suggestedUses: json("suggestedUses"),
  isSelected: int("isSelected").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommentInsight = typeof commentInsights.$inferSelect;
export type InsertCommentInsight = typeof commentInsights.$inferInsert;

/**
 * Generated Assets - marketing content created from insights
 */
export const generatedAssets = mysqlTable("generatedAssets", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  type: mysqlEnum("type", [
    "advertorial",
    "vsl_script",
    "ugc_scenario",
    "ebook_outline",
    "course_structure",
    "ad_copy",
    "sales_page",
    "product_offer",
    "email_sequence",
    "social_post",
    "testimonial_formatted",
    "custom"
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  // Source comments used to generate this asset
  sourceCommentIds: json("sourceCommentIds"),
  // The prompt used to generate
  generationPrompt: text("generationPrompt"),
  // Metadata about the generation
  metadata: json("metadata"),
  isFavorite: int("isFavorite").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GeneratedAsset = typeof generatedAssets.$inferSelect;
export type InsertGeneratedAsset = typeof generatedAssets.$inferInsert;

/**
 * Amazon Products - store product information
 */
export const amazonProducts = mysqlTable("amazonProducts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  asin: varchar("asin", { length: 20 }).notNull(),
  title: text("title"),
  description: text("description"),
  brand: varchar("brand", { length: 255 }),
  price: varchar("price", { length: 50 }),
  rating: varchar("rating", { length: 10 }),
  reviewCount: int("reviewCount").default(0),
  imageUrl: text("imageUrl"),
  productUrl: text("productUrl"),
  category: varchar("category", { length: 255 }),
  features: json("features"),
  rawData: json("rawData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AmazonProduct = typeof amazonProducts.$inferSelect;
export type InsertAmazonProduct = typeof amazonProducts.$inferInsert;

/**
 * Amazon Reviews - store product reviews
 */
export const amazonReviews = mysqlTable("amazonReviews", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  reviewId: varchar("reviewId", { length: 64 }),
  author: varchar("author", { length: 255 }),
  rating: int("rating"),
  title: text("title"),
  body: text("body"),
  helpfulVotes: int("helpfulVotes").default(0),
  verified: int("verified").default(0),
  reviewDate: timestamp("reviewDate"),
  // AI-analyzed fields
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]).default("neutral"),
  themes: json("themes"),
  painPoints: json("painPoints"),
  praises: json("praises"),
  rawData: json("rawData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AmazonReview = typeof amazonReviews.$inferSelect;
export type InsertAmazonReview = typeof amazonReviews.$inferInsert;

/**
 * Reddit Posts - store subreddit posts
 */
export const redditPosts = mysqlTable("redditPosts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  postId: varchar("postId", { length: 20 }).notNull(),
  subreddit: varchar("subreddit", { length: 100 }).notNull(),
  title: text("title"),
  body: text("body"),
  author: varchar("author", { length: 100 }),
  score: int("score").default(0),
  upvoteRatio: varchar("upvoteRatio", { length: 10 }),
  commentCount: int("commentCount").default(0),
  postUrl: text("postUrl"),
  isNsfw: int("isNsfw").default(0),
  flair: varchar("flair", { length: 100 }),
  mediaUrl: text("mediaUrl"),
  postedAt: timestamp("postedAt"),
  rawData: json("rawData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RedditPost = typeof redditPosts.$inferSelect;
export type InsertRedditPost = typeof redditPosts.$inferInsert;

/**
 * Reddit Comments - store post comments
 */
export const redditComments = mysqlTable("redditComments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  commentId: varchar("commentId", { length: 20 }).notNull(),
  parentCommentId: varchar("parentCommentId", { length: 20 }),
  author: varchar("author", { length: 100 }),
  body: text("body"),
  score: int("score").default(0),
  isOp: int("isOp").default(0),
  depth: int("depth").default(0),
  postedAt: timestamp("postedAt"),
  // AI-analyzed fields
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]).default("neutral"),
  themes: json("themes"),
  rawData: json("rawData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RedditComment = typeof redditComments.$inferSelect;
export type InsertRedditComment = typeof redditComments.$inferInsert;

/**
 * Research Sessions - unified tracking for all research types
 */
export const researchSessions = mysqlTable("researchSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  projectId: int("projectId"),
  sourceType: mysqlEnum("sourceType", ["youtube", "amazon", "reddit"]).notNull(),
  name: varchar("name", { length: 255 }),
  searchQuery: text("searchQuery"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  itemsFetched: int("itemsFetched").default(0),
  insightsGenerated: int("insightsGenerated").default(0),
  summary: json("summary"),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type ResearchSession = typeof researchSessions.$inferSelect;
export type InsertResearchSession = typeof researchSessions.$inferInsert;

/**
 * Multi-Source Insights - unified insights from all sources
 */
export const multiSourceInsights = mysqlTable("multiSourceInsights", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  sourceType: mysqlEnum("sourceType", ["youtube", "amazon", "reddit"]).notNull(),
  sourceId: varchar("sourceId", { length: 64 }).notNull(),
  sourceTitle: text("sourceTitle"),
  authorName: text("authorName"),
  contentText: text("contentText"),
  engagementScore: int("engagementScore").default(0),
  // AI-detected categories (unified across sources)
  category: mysqlEnum("category", [
    "personal_story",
    "testimonial",
    "product_request",
    "pain_point",
    "humor",
    "question",
    "praise",
    "criticism",
    "suggestion",
    "comparison",
    "recommendation",
    "warning",
    "tip",
    "other"
  ]).default("other").notNull(),
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]).default("neutral"),
  marketingPotential: int("marketingPotential").default(0),
  extractedInsights: json("extractedInsights"),
  suggestedUses: json("suggestedUses"),
  isSelected: int("isSelected").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MultiSourceInsight = typeof multiSourceInsights.$inferSelect;
export type InsertMultiSourceInsight = typeof multiSourceInsights.$inferInsert;


/**
 * Saved Playlists - user's saved playlists for ongoing tracking
 */
export const savedPlaylists = mysqlTable("savedPlaylists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  youtubePlaylistId: varchar("youtubePlaylistId", { length: 64 }).notNull(),
  title: text("title"),
  description: text("description"),
  channelTitle: text("channelTitle"),
  thumbnailUrl: text("thumbnailUrl"),
  videoCount: int("videoCount").default(0),
  // Tracking timestamps
  lastRunAt: timestamp("lastRunAt"),
  lastVideoCount: int("lastVideoCount").default(0),
  lastCommentCount: int("lastCommentCount").default(0),
  // Auto-refresh settings
  autoRefresh: int("autoRefresh").default(0),
  refreshInterval: int("refreshInterval").default(24), // hours
  // Status
  status: mysqlEnum("status", ["active", "paused", "archived"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavedPlaylist = typeof savedPlaylists.$inferSelect;
export type InsertSavedPlaylist = typeof savedPlaylists.$inferInsert;

/**
 * Playlist Runs - history of analysis runs for each saved playlist
 */
export const playlistRuns = mysqlTable("playlistRuns", {
  id: int("id").autoincrement().primaryKey(),
  savedPlaylistId: int("savedPlaylistId").notNull(),
  // Run statistics
  videosAnalyzed: int("videosAnalyzed").default(0),
  commentsCollected: int("commentsCollected").default(0),
  newVideos: int("newVideos").default(0),
  newComments: int("newComments").default(0),
  // Run metadata
  status: mysqlEnum("status", ["running", "completed", "failed"]).default("running").notNull(),
  errorMessage: text("errorMessage"),
  // Timestamps
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type PlaylistRun = typeof playlistRuns.$inferSelect;
export type InsertPlaylistRun = typeof playlistRuns.$inferInsert;

/**
 * Playlist Videos - link videos to saved playlists
 */
export const playlistVideos = mysqlTable("playlistVideos", {
  id: int("id").autoincrement().primaryKey(),
  savedPlaylistId: int("savedPlaylistId").notNull(),
  videoYoutubeId: varchar("videoYoutubeId", { length: 64 }).notNull(),
  videoTitle: text("videoTitle"),
  thumbnailUrl: text("thumbnailUrl"),
  viewCount: bigint("viewCount", { mode: "number" }).default(0),
  likeCount: bigint("likeCount", { mode: "number" }).default(0),
  commentCount: bigint("commentCount", { mode: "number" }).default(0),
  publishedAt: timestamp("publishedAt"),
  // Track when this video was first seen in the playlist
  firstSeenAt: timestamp("firstSeenAt").defaultNow().notNull(),
  // Track last time comments were fetched
  lastCommentFetchAt: timestamp("lastCommentFetchAt"),
});

export type PlaylistVideo = typeof playlistVideos.$inferSelect;
export type InsertPlaylistVideo = typeof playlistVideos.$inferInsert;
