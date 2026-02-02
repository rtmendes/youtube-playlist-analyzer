import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, json, boolean, decimal } from "drizzle-orm/mysql-core";

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
  // Scheduled refresh settings
  refreshSchedule: mysqlEnum("refreshSchedule", ["none", "daily", "weekly"]).default("none").notNull(),
  nextRefreshAt: timestamp("nextRefreshAt"),
  refreshHour: int("refreshHour").default(9), // Hour of day to run refresh (0-23)
  refreshDayOfWeek: int("refreshDayOfWeek").default(1), // Day of week for weekly (0=Sun, 1=Mon, etc.)
  // Legacy auto-refresh settings (kept for compatibility)
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


/**
 * TikTok Creators - stores TikTok creator/account information
 */
export const tiktokCreators = mysqlTable("tiktokCreators", {
  id: int("id").autoincrement().primaryKey(),
  uniqueId: varchar("uniqueId", { length: 128 }).notNull().unique(), // @username
  nickname: varchar("nickname", { length: 256 }),
  avatarUrl: text("avatarUrl"),
  signature: text("signature"), // bio
  verified: boolean("verified").default(false),
  followerCount: bigint("followerCount", { mode: "number" }).default(0),
  followingCount: bigint("followingCount", { mode: "number" }).default(0),
  heartCount: bigint("heartCount", { mode: "number" }).default(0), // total likes
  videoCount: int("videoCount").default(0),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TikTokCreator = typeof tiktokCreators.$inferSelect;
export type InsertTikTokCreator = typeof tiktokCreators.$inferInsert;

/**
 * TikTok Videos - stores TikTok video information
 */
export const tiktokVideos = mysqlTable("tiktokVideos", {
  id: int("id").autoincrement().primaryKey(),
  videoId: varchar("videoId", { length: 64 }).notNull().unique(),
  creatorId: int("creatorId"),
  creatorUniqueId: varchar("creatorUniqueId", { length: 128 }),
  // Video content
  description: text("description"),
  coverUrl: text("coverUrl"),
  videoUrl: text("videoUrl"),
  duration: int("duration"), // seconds
  // Engagement metrics
  playCount: bigint("playCount", { mode: "number" }).default(0),
  diggCount: bigint("diggCount", { mode: "number" }).default(0), // likes
  shareCount: bigint("shareCount", { mode: "number" }).default(0),
  commentCount: bigint("commentCount", { mode: "number" }).default(0),
  collectCount: bigint("collectCount", { mode: "number" }).default(0), // saves
  // Music/Sound
  musicId: varchar("musicId", { length: 64 }),
  musicTitle: varchar("musicTitle", { length: 256 }),
  musicAuthor: varchar("musicAuthor", { length: 256 }),
  // Hashtags (stored as JSON array)
  hashtags: json("hashtags").$type<string[]>(),
  // Timestamps
  createTime: timestamp("createTime"),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
});

export type TikTokVideo = typeof tiktokVideos.$inferSelect;
export type InsertTikTokVideo = typeof tiktokVideos.$inferInsert;

/**
 * TikTok Comments - stores TikTok video comments
 */
export const tiktokComments = mysqlTable("tiktokComments", {
  id: int("id").autoincrement().primaryKey(),
  commentId: varchar("commentId", { length: 64 }).notNull(),
  videoId: varchar("videoId", { length: 64 }).notNull(),
  // Author info
  authorUniqueId: varchar("authorUniqueId", { length: 128 }),
  authorNickname: varchar("authorNickname", { length: 256 }),
  authorAvatarUrl: text("authorAvatarUrl"),
  // Comment content
  text: text("text"),
  diggCount: bigint("diggCount", { mode: "number" }).default(0), // likes
  replyCount: int("replyCount").default(0),
  // Sentiment analysis
  sentiment: mysqlEnum("sentiment", ["positive", "negative", "neutral", "mixed"]),
  sentimentScore: decimal("sentimentScore", { precision: 5, scale: 4 }),
  // Timestamps
  createTime: timestamp("createTime"),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
});

export type TikTokComment = typeof tiktokComments.$inferSelect;
export type InsertTikTokComment = typeof tiktokComments.$inferInsert;

/**
 * Saved Comments - user's highlighted/bookmarked comments from any source
 */
export const savedComments = mysqlTable("savedComments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Source reference
  sourceType: mysqlEnum("sourceType", ["youtube", "amazon", "reddit", "tiktok"]).notNull(),
  sourceId: varchar("sourceId", { length: 128 }).notNull(), // video/product/post ID
  commentId: varchar("commentId", { length: 128 }).notNull(),
  // Comment content snapshot
  authorName: varchar("authorName", { length: 256 }),
  text: text("text").notNull(),
  // User annotations
  highlighted: boolean("highlighted").default(false),
  notes: text("notes"),
  tags: json("tags").$type<string[]>(),
  // Collection/folder
  collectionName: varchar("collectionName", { length: 128 }),
  // Sort order within collection
  sortOrder: int("sortOrder").default(0),
  // Timestamps
  savedAt: timestamp("savedAt").defaultNow().notNull(),
});

export type SavedComment = typeof savedComments.$inferSelect;
export type InsertSavedComment = typeof savedComments.$inferInsert;


/**
 * Comment Collections - user-created folders for organizing saved comments
 */
export const commentCollections = mysqlTable("commentCollections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#6366f1"), // hex color
  icon: varchar("icon", { length: 32 }).default("folder"), // lucide icon name
  // Stats (denormalized for performance)
  commentCount: int("commentCount").default(0),
  // Sharing
  isPublic: boolean("isPublic").default(false),
  shareToken: varchar("shareToken", { length: 64 }),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CommentCollection = typeof commentCollections.$inferSelect;
export type InsertCommentCollection = typeof commentCollections.$inferInsert;

/**
 * NLP Analysis Results - cached AI analysis for comments
 */
export const nlpAnalysisResults = mysqlTable("nlpAnalysisResults", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Analysis scope
  sourceType: mysqlEnum("sourceType", ["youtube", "amazon", "reddit", "tiktok", "mixed"]).notNull(),
  sourceId: varchar("sourceId", { length: 128 }), // specific video/product/post or null for mixed
  // Analysis results
  topics: json("topics").$type<{ topic: string; score: number; keywords: string[] }[]>(),
  sentimentBreakdown: json("sentimentBreakdown").$type<{ positive: number; negative: number; neutral: number; mixed: number }>(),
  keyThemes: json("keyThemes").$type<string[]>(),
  painPoints: json("painPoints").$type<{ text: string; frequency: number }[]>(),
  suggestions: json("suggestions").$type<{ text: string; frequency: number }[]>(),
  questions: json("questions").$type<string[]>(),
  namedEntities: json("namedEntities").$type<{ entity: string; type: string; count: number }[]>(),
  summary: text("summary"),
  // Metadata
  commentCount: int("commentCount").default(0),
  analyzedAt: timestamp("analyzedAt").defaultNow().notNull(),
});

export type NlpAnalysisResult = typeof nlpAnalysisResults.$inferSelect;
export type InsertNlpAnalysisResult = typeof nlpAnalysisResults.$inferInsert;


/**
 * Content Templates - stores generated marketing content
 */
export const contentTemplates = mysqlTable("contentTemplates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Content type
  contentType: mysqlEnum("contentType", [
    "advertorial",
    "vsl_script",
    "ugc_scenario",
    "course_outline",
    "ad_copy",
    "sales_page",
    "email_sequence",
    "product_idea"
  ]).notNull(),
  // Content details
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  // Source data used
  sourceComments: json("sourceComments").$type<{
    id: string;
    text: string;
    source: string;
    category?: string;
  }[]>(),
  sourceInsights: json("sourceInsights").$type<{
    painPoints: string[];
    desires: string[];
    objections: string[];
    testimonials: string[];
  }>(),
  // Generation settings
  promptUsed: text("promptUsed"),
  frameworkUsed: varchar("frameworkUsed", { length: 64 }), // AIDA, PAS, BAB, etc.
  tone: varchar("tone", { length: 64 }), // professional, casual, urgent, etc.
  targetAudience: text("targetAudience"),
  // Metadata
  wordCount: int("wordCount").default(0),
  version: int("version").default(1),
  parentTemplateId: int("parentTemplateId"), // for revisions
  isFavorite: boolean("isFavorite").default(false),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentTemplate = typeof contentTemplates.$inferSelect;
export type InsertContentTemplate = typeof contentTemplates.$inferInsert;

/**
 * AI Prompts Knowledge Base - expert prompts for content generation
 */
export const aiPromptsKnowledgeBase = mysqlTable("aiPromptsKnowledgeBase", {
  id: int("id").autoincrement().primaryKey(),
  // Prompt categorization
  contentType: mysqlEnum("contentType", [
    "advertorial",
    "vsl_script",
    "ugc_scenario",
    "course_outline",
    "ad_copy",
    "sales_page",
    "email_sequence",
    "product_idea"
  ]).notNull(),
  category: varchar("category", { length: 64 }).notNull(), // e.g., "hook", "story", "cta", "objection_handling"
  // Prompt content
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  promptTemplate: text("promptTemplate").notNull(),
  // Variables that can be injected
  variables: json("variables").$type<{
    name: string;
    description: string;
    required: boolean;
    defaultValue?: string;
  }[]>(),
  // Best practices and tips
  bestPractices: json("bestPractices").$type<string[]>(),
  examples: json("examples").$type<{
    input: string;
    output: string;
  }[]>(),
  // Performance metrics
  useCount: int("useCount").default(0),
  avgRating: decimal("avgRating", { precision: 3, scale: 2 }),
  // Metadata
  isSystem: boolean("isSystem").default(true), // system vs user-created
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiPromptKnowledgeBase = typeof aiPromptsKnowledgeBase.$inferSelect;
export type InsertAiPromptKnowledgeBase = typeof aiPromptsKnowledgeBase.$inferInsert;

/**
 * CRO Best Practices - conversion optimization guidelines
 */
export const croBestPractices = mysqlTable("croBestPractices", {
  id: int("id").autoincrement().primaryKey(),
  // Categorization
  contentType: varchar("contentType", { length: 64 }).notNull(),
  section: varchar("section", { length: 64 }).notNull(), // e.g., "headline", "cta", "social_proof"
  // Practice details
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  // Implementation guidance
  doList: json("doList").$type<string[]>(),
  dontList: json("dontList").$type<string[]>(),
  examples: json("examples").$type<{
    good: string;
    bad: string;
    explanation: string;
  }[]>(),
  // Metrics and benchmarks
  benchmarks: json("benchmarks").$type<{
    metric: string;
    target: string;
    industry: string;
  }[]>(),
  // Priority and impact
  priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).default("medium"),
  impactScore: int("impactScore").default(50), // 0-100
  // Metadata
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CroBestPractice = typeof croBestPractices.$inferSelect;
export type InsertCroBestPractice = typeof croBestPractices.$inferInsert;

/**
 * Copywriting Frameworks - structured frameworks for content creation
 */
export const copywritingFrameworks = mysqlTable("copywritingFrameworks", {
  id: int("id").autoincrement().primaryKey(),
  // Framework identification
  acronym: varchar("acronym", { length: 20 }).notNull().unique(), // AIDA, PAS, BAB, etc.
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description").notNull(),
  // Framework structure
  steps: json("steps").$type<{
    letter: string;
    name: string;
    description: string;
    promptGuidance: string;
    examples: string[];
  }[]>(),
  // Best use cases
  bestFor: json("bestFor").$type<string[]>(), // ["sales_pages", "email", "ads"]
  // Template
  templateStructure: text("templateStructure"),
  // Metadata
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CopywritingFramework = typeof copywritingFrameworks.$inferSelect;
export type InsertCopywritingFramework = typeof copywritingFrameworks.$inferInsert;


/**
 * Saved Templates - reusable content templates with variable placeholders
 */
export const savedTemplates = mysqlTable("savedTemplates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Template identification
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // Content type this template is for
  contentType: mysqlEnum("contentType", [
    "advertorial",
    "vsl_script",
    "ugc_scenario",
    "course_outline",
    "ad_copy",
    "sales_page",
    "email_sequence",
    "product_idea"
  ]).notNull(),
  // The template content with {{variable}} placeholders
  templateContent: text("templateContent").notNull(),
  // Variables that need to be filled in
  variables: json("variables").$type<{
    name: string;
    description: string;
    defaultValue?: string;
    required: boolean;
  }[]>(),
  // Template settings
  frameworkUsed: varchar("frameworkUsed", { length: 64 }),
  tone: varchar("tone", { length: 64 }),
  // Categorization
  category: varchar("category", { length: 64 }),
  tags: json("tags").$type<string[]>(),
  // Usage tracking
  useCount: int("useCount").default(0),
  lastUsedAt: timestamp("lastUsedAt"),
  // Sharing
  isPublic: boolean("isPublic").default(false),
  // Metadata
  isFavorite: boolean("isFavorite").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavedTemplate = typeof savedTemplates.$inferSelect;
export type InsertSavedTemplate = typeof savedTemplates.$inferInsert;

/**
 * Content Versions - track iterations and A/B test results
 */
export const contentVersions = mysqlTable("contentVersions", {
  id: int("id").autoincrement().primaryKey(),
  // Link to the original content template
  contentTemplateId: int("contentTemplateId").notNull(),
  userId: int("userId").notNull(),
  // Version info
  versionNumber: int("versionNumber").notNull().default(1),
  versionName: varchar("versionName", { length: 128 }), // e.g., "Version A", "Holiday variant"
  // The actual content for this version
  content: text("content").notNull(),
  // What changed from previous version
  changeNotes: text("changeNotes"),
  changeSummary: varchar("changeSummary", { length: 255 }), // brief summary
  // A/B Test tracking
  isAbTest: boolean("isAbTest").default(false),
  abTestName: varchar("abTestName", { length: 128 }),
  abTestVariant: varchar("abTestVariant", { length: 32 }), // "A", "B", "C", etc.
  // Performance metrics
  metrics: json("metrics").$type<{
    impressions?: number;
    clicks?: number;
    conversions?: number;
    ctr?: number;
    conversionRate?: number;
    revenue?: number;
    engagement?: number;
    customMetrics?: Record<string, number>;
  }>(),
  // Status
  status: mysqlEnum("status", ["draft", "active", "testing", "winner", "archived"]).default("draft"),
  // Annotations and notes
  annotations: json("annotations").$type<{
    timestamp: string;
    note: string;
    author?: string;
  }[]>(),
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentVersion = typeof contentVersions.$inferSelect;
export type InsertContentVersion = typeof contentVersions.$inferInsert;

/**
 * Export History - track exports to external tools
 */
export const exportHistory = mysqlTable("exportHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // What was exported
  contentTemplateId: int("contentTemplateId"),
  contentVersionId: int("contentVersionId"),
  // Export destination
  destination: mysqlEnum("destination", [
    "google_docs",
    "notion",
    "clipboard",
    "markdown_file",
    "pdf",
    "word",
    "file",
    "batch_file",
    "batch_google_docs",
    "batch_notion"
  ]).notNull(),
  // Export details
  exportFormat: varchar("exportFormat", { length: 32 }), // "plain_text", "markdown", "rich_text", "html"
  // External references
  externalUrl: text("externalUrl"), // URL to the created doc
  externalId: varchar("externalId", { length: 255 }), // ID in external system
  // Export metadata
  title: varchar("title", { length: 255 }),
  contentPreview: text("contentPreview"), // first 500 chars
  wordCount: int("wordCount"),
  // Status
  status: mysqlEnum("status", ["pending", "success", "failed"]).default("pending"),
  errorMessage: text("errorMessage"),
  // Timestamps
  exportedAt: timestamp("exportedAt").defaultNow().notNull(),
});

export type ExportHistory = typeof exportHistory.$inferSelect;
export type InsertExportHistory = typeof exportHistory.$inferInsert;

/**
 * Content Schedules - automatic content refresh scheduling
 */
export const contentSchedules = mysqlTable("contentSchedules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // What to refresh
  savedTemplateId: int("savedTemplateId").notNull(),
  contentTemplateId: int("contentTemplateId"), // optional link to specific generated content
  // Schedule configuration
  frequency: mysqlEnum("frequency", ["daily", "weekly", "biweekly", "monthly"]).notNull(),
  dayOfWeek: int("dayOfWeek"), // 0-6 for weekly schedules
  dayOfMonth: int("dayOfMonth"), // 1-31 for monthly schedules
  timeOfDay: varchar("timeOfDay", { length: 8 }), // HH:MM format
  timezone: varchar("timezone", { length: 64 }).default("UTC"),
  // Variables to use for regeneration
  variables: json("variables").$type<Record<string, string>>(),
  // Status
  status: mysqlEnum("status", ["active", "paused", "completed", "failed"]).default("active"),
  // Tracking
  lastRunAt: timestamp("lastRunAt"),
  nextRunAt: timestamp("nextRunAt"),
  runCount: int("runCount").default(0),
  // Notification settings
  notifyOnComplete: boolean("notifyOnComplete").default(true),
  notifyEmail: varchar("notifyEmail", { length: 320 }),
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentSchedule = typeof contentSchedules.$inferSelect;
export type InsertContentSchedule = typeof contentSchedules.$inferInsert;

/**
 * Template Shares - sharing templates with other users
 */
export const templateShares = mysqlTable("templateShares", {
  id: int("id").autoincrement().primaryKey(),
  // The template being shared
  savedTemplateId: int("savedTemplateId").notNull(),
  // Who owns the template
  ownerUserId: int("ownerUserId").notNull(),
  // Who it's shared with (null for public shares)
  sharedWithUserId: int("sharedWithUserId"),
  sharedWithEmail: varchar("sharedWithEmail", { length: 320 }),
  // Permission level
  permission: mysqlEnum("permission", ["view", "duplicate", "edit"]).default("view"),
  // Share type
  shareType: mysqlEnum("shareType", ["direct", "link", "public"]).default("direct"),
  // Share link for link-based sharing
  shareToken: varchar("shareToken", { length: 64 }),
  // Status
  status: mysqlEnum("status", ["pending", "accepted", "declined", "revoked"]).default("pending"),
  // Usage tracking
  viewCount: int("viewCount").default(0),
  duplicateCount: int("duplicateCount").default(0),
  lastAccessedAt: timestamp("lastAccessedAt"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type TemplateShare = typeof templateShares.$inferSelect;
export type InsertTemplateShare = typeof templateShares.$inferInsert;

/**
 * A/B Test Results - detailed tracking for A/B test winner detection
 */
export const abTestResults = mysqlTable("abTestResults", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // The A/B test identification
  testName: varchar("testName", { length: 255 }).notNull(),
  contentTemplateId: int("contentTemplateId").notNull(),
  // Versions being tested
  versionAId: int("versionAId").notNull(),
  versionBId: int("versionBId").notNull(),
  // Additional variants (optional)
  additionalVersionIds: json("additionalVersionIds").$type<number[]>(),
  // Test configuration
  primaryMetric: mysqlEnum("primaryMetric", ["ctr", "conversion_rate", "engagement", "revenue"]).default("ctr"),
  minimumSampleSize: int("minimumSampleSize").default(100),
  confidenceThreshold: decimal("confidenceThreshold", { precision: 5, scale: 4 }).default("0.95"),
  // Results
  winnerVersionId: int("winnerVersionId"),
  winnerDeclaredAt: timestamp("winnerDeclaredAt"),
  winnerDeclaredBy: mysqlEnum("winnerDeclaredBy", ["auto", "manual"]),
  // Statistical analysis
  statisticalSignificance: decimal("statisticalSignificance", { precision: 5, scale: 4 }),
  confidenceLevel: decimal("confidenceLevel", { precision: 5, scale: 4 }),
  uplift: decimal("uplift", { precision: 10, scale: 4 }), // percentage improvement
  // Test status
  status: mysqlEnum("status", ["running", "paused", "completed", "inconclusive"]).default("running"),
  // Timestamps
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AbTestResult = typeof abTestResults.$inferSelect;
export type InsertAbTestResult = typeof abTestResults.$inferInsert;


/**
 * Schedule Goals - goals and targets for content refresh schedules
 */
export const scheduleGoals = mysqlTable("scheduleGoals", {
  id: int("id").autoincrement().primaryKey(),
  scheduleId: int("scheduleId").notNull(),
  userId: int("userId").notNull(),
  // Goal type
  goalType: mysqlEnum("goalType", [
    "improve_ctr",
    "increase_conversions",
    "boost_engagement",
    "reduce_bounce",
    "increase_revenue",
    "grow_audience",
    "improve_quality_score"
  ]).notNull(),
  // Target metrics
  targetMetric: varchar("targetMetric", { length: 64 }).notNull(), // e.g., "ctr", "conversion_rate", "engagement_rate"
  targetValue: decimal("targetValue", { precision: 10, scale: 4 }).notNull(), // e.g., 5.5 for 5.5%
  currentValue: decimal("currentValue", { precision: 10, scale: 4 }),
  baselineValue: decimal("baselineValue", { precision: 10, scale: 4 }), // starting value when goal was set
  // Progress tracking
  progressPercentage: decimal("progressPercentage", { precision: 5, scale: 2 }).default("0"),
  status: mysqlEnum("status", ["on_track", "behind", "achieved", "failed"]).default("on_track"),
  // AI suggestions
  lastSuggestion: text("lastSuggestion"),
  suggestionGeneratedAt: timestamp("suggestionGeneratedAt"),
  // Timestamps
  deadline: timestamp("deadline"),
  achievedAt: timestamp("achievedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduleGoal = typeof scheduleGoals.$inferSelect;
export type InsertScheduleGoal = typeof scheduleGoals.$inferInsert;

/**
 * Template Comments - discussion threads on shared templates
 */
export const templateComments = mysqlTable("templateComments", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(), // savedTemplates.id
  userId: int("userId").notNull(),
  // Comment content
  content: text("content").notNull(),
  // Threading support
  parentId: int("parentId"), // null for top-level comments, references templateComments.id for replies
  // Mentions
  mentionedUserIds: json("mentionedUserIds").$type<number[]>(),
  // Reactions/likes
  likeCount: int("likeCount").default(0),
  // Status
  isEdited: boolean("isEdited").default(false),
  isDeleted: boolean("isDeleted").default(false),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TemplateComment = typeof templateComments.$inferSelect;
export type InsertTemplateComment = typeof templateComments.$inferInsert;

/**
 * Comment Likes - track which users liked which comments
 */
export const commentLikes = mysqlTable("commentLikes", {
  id: int("id").autoincrement().primaryKey(),
  commentId: int("commentId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommentLike = typeof commentLikes.$inferSelect;
export type InsertCommentLike = typeof commentLikes.$inferInsert;

/**
 * Competitors - track competitor companies/brands
 */
export const competitors = mysqlTable("competitors", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Basic info
  name: varchar("name", { length: 255 }).notNull(),
  website: varchar("website", { length: 512 }),
  logoUrl: text("logoUrl"),
  // Classification
  industry: varchar("industry", { length: 128 }),
  category: varchar("category", { length: 128 }),
  competitorType: mysqlEnum("competitorType", ["direct", "indirect", "aspirational"]).default("direct"),
  // Description
  description: text("description"),
  tagline: text("tagline"),
  // Social presence
  youtubeChannelId: varchar("youtubeChannelId", { length: 64 }),
  youtubeChannelUrl: text("youtubeChannelUrl"),
  twitterHandle: varchar("twitterHandle", { length: 64 }),
  linkedinUrl: text("linkedinUrl"),
  instagramHandle: varchar("instagramHandle", { length: 64 }),
  // Business info
  foundedYear: int("foundedYear"),
  employeeCount: varchar("employeeCount", { length: 32 }), // e.g., "50-100", "100-500"
  fundingStage: varchar("fundingStage", { length: 64 }), // e.g., "Series A", "Public"
  estimatedRevenue: varchar("estimatedRevenue", { length: 64 }), // e.g., "$1M-$10M"
  // Analysis
  strengths: json("strengths").$type<string[]>(),
  weaknesses: json("weaknesses").$type<string[]>(),
  opportunities: json("opportunities").$type<string[]>(),
  threats: json("threats").$type<string[]>(),
  // Notes
  notes: text("notes"),
  // Status
  isActive: boolean("isActive").default(true),
  lastAnalyzedAt: timestamp("lastAnalyzedAt"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Competitor = typeof competitors.$inferSelect;
export type InsertCompetitor = typeof competitors.$inferInsert;

/**
 * Competitor Products - products/services offered by competitors
 */
export const competitorProducts = mysqlTable("competitorProducts", {
  id: int("id").autoincrement().primaryKey(),
  competitorId: int("competitorId").notNull(),
  userId: int("userId").notNull(),
  // Product info
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  productUrl: text("productUrl"),
  imageUrl: text("imageUrl"),
  // Pricing
  priceType: mysqlEnum("priceType", ["one_time", "subscription", "freemium", "custom", "free"]).default("one_time"),
  priceMin: decimal("priceMin", { precision: 10, scale: 2 }),
  priceMax: decimal("priceMax", { precision: 10, scale: 2 }),
  priceCurrency: varchar("priceCurrency", { length: 3 }).default("USD"),
  pricingNotes: text("pricingNotes"),
  // Features
  features: json("features").$type<string[]>(),
  uniqueSellingPoints: json("uniqueSellingPoints").$type<string[]>(),
  // Positioning
  targetAudience: text("targetAudience"),
  positioning: text("positioning"),
  // Comparison
  comparisonToOurs: mysqlEnum("comparisonToOurs", ["better", "similar", "worse", "different"]),
  comparisonNotes: text("comparisonNotes"),
  // Status
  isActive: boolean("isActive").default(true),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompetitorProduct = typeof competitorProducts.$inferSelect;
export type InsertCompetitorProduct = typeof competitorProducts.$inferInsert;

/**
 * Competitor Content - track competitor's content and marketing
 */
export const competitorContent = mysqlTable("competitorContent", {
  id: int("id").autoincrement().primaryKey(),
  competitorId: int("competitorId").notNull(),
  userId: int("userId").notNull(),
  // Content info
  title: varchar("title", { length: 512 }).notNull(),
  contentType: mysqlEnum("contentType", [
    "blog_post",
    "video",
    "podcast",
    "social_post",
    "ad",
    "landing_page",
    "email",
    "webinar",
    "case_study",
    "whitepaper",
    "other"
  ]).notNull(),
  url: text("url"),
  thumbnailUrl: text("thumbnailUrl"),
  // Content details
  description: text("description"),
  publishedAt: timestamp("publishedAt"),
  // Engagement metrics (if available)
  views: int("views"),
  likes: int("likes"),
  comments: int("comments"),
  shares: int("shares"),
  // Analysis
  keyTopics: json("keyTopics").$type<string[]>(),
  targetKeywords: json("targetKeywords").$type<string[]>(),
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]),
  qualityScore: int("qualityScore"), // 1-10
  // AI Analysis
  aiAnalysis: text("aiAnalysis"),
  contentGaps: json("contentGaps").$type<string[]>(), // topics they cover that we don't
  // Notes
  notes: text("notes"),
  // Timestamps
  analyzedAt: timestamp("analyzedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompetitorContent = typeof competitorContent.$inferSelect;
export type InsertCompetitorContent = typeof competitorContent.$inferInsert;

/**
 * Competitor Comparisons - side-by-side comparison snapshots
 */
export const competitorComparisons = mysqlTable("competitorComparisons", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Comparison info
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // Competitors being compared
  competitorIds: json("competitorIds").$type<number[]>().notNull(),
  // Comparison dimensions
  dimensions: json("dimensions").$type<{
    name: string;
    weight: number;
    scores: Record<number, number>; // competitorId -> score
  }[]>(),
  // Analysis results
  overallScores: json("overallScores").$type<Record<number, number>>(), // competitorId -> total score
  recommendations: text("recommendations"),
  // SWOT summary
  swotAnalysis: json("swotAnalysis").$type<{
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  }>(),
  // AI-generated insights
  aiInsights: text("aiInsights"),
  positioningRecommendation: text("positioningRecommendation"),
  // Status
  isPublic: boolean("isPublic").default(false),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompetitorComparison = typeof competitorComparisons.$inferSelect;
export type InsertCompetitorComparison = typeof competitorComparisons.$inferInsert;


/**
 * Competitor Alerts - track changes and notify users
 */
export const competitorAlerts = mysqlTable("competitorAlerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  competitorId: int("competitorId").notNull(),
  // Alert configuration
  name: varchar("name", { length: 255 }).notNull(),
  alertType: mysqlEnum("alertType", [
    "new_content",
    "review_change",
    "rating_change",
    "price_change",
    "subscriber_milestone",
    "engagement_spike",
    "sentiment_shift",
    "keyword_mention",
    "custom"
  ]).notNull(),
  // Thresholds and conditions
  threshold: int("threshold"), // e.g., 10% change, 1000 new subscribers
  thresholdType: mysqlEnum("thresholdType", ["absolute", "percentage"]),
  keywords: json("keywords").$type<string[]>(), // for keyword_mention alerts
  // Settings
  isEnabled: boolean("isEnabled").default(true),
  frequency: mysqlEnum("frequency", ["realtime", "daily", "weekly"]).default("daily"),
  // Last check info
  lastCheckedAt: timestamp("lastCheckedAt"),
  lastTriggeredAt: timestamp("lastTriggeredAt"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompetitorAlert = typeof competitorAlerts.$inferSelect;
export type InsertCompetitorAlert = typeof competitorAlerts.$inferInsert;

/**
 * Alert History - log of triggered alerts
 */
export const alertHistory = mysqlTable("alertHistory", {
  id: int("id").autoincrement().primaryKey(),
  alertId: int("alertId").notNull(),
  userId: int("userId").notNull(),
  competitorId: int("competitorId").notNull(),
  // Alert details
  alertType: varchar("alertType", { length: 64 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  message: text("message").notNull(),
  // Change details
  previousValue: text("previousValue"),
  newValue: text("newValue"),
  changePercent: decimal("changePercent", { precision: 10, scale: 2 }),
  // Related content
  relatedUrl: text("relatedUrl"),
  relatedContentId: int("relatedContentId"),
  // Status
  isRead: boolean("isRead").default(false),
  isDismissed: boolean("isDismissed").default(false),
  // Action taken
  actionTaken: text("actionTaken"),
  actionTakenAt: timestamp("actionTakenAt"),
  // Timestamps
  triggeredAt: timestamp("triggeredAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlertHistoryItem = typeof alertHistory.$inferSelect;
export type InsertAlertHistoryItem = typeof alertHistory.$inferInsert;

/**
 * Competitor YouTube Channels - track YouTube channels for comparison
 */
export const competitorYouTubeChannels = mysqlTable("competitorYouTubeChannels", {
  id: int("id").autoincrement().primaryKey(),
  competitorId: int("competitorId").notNull(),
  userId: int("userId").notNull(),
  // Channel info
  channelId: varchar("channelId", { length: 64 }).notNull(),
  channelName: varchar("channelName", { length: 255 }).notNull(),
  channelHandle: varchar("channelHandle", { length: 64 }),
  thumbnailUrl: text("thumbnailUrl"),
  bannerUrl: text("bannerUrl"),
  description: text("description"),
  // Metrics
  subscriberCount: bigint("subscriberCount", { mode: "number" }),
  videoCount: int("videoCount"),
  viewCount: bigint("viewCount", { mode: "number" }),
  // Engagement metrics
  avgViews: int("avgViews"),
  avgLikes: int("avgLikes"),
  avgComments: int("avgComments"),
  engagementRate: decimal("engagementRate", { precision: 10, scale: 4 }),
  // Content analysis
  postingFrequency: varchar("postingFrequency", { length: 64 }), // e.g., "3 per week"
  topContentTypes: json("topContentTypes").$type<string[]>(),
  topKeywords: json("topKeywords").$type<string[]>(),
  contentThemes: json("contentThemes").$type<{
    theme: string;
    percentage: number;
  }[]>(),
  // Audience analysis
  audienceSentiment: mysqlEnum("audienceSentiment", ["very_positive", "positive", "neutral", "negative", "very_negative"]),
  sentimentBreakdown: json("sentimentBreakdown").$type<{
    positive: number;
    neutral: number;
    negative: number;
  }>(),
  topAudienceComplaints: json("topAudienceComplaints").$type<string[]>(),
  topAudiencePraises: json("topAudiencePraises").$type<string[]>(),
  // Historical data
  historicalMetrics: json("historicalMetrics").$type<{
    date: string;
    subscribers: number;
    views: number;
    videos: number;
  }[]>(),
  // Last analysis
  lastAnalyzedAt: timestamp("lastAnalyzedAt"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompetitorYouTubeChannel = typeof competitorYouTubeChannels.$inferSelect;
export type InsertCompetitorYouTubeChannel = typeof competitorYouTubeChannels.$inferInsert;

/**
 * YouTube Channel Comparisons - side-by-side channel analysis
 */
export const youtubeChannelComparisons = mysqlTable("youtubeChannelComparisons", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Comparison info
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // Channels being compared
  channelIds: json("channelIds").$type<number[]>().notNull(), // competitorYouTubeChannels IDs
  // Comparison results
  metricsComparison: json("metricsComparison").$type<{
    channelId: number;
    channelName: string;
    subscribers: number;
    videos: number;
    totalViews: number;
    avgViews: number;
    avgLikes: number;
    avgComments: number;
    engagementRate: number;
    postingFrequency: string;
  }[]>(),
  // Content analysis
  contentOverlap: json("contentOverlap").$type<{
    sharedTopics: string[];
    uniqueTopics: Record<number, string[]>; // channelId -> unique topics
  }>(),
  // Audience comparison
  audienceComparison: json("audienceComparison").$type<{
    channelId: number;
    sentiment: string;
    topPraises: string[];
    topComplaints: string[];
  }[]>(),
  // Competitive insights
  winner: int("winner"), // channelId of best performer
  winnerReason: text("winnerReason"),
  recommendations: text("recommendations"),
  opportunities: json("opportunities").$type<string[]>(),
  threats: json("threats").$type<string[]>(),
  // AI analysis
  aiInsights: text("aiInsights"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type YouTubeChannelComparison = typeof youtubeChannelComparisons.$inferSelect;
export type InsertYouTubeChannelComparison = typeof youtubeChannelComparisons.$inferInsert;
