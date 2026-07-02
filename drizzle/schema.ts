import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  bigint,
  jsonb,
  boolean,
  numeric,
  serial,
  unique,
} from "drizzle-orm/pg-core";

// ============ Enums (Postgres enums are global - use unique names) ============
export const userRoleEnum = pgEnum("user_role_enum", ["user", "admin"]);
export const analysisStatusEnum = pgEnum("analysis_status_enum", [
  "pending",
  "processing",
  "completed",
  "failed",
]);
export const projectStatusEnum = pgEnum("project_status_enum", [
  "draft",
  "active",
  "archived",
]);
export const commentInsightCategoryEnum = pgEnum("comment_insight_category_enum", [
  "personal_story",
  "testimonial",
  "product_request",
  "pain_point",
  "humor",
  "question",
  "praise",
  "criticism",
  "suggestion",
  "other",
]);
export const generatedAssetTypeEnum = pgEnum("generated_asset_type_enum", [
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
  "custom",
]);
export const sentimentEnum = pgEnum("sentiment_enum", [
  "positive",
  "neutral",
  "negative",
]);
export const researchSourceTypeEnum = pgEnum("research_source_type_enum", [
  "youtube",
  "amazon",
  "reddit",
]);
export const multiSourceInsightCategoryEnum = pgEnum(
  "multi_source_insight_category_enum",
  [
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
    "other",
  ]
);
export const refreshScheduleEnum = pgEnum("refresh_schedule_enum", [
  "none",
  "daily",
  "weekly",
]);
export const savedPlaylistStatusEnum = pgEnum("saved_playlist_status_enum", [
  "active",
  "paused",
  "archived",
]);
export const playlistRunStatusEnum = pgEnum("playlist_run_status_enum", [
  "running",
  "completed",
  "failed",
]);
export const tiktokSentimentEnum = pgEnum("tiktok_sentiment_enum", [
  "positive",
  "negative",
  "neutral",
  "mixed",
]);
export const savedCommentSourceTypeEnum = pgEnum(
  "saved_comment_source_type_enum",
  ["youtube", "amazon", "reddit", "tiktok"]
);
export const nlpSourceTypeEnum = pgEnum("nlp_source_type_enum", [
  "youtube",
  "amazon",
  "reddit",
  "tiktok",
  "mixed",
]);
export const contentTypeEnum = pgEnum("content_type_enum", [
  "advertorial",
  "vsl_script",
  "ugc_scenario",
  "course_outline",
  "ad_copy",
  "sales_page",
  "email_sequence",
  "product_idea",
]);
export const priorityEnum = pgEnum("priority_enum", [
  "critical",
  "high",
  "medium",
  "low",
]);
export const contentVersionStatusEnum = pgEnum("content_version_status_enum", [
  "draft",
  "active",
  "testing",
  "winner",
  "archived",
]);
export const exportDestinationEnum = pgEnum("export_destination_enum", [
  "google_docs",
  "notion",
  "clipboard",
  "markdown_file",
  "pdf",
  "word",
  "file",
  "batch_file",
  "batch_google_docs",
  "batch_notion",
]);
export const exportStatusEnum = pgEnum("export_status_enum", [
  "pending",
  "success",
  "failed",
]);
export const scheduleFrequencyEnum = pgEnum("schedule_frequency_enum", [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
]);
export const contentScheduleStatusEnum = pgEnum(
  "content_schedule_status_enum",
  ["active", "paused", "completed", "failed"]
);
export const templatePermissionEnum = pgEnum("template_permission_enum", [
  "view",
  "duplicate",
  "edit",
]);
export const templateShareTypeEnum = pgEnum("template_share_type_enum", [
  "direct",
  "link",
  "public",
]);
export const templateShareStatusEnum = pgEnum("template_share_status_enum", [
  "pending",
  "accepted",
  "declined",
  "revoked",
]);
export const abPrimaryMetricEnum = pgEnum("ab_primary_metric_enum", [
  "ctr",
  "conversion_rate",
  "engagement",
  "revenue",
]);
export const winnerDeclaredByEnum = pgEnum("winner_declared_by_enum", [
  "auto",
  "manual",
]);
export const abTestStatusEnum = pgEnum("ab_test_status_enum", [
  "running",
  "paused",
  "completed",
  "inconclusive",
]);
export const scheduleGoalTypeEnum = pgEnum("schedule_goal_type_enum", [
  "improve_ctr",
  "increase_conversions",
  "boost_engagement",
  "reduce_bounce",
  "increase_revenue",
  "grow_audience",
  "improve_quality_score",
]);
export const scheduleGoalStatusEnum = pgEnum("schedule_goal_status_enum", [
  "on_track",
  "behind",
  "achieved",
  "failed",
]);
export const competitorTypeEnum = pgEnum("competitor_type_enum", [
  "direct",
  "indirect",
  "aspirational",
]);
export const priceTypeEnum = pgEnum("price_type_enum", [
  "one_time",
  "subscription",
  "freemium",
  "custom",
  "free",
]);
export const comparisonEnum = pgEnum("comparison_enum", [
  "better",
  "similar",
  "worse",
  "different",
]);
export const competitorContentTypeEnum = pgEnum(
  "competitor_content_type_enum",
  [
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
    "other",
  ]
);
export const competitorAlertTypeEnum = pgEnum("competitor_alert_type_enum", [
  "new_content",
  "review_change",
  "rating_change",
  "price_change",
  "subscriber_milestone",
  "engagement_spike",
  "sentiment_shift",
  "keyword_mention",
  "custom",
]);
export const thresholdTypeEnum = pgEnum("threshold_type_enum", [
  "absolute",
  "percentage",
]);
export const competitorAlertFrequencyEnum = pgEnum(
  "competitor_alert_frequency_enum",
  ["realtime", "daily", "weekly"]
);
export const audienceSentimentEnum = pgEnum("audience_sentiment_enum", [
  "very_positive",
  "positive",
  "neutral",
  "negative",
  "very_negative",
]);
export const competitorContentCalendarContentTypeEnum = pgEnum(
  "competitor_content_calendar_content_type_enum",
  [
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
    "product_launch",
    "event",
    "other",
  ]
);
export const reportTypeEnum = pgEnum("report_type_enum", [
  "weekly_summary",
  "monthly_summary",
  "quarterly_review",
  "competitor_deep_dive",
  "market_overview",
  "custom",
]);
export const competitorReportStatusEnum = pgEnum(
  "competitor_report_status_enum",
  ["generating", "completed", "failed"]
);
export const reportScheduleStatusEnum = pgEnum("report_schedule_status_enum", [
  "active",
  "paused",
  "completed",
]);
export const reportScheduleFrequencyEnum = pgEnum(
  "report_schedule_frequency_enum",
  ["weekly", "biweekly", "monthly", "quarterly"]
);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Per-user settings (API keys, preferences) synced across browsers when signed in.
 */
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  settings: jsonb("settings").$type<Record<string, unknown>>().default({}),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

/**
 * YouTube Playlists
 */
export const playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  youtubeId: varchar("youtubeId", { length: 64 }).notNull().unique(),
  title: text("title"),
  description: text("description"),
  channelId: varchar("channelId", { length: 64 }),
  channelTitle: text("channelTitle"),
  thumbnailUrl: text("thumbnailUrl"),
  videoCount: integer("videoCount").default(0),
  publishedAt: timestamp("publishedAt"),
  rawData: jsonb("rawData"),
  userId: integer("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Playlist = typeof playlists.$inferSelect;
export type InsertPlaylist = typeof playlists.$inferInsert;

/**
 * YouTube Videos
 */
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  youtubeId: varchar("youtubeId", { length: 64 }).notNull().unique(),
  playlistId: integer("playlistId"),
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
  tags: jsonb("tags"),
  rawData: jsonb("rawData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

/**
 * YouTube Comments
 */
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  youtubeId: varchar("youtubeId", { length: 64 }).notNull().unique(),
  videoId: integer("videoId"),
  parentCommentId: integer("parentCommentId"),
  authorChannelId: varchar("authorChannelId", { length: 64 }),
  authorDisplayName: text("authorDisplayName"),
  authorProfileImageUrl: text("authorProfileImageUrl"),
  textDisplay: text("textDisplay"),
  textOriginal: text("textOriginal"),
  likeCount: integer("likeCount").default(0),
  replyCount: integer("replyCount").default(0),
  publishedAt: timestamp("publishedAt"),
  updatedAt: timestamp("updatedAt"),
  rawData: jsonb("rawData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

/**
 * Analysis Sessions - tracks user analysis history
 */
export const analysisSessions = pgTable("analysisSessions", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  playlistId: integer("playlistId"),
  name: varchar("name", { length: 255 }),
  inputUrls: text("inputUrls"),
  status: analysisStatusEnum("status").default("pending").notNull(),
  videosFetched: integer("videosFetched").default(0),
  commentsFetched: integer("commentsFetched").default(0),
  totalViews: bigint("totalViews", { mode: "number" }).default(0),
  totalLikes: bigint("totalLikes", { mode: "number" }).default(0),
  videosData: jsonb("videosData"),
  commentsData: jsonb("commentsData"),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type AnalysisSession = typeof analysisSessions.$inferSelect;
export type InsertAnalysisSession = typeof analysisSessions.$inferInsert;

/**
 * Folders - organize projects
 */
export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3B82F6"),
  parentFolderId: integer("parentFolderId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = typeof folders.$inferInsert;

/**
 * Tags - for organizing and filtering
 */
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 7 }).default("#6366F1"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

/**
 * Projects - main workspace for comment intelligence
 */
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  folderId: integer("folderId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  analysisSessionId: integer("analysisSessionId"),
  // Stored search queries and filters
  searchQueries: jsonb("searchQueries"),
  // Selected comments for the canvas
  selectedComments: jsonb("selectedComments"),
  // AI-generated insights
  audienceInsights: jsonb("audienceInsights"),
  psychographicProfile: jsonb("psychographicProfile"),
  // Canvas state (generated assets)
  canvasState: jsonb("canvasState"),
  // Generated marketing assets
  generatedAssets: jsonb("generatedAssets"),
  status: projectStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Project Tags - many-to-many relationship
 */
export const projectTags = pgTable("projectTags", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  tagId: integer("tagId").notNull(),
});

export type ProjectTag = typeof projectTags.$inferSelect;
export type InsertProjectTag = typeof projectTags.$inferInsert;

/**
 * Comment Insights - AI-analyzed comments with categories
 */
export const commentInsights = pgTable("commentInsights", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  commentId: varchar("commentId", { length: 64 }).notNull(),
  videoId: varchar("videoId", { length: 64 }),
  videoTitle: text("videoTitle"),
  authorName: text("authorName"),
  commentText: text("commentText"),
  likeCount: integer("likeCount").default(0),
  replyCount: integer("replyCount").default(0),
  // AI-detected categories
  category: commentInsightCategoryEnum("category").default("other").notNull(),
  // Sentiment score (-1 to 1)
  sentimentScore: integer("sentimentScore").default(0),
  // Marketing potential score (0-100)
  marketingPotential: integer("marketingPotential").default(0),
  // AI-extracted insights
  extractedInsights: jsonb("extractedInsights"),
  // Suggested use cases
  suggestedUses: jsonb("suggestedUses"),
  isSelected: integer("isSelected").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommentInsight = typeof commentInsights.$inferSelect;
export type InsertCommentInsight = typeof commentInsights.$inferInsert;

/**
 * Generated Assets - marketing content created from insights
 */
export const generatedAssets = pgTable("generatedAssets", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  type: generatedAssetTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  // Source comments used to generate this asset
  sourceCommentIds: jsonb("sourceCommentIds"),
  // The prompt used to generate
  generationPrompt: text("generationPrompt"),
  // Metadata about the generation
  metadata: jsonb("metadata"),
  isFavorite: integer("isFavorite").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type GeneratedAsset = typeof generatedAssets.$inferSelect;
export type InsertGeneratedAsset = typeof generatedAssets.$inferInsert;

/**
 * Amazon Products - store product information
 */
export const amazonProducts = pgTable(
  "amazonProducts",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId"),
    asin: varchar("asin", { length: 20 }).notNull(),
    title: text("title"),
  description: text("description"),
  brand: varchar("brand", { length: 255 }),
  price: varchar("price", { length: 50 }),
  rating: varchar("rating", { length: 10 }),
  reviewCount: integer("reviewCount").default(0),
  imageUrl: text("imageUrl"),
  productUrl: text("productUrl"),
  category: varchar("category", { length: 255 }),
  features: jsonb("features"),
  rawData: jsonb("rawData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  },
  (t) => [unique("amazon_products_asin_user").on(t.asin, t.userId)]
);

export type AmazonProduct = typeof amazonProducts.$inferSelect;
export type InsertAmazonProduct = typeof amazonProducts.$inferInsert;

/**
 * Amazon Reviews - store product reviews
 */
export const amazonReviews = pgTable("amazonReviews", {
  id: serial("id").primaryKey(),
  productId: integer("productId").notNull(),
  reviewId: varchar("reviewId", { length: 64 }),
  author: varchar("author", { length: 255 }),
  rating: integer("rating"),
  title: text("title"),
  body: text("body"),
  helpfulVotes: integer("helpfulVotes").default(0),
  verified: integer("verified").default(0),
  reviewDate: timestamp("reviewDate"),
  // AI-analyzed fields
  sentiment: sentimentEnum("sentiment").default("neutral"),
  themes: jsonb("themes"),
  painPoints: jsonb("painPoints"),
  praises: jsonb("praises"),
  rawData: jsonb("rawData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [unique("amazon_reviews_product_review").on(t.productId, t.reviewId)]);

export type AmazonReview = typeof amazonReviews.$inferSelect;
export type InsertAmazonReview = typeof amazonReviews.$inferInsert;

/**
 * Reddit Posts - store subreddit posts
 */
export const redditPosts = pgTable("redditPosts", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  postId: varchar("postId", { length: 20 }).notNull(),
  subreddit: varchar("subreddit", { length: 100 }).notNull(),
  title: text("title"),
  body: text("body"),
  author: varchar("author", { length: 100 }),
  score: integer("score").default(0),
  upvoteRatio: varchar("upvoteRatio", { length: 10 }),
  commentCount: integer("commentCount").default(0),
  postUrl: text("postUrl"),
  isNsfw: integer("isNsfw").default(0),
  flair: varchar("flair", { length: 100 }),
  mediaUrl: text("mediaUrl"),
  postedAt: timestamp("postedAt"),
  rawData: jsonb("rawData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}, (t) => [unique("reddit_posts_user_post").on(t.userId, t.postId)]);

export type RedditPost = typeof redditPosts.$inferSelect;
export type InsertRedditPost = typeof redditPosts.$inferInsert;

/**
 * Reddit Comments - store post comments
 */
export const redditComments = pgTable("redditComments", {
  id: serial("id").primaryKey(),
  postId: integer("postId").notNull(),
  commentId: varchar("commentId", { length: 20 }).notNull(),
  parentCommentId: varchar("parentCommentId", { length: 20 }),
  author: varchar("author", { length: 100 }),
  body: text("body"),
  score: integer("score").default(0),
  isOp: integer("isOp").default(0),
  depth: integer("depth").default(0),
  postedAt: timestamp("postedAt"),
  // AI-analyzed fields
  sentiment: sentimentEnum("sentiment").default("neutral"),
  themes: jsonb("themes"),
  rawData: jsonb("rawData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [unique("reddit_comments_post_comment").on(t.postId, t.commentId)]);

export type RedditComment = typeof redditComments.$inferSelect;
export type InsertRedditComment = typeof redditComments.$inferInsert;

/**
 * Research Sessions - unified tracking for all research types
 */
export const researchSessions = pgTable("researchSessions", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  projectId: integer("projectId"),
  sourceType: researchSourceTypeEnum("sourceType").notNull(),
  name: varchar("name", { length: 255 }),
  searchQuery: text("searchQuery"),
  status: analysisStatusEnum("status").default("pending").notNull(),
  itemsFetched: integer("itemsFetched").default(0),
  insightsGenerated: integer("insightsGenerated").default(0),
  summary: jsonb("summary"),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type ResearchSession = typeof researchSessions.$inferSelect;
export type InsertResearchSession = typeof researchSessions.$inferInsert;

/**
 * Multi-Source Insights - unified insights from all sources
 */
export const multiSourceInsights = pgTable("multiSourceInsights", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  sourceType: researchSourceTypeEnum("sourceType").notNull(),
  sourceId: varchar("sourceId", { length: 64 }).notNull(),
  sourceTitle: text("sourceTitle"),
  authorName: text("authorName"),
  contentText: text("contentText"),
  engagementScore: integer("engagementScore").default(0),
  // AI-detected categories (unified across sources)
  category: multiSourceInsightCategoryEnum("category").default("other").notNull(),
  sentiment: sentimentEnum("sentiment").default("neutral"),
  marketingPotential: integer("marketingPotential").default(0),
  extractedInsights: jsonb("extractedInsights"),
  suggestedUses: jsonb("suggestedUses"),
  isSelected: integer("isSelected").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MultiSourceInsight = typeof multiSourceInsights.$inferSelect;
export type InsertMultiSourceInsight = typeof multiSourceInsights.$inferInsert;

/**
 * Saved Playlists - user's saved playlists for ongoing tracking
 */
export const savedPlaylists = pgTable("savedPlaylists", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  youtubePlaylistId: varchar("youtubePlaylistId", { length: 64 }).notNull(),
  title: text("title"),
  description: text("description"),
  channelTitle: text("channelTitle"),
  thumbnailUrl: text("thumbnailUrl"),
  videoCount: integer("videoCount").default(0),
  // Tracking timestamps
  lastRunAt: timestamp("lastRunAt"),
  lastVideoCount: integer("lastVideoCount").default(0),
  lastCommentCount: integer("lastCommentCount").default(0),
  // Scheduled refresh settings
  refreshSchedule: refreshScheduleEnum("refreshSchedule")
    .default("none")
    .notNull(),
  nextRefreshAt: timestamp("nextRefreshAt"),
  refreshHour: integer("refreshHour").default(9), // Hour of day to run refresh (0-23)
  refreshDayOfWeek: integer("refreshDayOfWeek").default(1), // Day of week for weekly (0=Sun, 1=Mon, etc.)
  // Legacy auto-refresh settings (kept for compatibility)
  autoRefresh: integer("autoRefresh").default(0),
  refreshInterval: integer("refreshInterval").default(24), // hours
  // Status
  status: savedPlaylistStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type SavedPlaylist = typeof savedPlaylists.$inferSelect;
export type InsertSavedPlaylist = typeof savedPlaylists.$inferInsert;

/**
 * Playlist Runs - history of analysis runs for each saved playlist
 */
export const playlistRuns = pgTable("playlistRuns", {
  id: serial("id").primaryKey(),
  savedPlaylistId: integer("savedPlaylistId").notNull(),
  // Run statistics
  videosAnalyzed: integer("videosAnalyzed").default(0),
  commentsCollected: integer("commentsCollected").default(0),
  newVideos: integer("newVideos").default(0),
  newComments: integer("newComments").default(0),
  // Run metadata
  status: playlistRunStatusEnum("status").default("running").notNull(),
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
export const playlistVideos = pgTable("playlistVideos", {
  id: serial("id").primaryKey(),
  savedPlaylistId: integer("savedPlaylistId").notNull(),
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
export const tiktokCreators = pgTable("tiktokCreators", {
  id: serial("id").primaryKey(),
  uniqueId: varchar("uniqueId", { length: 128 }).notNull().unique(), // @username
  nickname: varchar("nickname", { length: 256 }),
  avatarUrl: text("avatarUrl"),
  signature: text("signature"), // bio
  verified: boolean("verified").default(false),
  followerCount: bigint("followerCount", { mode: "number" }).default(0),
  followingCount: bigint("followingCount", { mode: "number" }).default(0),
  heartCount: bigint("heartCount", { mode: "number" }).default(0), // total likes
  videoCount: integer("videoCount").default(0),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type TikTokCreator = typeof tiktokCreators.$inferSelect;
export type InsertTikTokCreator = typeof tiktokCreators.$inferInsert;

/**
 * TikTok Videos - stores TikTok video information
 */
export const tiktokVideos = pgTable("tiktokVideos", {
  id: serial("id").primaryKey(),
  videoId: varchar("videoId", { length: 64 }).notNull().unique(),
  creatorId: integer("creatorId"),
  creatorUniqueId: varchar("creatorUniqueId", { length: 128 }),
  // Video content
  description: text("description"),
  coverUrl: text("coverUrl"),
  videoUrl: text("videoUrl"),
  duration: integer("duration"), // seconds
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
  hashtags: jsonb("hashtags").$type<string[]>(),
  // Timestamps
  createTime: timestamp("createTime"),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
});

export type TikTokVideo = typeof tiktokVideos.$inferSelect;
export type InsertTikTokVideo = typeof tiktokVideos.$inferInsert;

/**
 * TikTok Comments - stores TikTok video comments
 */
export const tiktokComments = pgTable("tiktokComments", {
  id: serial("id").primaryKey(),
  commentId: varchar("commentId", { length: 64 }).notNull(),
  videoId: varchar("videoId", { length: 64 }).notNull(),
  // Author info
  authorUniqueId: varchar("authorUniqueId", { length: 128 }),
  authorNickname: varchar("authorNickname", { length: 256 }),
  authorAvatarUrl: text("authorAvatarUrl"),
  // Comment content
  text: text("text"),
  diggCount: bigint("diggCount", { mode: "number" }).default(0), // likes
  replyCount: integer("replyCount").default(0),
  // Sentiment analysis
  sentiment: tiktokSentimentEnum("sentiment"),
  sentimentScore: numeric("sentimentScore", { precision: 5, scale: 4 }),
  // Timestamps
  createTime: timestamp("createTime"),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
}, (t) => [unique("tiktok_comments_video_comment").on(t.videoId, t.commentId)]);

export type TikTokComment = typeof tiktokComments.$inferSelect;
export type InsertTikTokComment = typeof tiktokComments.$inferInsert;

/**
 * Saved Comments - user's highlighted/bookmarked comments from any source
 */
export const savedComments = pgTable("savedComments", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  // Source reference
  sourceType: savedCommentSourceTypeEnum("sourceType").notNull(),
  sourceId: varchar("sourceId", { length: 128 }).notNull(), // video/product/post ID
  commentId: varchar("commentId", { length: 128 }).notNull(),
  // Comment content snapshot
  authorName: varchar("authorName", { length: 256 }),
  text: text("text").notNull(),
  // User annotations
  highlighted: boolean("highlighted").default(false),
  notes: text("notes"),
  tags: jsonb("tags").$type<string[]>(),
  // Collection/folder
  collectionName: varchar("collectionName", { length: 128 }),
  // Sort order within collection
  sortOrder: integer("sortOrder").default(0),
  // Timestamps
  savedAt: timestamp("savedAt").defaultNow().notNull(),
});

export type SavedComment = typeof savedComments.$inferSelect;
export type InsertSavedComment = typeof savedComments.$inferInsert;

/**
 * Comment Collections - user-created folders for organizing saved comments
 */
export const commentCollections = pgTable("commentCollections", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#6366f1"), // hex color
  icon: varchar("icon", { length: 32 }).default("folder"), // lucide icon name
  // Stats (denormalized for performance)
  commentCount: integer("commentCount").default(0),
  // Sharing
  isPublic: boolean("isPublic").default(false),
  shareToken: varchar("shareToken", { length: 64 }),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type CommentCollection = typeof commentCollections.$inferSelect;
export type InsertCommentCollection = typeof commentCollections.$inferInsert;

/**
 * NLP Analysis Results - cached AI analysis for comments
 */
export const nlpAnalysisResults = pgTable("nlpAnalysisResults", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  // Analysis scope
  sourceType: nlpSourceTypeEnum("sourceType").notNull(),
  sourceId: varchar("sourceId", { length: 128 }), // specific video/product/post or null for mixed
  // Analysis results
  topics: jsonb("topics").$type<
    { topic: string; score: number; keywords: string[] }[]
  >(),
  sentimentBreakdown: jsonb("sentimentBreakdown").$type<{
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
  }>(),
  keyThemes: jsonb("keyThemes").$type<string[]>(),
  painPoints: jsonb("painPoints").$type<
    { text: string; frequency: number }[]
  >(),
  suggestions: jsonb("suggestions").$type<
    { text: string; frequency: number }[]
  >(),
  questions: jsonb("questions").$type<string[]>(),
  namedEntities: jsonb("namedEntities").$type<
    { entity: string; type: string; count: number }[]
  >(),
  summary: text("summary"),
  // Metadata
  commentCount: integer("commentCount").default(0),
  analyzedAt: timestamp("analyzedAt").defaultNow().notNull(),
});

export type NlpAnalysisResult = typeof nlpAnalysisResults.$inferSelect;
export type InsertNlpAnalysisResult = typeof nlpAnalysisResults.$inferInsert;

/**
 * Content Templates - stores generated marketing content
 */
export const contentTemplates = pgTable("contentTemplates", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  // Content type
  contentType: contentTypeEnum("contentType").notNull(),
  // Content details
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  // Source data used
  sourceComments: jsonb("sourceComments").$type<
    {
      id: string;
      text: string;
      source: string;
      category?: string;
    }[]
  >(),
  sourceInsights: jsonb("sourceInsights").$type<{
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
  wordCount: integer("wordCount").default(0),
  version: integer("version").default(1),
  parentTemplateId: integer("parentTemplateId"), // for revisions
  isFavorite: boolean("isFavorite").default(false),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type ContentTemplate = typeof contentTemplates.$inferSelect;
export type InsertContentTemplate = typeof contentTemplates.$inferInsert;

/**
 * AI Prompts Knowledge Base - expert prompts for content generation
 */
export const aiPromptsKnowledgeBase = pgTable("aiPromptsKnowledgeBase", {
  id: serial("id").primaryKey(),
  // Prompt categorization
  contentType: contentTypeEnum("contentType").notNull(),
  category: varchar("category", { length: 64 }).notNull(), // e.g., "hook", "story", "cta", "objection_handling"
  // Prompt content
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  promptTemplate: text("promptTemplate").notNull(),
  // Variables that can be injected
  variables: jsonb("variables").$type<
    {
      name: string;
      description: string;
      required: boolean;
      defaultValue?: string;
    }[]
  >(),
  // Best practices and tips
  bestPractices: jsonb("bestPractices").$type<string[]>(),
  examples: jsonb("examples").$type<
    {
      input: string;
      output: string;
    }[]
  >(),
  // Performance metrics
  useCount: integer("useCount").default(0),
  avgRating: numeric("avgRating", { precision: 3, scale: 2 }),
  // Metadata
  isSystem: boolean("isSystem").default(true), // system vs user-created
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type AiPromptKnowledgeBase = typeof aiPromptsKnowledgeBase.$inferSelect;
export type InsertAiPromptKnowledgeBase =
  typeof aiPromptsKnowledgeBase.$inferInsert;

/**
 * CRO Best Practices - conversion optimization guidelines
 */
export const croBestPractices = pgTable("croBestPractices", {
  id: serial("id").primaryKey(),
  // Categorization
  contentType: varchar("contentType", { length: 64 }).notNull(),
  section: varchar("section", { length: 64 }).notNull(), // e.g., "headline", "cta", "social_proof"
  // Practice details
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  // Implementation guidance
  doList: jsonb("doList").$type<string[]>(),
  dontList: jsonb("dontList").$type<string[]>(),
  examples: jsonb("examples").$type<
    {
      good: string;
      bad: string;
      explanation: string;
    }[]
  >(),
  // Metrics and benchmarks
  benchmarks: jsonb("benchmarks").$type<
    {
      metric: string;
      target: string;
      industry: string;
    }[]
  >(),
  // Priority and impact
  priority: priorityEnum("priority").default("medium"),
  impactScore: integer("impactScore").default(50), // 0-100
  // Metadata
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CroBestPractice = typeof croBestPractices.$inferSelect;
export type InsertCroBestPractice = typeof croBestPractices.$inferInsert;

/**
 * Copywriting Frameworks - structured frameworks for content creation
 */
export const copywritingFrameworks = pgTable("copywritingFrameworks", {
  id: serial("id").primaryKey(),
  // Framework identification
  acronym: varchar("acronym", { length: 20 }).notNull().unique(), // AIDA, PAS, BAB, etc.
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description").notNull(),
  // Framework structure
  steps: jsonb("steps").$type<
    {
      letter: string;
      name: string;
      description: string;
      promptGuidance: string;
      examples: string[];
    }[]
  >(),
  // Best use cases
  bestFor: jsonb("bestFor").$type<string[]>(), // ["sales_pages", "email", "ads"]
  // Template
  templateStructure: text("templateStructure"),
  // Metadata
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CopywritingFramework = typeof copywritingFrameworks.$inferSelect;
export type InsertCopywritingFramework =
  typeof copywritingFrameworks.$inferInsert;

/**
 * Saved Templates - reusable content templates with variable placeholders
 */
export const savedTemplates = pgTable("savedTemplates", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  // Template identification
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // Content type this template is for
  contentType: contentTypeEnum("contentType").notNull(),
  // The template content with {{variable}} placeholders
  templateContent: text("templateContent").notNull(),
  // Variables that need to be filled in
  variables: jsonb("variables").$type<
    {
      name: string;
      description: string;
      defaultValue?: string;
      required: boolean;
    }[]
  >(),
  // Template settings
  frameworkUsed: varchar("frameworkUsed", { length: 64 }),
  tone: varchar("tone", { length: 64 }),
  // Categorization
  category: varchar("category", { length: 64 }),
  tags: jsonb("tags").$type<string[]>(),
  // Usage tracking
  useCount: integer("useCount").default(0),
  lastUsedAt: timestamp("lastUsedAt"),
  // Sharing
  isPublic: boolean("isPublic").default(false),
  // Metadata
  isFavorite: boolean("isFavorite").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type SavedTemplate = typeof savedTemplates.$inferSelect;
export type InsertSavedTemplate = typeof savedTemplates.$inferInsert;

/**
 * Content Versions - track iterations and A/B test results
 */
export const contentVersions = pgTable("contentVersions", {
  id: serial("id").primaryKey(),
  // Link to the original content template
  contentTemplateId: integer("contentTemplateId").notNull(),
  userId: integer("userId").notNull(),
  // Version info
  versionNumber: integer("versionNumber").notNull().default(1),
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
  metrics: jsonb("metrics").$type<{
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
  status: contentVersionStatusEnum("status").default("draft"),
  // Annotations and notes
  annotations: jsonb("annotations").$type<
    {
      timestamp: string;
      note: string;
      author?: string;
    }[]
  >(),
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type ContentVersion = typeof contentVersions.$inferSelect;
export type InsertContentVersion = typeof contentVersions.$inferInsert;

/**
 * Export History - track exports to external tools
 */
export const exportHistory = pgTable("exportHistory", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  // What was exported
  contentTemplateId: integer("contentTemplateId"),
  contentVersionId: integer("contentVersionId"),
  // Export destination
  destination: exportDestinationEnum("destination").notNull(),
  // Export details
  exportFormat: varchar("exportFormat", { length: 32 }), // "plain_text", "markdown", "rich_text", "html"
  // External references
  externalUrl: text("externalUrl"), // URL to the created doc
  externalId: varchar("externalId", { length: 255 }), // ID in external system
  // Export metadata
  title: varchar("title", { length: 255 }),
  contentPreview: text("contentPreview"), // first 500 chars
  wordCount: integer("wordCount"),
  // Status
  status: exportStatusEnum("status").default("pending"),
  errorMessage: text("errorMessage"),
  // Timestamps
  exportedAt: timestamp("exportedAt").defaultNow().notNull(),
});

export type ExportHistory = typeof exportHistory.$inferSelect;
export type InsertExportHistory = typeof exportHistory.$inferInsert;

/**
 * Content Schedules - automatic content refresh scheduling
 */
export const contentSchedules = pgTable("contentSchedules", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  // What to refresh
  savedTemplateId: integer("savedTemplateId").notNull(),
  contentTemplateId: integer("contentTemplateId"), // optional link to specific generated content
  // Schedule configuration
  frequency: scheduleFrequencyEnum("frequency").notNull(),
  dayOfWeek: integer("dayOfWeek"), // 0-6 for weekly schedules
  dayOfMonth: integer("dayOfMonth"), // 1-31 for monthly schedules
  timeOfDay: varchar("timeOfDay", { length: 8 }), // HH:MM format
  timezone: varchar("timezone", { length: 64 }).default("UTC"),
  // Variables to use for regeneration
  variables: jsonb("variables").$type<Record<string, string>>(),
  // Status
  status: contentScheduleStatusEnum("status").default("active"),
  // Tracking
  lastRunAt: timestamp("lastRunAt"),
  nextRunAt: timestamp("nextRunAt"),
  runCount: integer("runCount").default(0),
  // Notification settings
  notifyOnComplete: boolean("notifyOnComplete").default(true),
  notifyEmail: varchar("notifyEmail", { length: 320 }),
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type ContentSchedule = typeof contentSchedules.$inferSelect;
export type InsertContentSchedule = typeof contentSchedules.$inferInsert;

/**
 * Template Shares - sharing templates with other users
 */
export const templateShares = pgTable("templateShares", {
  id: serial("id").primaryKey(),
  // The template being shared
  savedTemplateId: integer("savedTemplateId").notNull(),
  // Who owns the template
  ownerUserId: integer("ownerUserId").notNull(),
  // Who it's shared with (null for public shares)
  sharedWithUserId: integer("sharedWithUserId"),
  sharedWithEmail: varchar("sharedWithEmail", { length: 320 }),
  // Permission level
  permission: templatePermissionEnum("permission").default("view"),
  // Share type
  shareType: templateShareTypeEnum("shareType").default("direct"),
  // Share link for link-based sharing
  shareToken: varchar("shareToken", { length: 64 }),
  // Status
  status: templateShareStatusEnum("status").default("pending"),
  // Usage tracking
  viewCount: integer("viewCount").default(0),
  duplicateCount: integer("duplicateCount").default(0),
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
export const abTestResults = pgTable("abTestResults", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  // The A/B test identification
  testName: varchar("testName", { length: 255 }).notNull(),
  contentTemplateId: integer("contentTemplateId").notNull(),
  // Versions being tested
  versionAId: integer("versionAId").notNull(),
  versionBId: integer("versionBId").notNull(),
  // Additional variants (optional)
  additionalVersionIds: jsonb("additionalVersionIds").$type<number[]>(),
  // Test configuration
  primaryMetric: abPrimaryMetricEnum("primaryMetric").default("ctr"),
  minimumSampleSize: integer("minimumSampleSize").default(100),
  confidenceThreshold: numeric("confidenceThreshold", {
    precision: 5,
    scale: 4,
  }).default("0.95"),
  // Results
  winnerVersionId: integer("winnerVersionId"),
  winnerDeclaredAt: timestamp("winnerDeclaredAt"),
  winnerDeclaredBy: winnerDeclaredByEnum("winnerDeclaredBy"),
  // Statistical analysis
  statisticalSignificance: numeric("statisticalSignificance", {
    precision: 5,
    scale: 4,
  }),
  confidenceLevel: numeric("confidenceLevel", {
    precision: 5,
    scale: 4,
  }),
  uplift: numeric("uplift", { precision: 10, scale: 4 }), // percentage improvement
  // Test status
  status: abTestStatusEnum("status").default("running"),
  // Timestamps
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type AbTestResult = typeof abTestResults.$inferSelect;
export type InsertAbTestResult = typeof abTestResults.$inferInsert;

/**
 * Schedule Goals - goals and targets for content refresh schedules
 */
export const scheduleGoals = pgTable("scheduleGoals", {
  id: serial("id").primaryKey(),
  scheduleId: integer("scheduleId").notNull(),
  userId: integer("userId").notNull(),
  // Goal type
  goalType: scheduleGoalTypeEnum("goalType").notNull(),
  // Target metrics
  targetMetric: varchar("targetMetric", { length: 64 }).notNull(), // e.g., "ctr", "conversion_rate", "engagement_rate"
  targetValue: numeric("targetValue", { precision: 10, scale: 4 }).notNull(), // e.g., 5.5 for 5.5%
  currentValue: numeric("currentValue", { precision: 10, scale: 4 }),
  baselineValue: numeric("baselineValue", { precision: 10, scale: 4 }), // starting value when goal was set
  // Progress tracking
  progressPercentage: numeric("progressPercentage", {
    precision: 5,
    scale: 2,
  }).default("0"),
  status: scheduleGoalStatusEnum("status").default("on_track"),
  // AI suggestions
  lastSuggestion: text("lastSuggestion"),
  suggestionGeneratedAt: timestamp("suggestionGeneratedAt"),
  // Timestamps
  deadline: timestamp("deadline"),
  achievedAt: timestamp("achievedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type ScheduleGoal = typeof scheduleGoals.$inferSelect;
export type InsertScheduleGoal = typeof scheduleGoals.$inferInsert;

/**
 * Template Comments - discussion threads on shared templates
 */
export const templateComments = pgTable("templateComments", {
  id: serial("id").primaryKey(),
  templateId: integer("templateId").notNull(), // savedTemplates.id
  userId: integer("userId").notNull(),
  // Comment content
  content: text("content").notNull(),
  // Threading support
  parentId: integer("parentId"), // null for top-level comments, references templateComments.id for replies
  // Mentions
  mentionedUserIds: jsonb("mentionedUserIds").$type<number[]>(),
  // Reactions/likes
  likeCount: integer("likeCount").default(0),
  // Status
  isEdited: boolean("isEdited").default(false),
  isDeleted: boolean("isDeleted").default(false),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type TemplateComment = typeof templateComments.$inferSelect;
export type InsertTemplateComment = typeof templateComments.$inferInsert;

/**
 * Comment Likes - track which users liked which comments
 */
export const commentLikes = pgTable("commentLikes", {
  id: serial("id").primaryKey(),
  commentId: integer("commentId").notNull(),
  userId: integer("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommentLike = typeof commentLikes.$inferSelect;
export type InsertCommentLike = typeof commentLikes.$inferInsert;

/**
 * Competitors - track competitor companies/brands
 */
export const competitors = pgTable("competitors", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  // Basic info
  name: varchar("name", { length: 255 }).notNull(),
  website: varchar("website", { length: 512 }),
  logoUrl: text("logoUrl"),
  // Classification
  industry: varchar("industry", { length: 128 }),
  category: varchar("category", { length: 128 }),
  competitorType: competitorTypeEnum("competitorType").default("direct"),
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
  foundedYear: integer("foundedYear"),
  employeeCount: varchar("employeeCount", { length: 32 }), // e.g., "50-100", "100-500"
  fundingStage: varchar("fundingStage", { length: 64 }), // e.g., "Series A", "Public"
  estimatedRevenue: varchar("estimatedRevenue", { length: 64 }), // e.g., "$1M-$10M"
  // Analysis
  strengths: jsonb("strengths").$type<string[]>(),
  weaknesses: jsonb("weaknesses").$type<string[]>(),
  opportunities: jsonb("opportunities").$type<string[]>(),
  threats: jsonb("threats").$type<string[]>(),
  // Notes
  notes: text("notes"),
  // Status
  isActive: boolean("isActive").default(true),
  lastAnalyzedAt: timestamp("lastAnalyzedAt"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Competitor = typeof competitors.$inferSelect;
export type InsertCompetitor = typeof competitors.$inferInsert;

/**
 * Competitor Products - products/services offered by competitors
 */
export const competitorProducts = pgTable("competitorProducts", {
  id: serial("id").primaryKey(),
  competitorId: integer("competitorId").notNull(),
  userId: integer("userId").notNull(),
  // Product info
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  productUrl: text("productUrl"),
  imageUrl: text("imageUrl"),
  // Pricing
  priceType: priceTypeEnum("priceType").default("one_time"),
  priceMin: numeric("priceMin", { precision: 10, scale: 2 }),
  priceMax: numeric("priceMax", { precision: 10, scale: 2 }),
  priceCurrency: varchar("priceCurrency", { length: 3 }).default("USD"),
  pricingNotes: text("pricingNotes"),
  // Features
  features: jsonb("features").$type<string[]>(),
  uniqueSellingPoints: jsonb("uniqueSellingPoints").$type<string[]>(),
  // Positioning
  targetAudience: text("targetAudience"),
  positioning: text("positioning"),
  // Comparison
  comparisonToOurs: comparisonEnum("comparisonToOurs"),
  comparisonNotes: text("comparisonNotes"),
  // Status
  isActive: boolean("isActive").default(true),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type CompetitorProduct = typeof competitorProducts.$inferSelect;
export type InsertCompetitorProduct = typeof competitorProducts.$inferInsert;

/**
 * Competitor Content - track competitor's content and marketing
 */
export const competitorContent = pgTable("competitorContent", {
  id: serial("id").primaryKey(),
  competitorId: integer("competitorId").notNull(),
  userId: integer("userId").notNull(),
  // Content info
  title: varchar("title", { length: 512 }).notNull(),
  contentType: competitorContentTypeEnum("contentType").notNull(),
  url: text("url"),
  thumbnailUrl: text("thumbnailUrl"),
  // Content details
  description: text("description"),
  publishedAt: timestamp("publishedAt"),
  // Engagement metrics (if available)
  views: integer("views"),
  likes: integer("likes"),
  comments: integer("comments"),
  shares: integer("shares"),
  // Analysis
  keyTopics: jsonb("keyTopics").$type<string[]>(),
  targetKeywords: jsonb("targetKeywords").$type<string[]>(),
  sentiment: sentimentEnum("sentiment"),
  qualityScore: integer("qualityScore"), // 1-10
  // AI Analysis
  aiAnalysis: text("aiAnalysis"),
  contentGaps: jsonb("contentGaps").$type<string[]>(), // topics they cover that we don't
  // Notes
  notes: text("notes"),
  // Timestamps
  analyzedAt: timestamp("analyzedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type CompetitorContent = typeof competitorContent.$inferSelect;
export type InsertCompetitorContent = typeof competitorContent.$inferInsert;

/**
 * Competitor Comparisons - side-by-side comparison snapshots
 */
export const competitorComparisons = pgTable("competitorComparisons", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  // Comparison info
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // Competitors being compared
  competitorIds: jsonb("competitorIds").$type<number[]>().notNull(),
  // Comparison dimensions
  dimensions: jsonb("dimensions").$type<
    {
      name: string;
      weight: number;
      scores: Record<number, number>; // competitorId -> score
    }[]
  >(),
  // Analysis results
  overallScores: jsonb("overallScores").$type<Record<number, number>>(), // competitorId -> total score
  recommendations: text("recommendations"),
  // SWOT summary
  swotAnalysis: jsonb("swotAnalysis").$type<{
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
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type CompetitorComparison = typeof competitorComparisons.$inferSelect;
export type InsertCompetitorComparison =
  typeof competitorComparisons.$inferInsert;

/**
 * Competitor Alerts - track changes and notify users
 */
export const competitorAlerts = pgTable("competitorAlerts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  competitorId: integer("competitorId").notNull(),
  // Alert configuration
  name: varchar("name", { length: 255 }).notNull(),
  alertType: competitorAlertTypeEnum("alertType").notNull(),
  // Thresholds and conditions
  threshold: integer("threshold"), // e.g., 10% change, 1000 new subscribers
  thresholdType: thresholdTypeEnum("thresholdType"),
  keywords: jsonb("keywords").$type<string[]>(), // for keyword_mention alerts
  // Settings
  isEnabled: boolean("isEnabled").default(true),
  frequency: competitorAlertFrequencyEnum("frequency").default("daily"),
  // Last check info
  lastCheckedAt: timestamp("lastCheckedAt"),
  lastTriggeredAt: timestamp("lastTriggeredAt"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type CompetitorAlert = typeof competitorAlerts.$inferSelect;
export type InsertCompetitorAlert = typeof competitorAlerts.$inferInsert;

/**
 * Alert History - log of triggered alerts
 */
export const alertHistory = pgTable("alertHistory", {
  id: serial("id").primaryKey(),
  alertId: integer("alertId").notNull(),
  userId: integer("userId").notNull(),
  competitorId: integer("competitorId").notNull(),
  // Alert details
  alertType: varchar("alertType", { length: 64 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  message: text("message").notNull(),
  // Change details
  previousValue: text("previousValue"),
  newValue: text("newValue"),
  changePercent: numeric("changePercent", { precision: 10, scale: 2 }),
  // Related content
  relatedUrl: text("relatedUrl"),
  relatedContentId: integer("relatedContentId"),
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
export const competitorYouTubeChannels = pgTable("competitorYouTubeChannels", {
  id: serial("id").primaryKey(),
  competitorId: integer("competitorId").notNull(),
  userId: integer("userId").notNull(),
  // Channel info
  channelId: varchar("channelId", { length: 64 }).notNull(),
  channelName: varchar("channelName", { length: 255 }).notNull(),
  channelHandle: varchar("channelHandle", { length: 64 }),
  thumbnailUrl: text("thumbnailUrl"),
  bannerUrl: text("bannerUrl"),
  description: text("description"),
  // Metrics
  subscriberCount: bigint("subscriberCount", { mode: "number" }),
  videoCount: integer("videoCount"),
  viewCount: bigint("viewCount", { mode: "number" }),
  // Engagement metrics
  avgViews: integer("avgViews"),
  avgLikes: integer("avgLikes"),
  avgComments: integer("avgComments"),
  engagementRate: numeric("engagementRate", { precision: 10, scale: 4 }),
  // Content analysis
  postingFrequency: varchar("postingFrequency", { length: 64 }), // e.g., "3 per week"
  topContentTypes: jsonb("topContentTypes").$type<string[]>(),
  topKeywords: jsonb("topKeywords").$type<string[]>(),
  contentThemes: jsonb("contentThemes").$type<
    {
      theme: string;
      percentage: number;
    }[]
  >(),
  // Audience analysis
  audienceSentiment: audienceSentimentEnum("audienceSentiment"),
  sentimentBreakdown: jsonb("sentimentBreakdown").$type<{
    positive: number;
    neutral: number;
    negative: number;
  }>(),
  topAudienceComplaints: jsonb("topAudienceComplaints").$type<string[]>(),
  topAudiencePraises: jsonb("topAudiencePraises").$type<string[]>(),
  // Historical data
  historicalMetrics: jsonb("historicalMetrics").$type<
    {
      date: string;
      subscribers: number;
      views: number;
      videos: number;
    }[]
  >(),
  // Last analysis
  lastAnalyzedAt: timestamp("lastAnalyzedAt"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type CompetitorYouTubeChannel =
  typeof competitorYouTubeChannels.$inferSelect;
export type InsertCompetitorYouTubeChannel =
  typeof competitorYouTubeChannels.$inferInsert;

/**
 * YouTube Channel Comparisons - side-by-side channel analysis
 */
export const youtubeChannelComparisons = pgTable("youtubeChannelComparisons", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  // Comparison info
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // Channels being compared
  channelIds: jsonb("channelIds").$type<number[]>().notNull(), // competitorYouTubeChannels IDs
  // Comparison results
  metricsComparison: jsonb("metricsComparison").$type<
    {
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
    }[]
  >(),
  // Content analysis
  contentOverlap: jsonb("contentOverlap").$type<{
    sharedTopics: string[];
    uniqueTopics: Record<number, string[]>; // channelId -> unique topics
  }>(),
  // Audience comparison
  audienceComparison: jsonb("audienceComparison").$type<
    {
      channelId: number;
      sentiment: string;
      topPraises: string[];
      topComplaints: string[];
    }[]
  >(),
  // Competitive insights
  winner: integer("winner"), // channelId of best performer
  winnerReason: text("winnerReason"),
  recommendations: text("recommendations"),
  opportunities: jsonb("opportunities").$type<string[]>(),
  threats: jsonb("threats").$type<string[]>(),
  // AI analysis
  aiInsights: text("aiInsights"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type YouTubeChannelComparison =
  typeof youtubeChannelComparisons.$inferSelect;
export type InsertYouTubeChannelComparison =
  typeof youtubeChannelComparisons.$inferInsert;

/**
 * Competitor Content Calendar - calendar view of competitor content
 */
export const competitorContentCalendar = pgTable("competitorContentCalendar", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  competitorId: integer("competitorId").notNull(),
  competitorContentId: integer("competitorContentId"), // link to competitorContent if exists
  // Calendar entry info
  title: varchar("title", { length: 512 }).notNull(),
  contentType: competitorContentCalendarContentTypeEnum("contentType").notNull(),
  url: text("url"),
  thumbnailUrl: text("thumbnailUrl"),
  // Date and time
  publishedAt: timestamp("publishedAt").notNull(),
  dayOfWeek: integer("dayOfWeek"), // 0-6
  hourOfDay: integer("hourOfDay"), // 0-23
  // Engagement metrics
  views: integer("views"),
  likes: integer("likes"),
  comments: integer("comments"),
  shares: integer("shares"),
  engagementRate: numeric("engagementRate", { precision: 10, scale: 4 }),
  // Content analysis
  topics: jsonb("topics").$type<string[]>(),
  sentiment: sentimentEnum("sentiment"),
  // Notes
  notes: text("notes"),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type CompetitorContentCalendarEntry =
  typeof competitorContentCalendar.$inferSelect;
export type InsertCompetitorContentCalendarEntry =
  typeof competitorContentCalendar.$inferInsert;

/**
 * Competitor Reports - generated PDF reports
 */
export const competitorReports = pgTable("competitorReports", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  // Report info
  title: varchar("title", { length: 255 }).notNull(),
  reportType: reportTypeEnum("reportType").notNull(),
  // Competitors included
  competitorIds: jsonb("competitorIds").$type<number[]>(),
  // Report content sections
  sections: jsonb("sections").$type<
    {
      id: string;
      title: string;
      type:
        | "summary"
        | "metrics"
        | "swot"
        | "timeline"
        | "recommendations"
        | "charts"
        | "custom";
      content: string;
      data?: Record<string, unknown>;
    }[]
  >(),
  // Generated content
  executiveSummary: text("executiveSummary"),
  keyFindings: jsonb("keyFindings").$type<string[]>(),
  recommendations: jsonb("recommendations").$type<string[]>(),
  // Metrics snapshot
  metricsSnapshot: jsonb("metricsSnapshot").$type<
    {
      competitorId: number;
      competitorName: string;
      metrics: Record<string, number | string>;
    }[]
  >(),
  // SWOT analysis
  swotAnalysis: jsonb("swotAnalysis").$type<{
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  }>(),
  // File storage
  pdfUrl: text("pdfUrl"),
  pdfSize: integer("pdfSize"), // in bytes
  // Schedule info (if auto-generated)
  scheduleId: integer("scheduleId"),
  isScheduled: boolean("isScheduled").default(false),
  // Status
  status: competitorReportStatusEnum("status").default("generating"),
  errorMessage: text("errorMessage"),
  // Email delivery
  emailDelivered: boolean("emailDelivered").default(false),
  emailDeliveredAt: timestamp("emailDeliveredAt"),
  emailRecipients: jsonb("emailRecipients").$type<string[]>(),
  // Timestamps
  generatedAt: timestamp("generatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type CompetitorReport = typeof competitorReports.$inferSelect;
export type InsertCompetitorReport = typeof competitorReports.$inferInsert;

/**
 * Report Schedules - automated report generation schedules
 */
export const reportSchedules = pgTable("reportSchedules", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  // Schedule info
  name: varchar("name", { length: 255 }).notNull(),
  reportType: reportTypeEnum("reportType").notNull(),
  // Competitors to include
  competitorIds: jsonb("competitorIds").$type<number[]>(),
  // Schedule configuration
  frequency: reportScheduleFrequencyEnum("frequency").notNull(),
  dayOfWeek: integer("dayOfWeek"), // 0-6 for weekly
  dayOfMonth: integer("dayOfMonth"), // 1-31 for monthly
  timeOfDay: varchar("timeOfDay", { length: 8 }), // HH:MM format
  timezone: varchar("timezone", { length: 64 }).default("UTC"),
  // Email delivery
  emailEnabled: boolean("emailEnabled").default(true),
  emailRecipients: jsonb("emailRecipients").$type<string[]>(),
  // Report customization
  includeSections: jsonb("includeSections").$type<string[]>(), // which sections to include
  customPrompt: text("customPrompt"), // custom AI prompt for recommendations
  // Status
  status: reportScheduleStatusEnum("status").default("active"),
  // Tracking
  lastRunAt: timestamp("lastRunAt"),
  nextRunAt: timestamp("nextRunAt"),
  runCount: integer("runCount").default(0),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type ReportSchedule = typeof reportSchedules.$inferSelect;
export type InsertReportSchedule = typeof reportSchedules.$inferInsert;

/**
 * Posting Patterns - analyzed posting patterns for competitors
 */
export const postingPatterns = pgTable("postingPatterns", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  competitorId: integer("competitorId").notNull(),
  // Pattern analysis
  avgPostsPerWeek: numeric("avgPostsPerWeek", { precision: 5, scale: 2 }),
  avgPostsPerMonth: numeric("avgPostsPerMonth", { precision: 5, scale: 2 }),
  // Best performing times
  bestDayOfWeek: integer("bestDayOfWeek"), // 0-6
  bestHourOfDay: integer("bestHourOfDay"), // 0-23
  // Day distribution
  dayDistribution: jsonb("dayDistribution").$type<
    {
      day: number;
      count: number;
      avgEngagement: number;
    }[]
  >(),
  // Hour distribution
  hourDistribution: jsonb("hourDistribution").$type<
    {
      hour: number;
      count: number;
      avgEngagement: number;
    }[]
  >(),
  // Content type distribution
  contentTypeDistribution: jsonb("contentTypeDistribution").$type<
    {
      type: string;
      count: number;
      percentage: number;
      avgEngagement: number;
    }[]
  >(),
  // Gaps and opportunities
  contentGaps: jsonb("contentGaps").$type<
    {
      dayOfWeek?: number;
      hourOfDay?: number;
      contentType?: string;
      opportunity: string;
    }[]
  >(),
  // Recommendations
  recommendations: jsonb("recommendations").$type<string[]>(),
  // Analysis period
  analyzedFrom: timestamp("analyzedFrom"),
  analyzedTo: timestamp("analyzedTo"),
  contentCount: integer("contentCount"),
  // Timestamps
  analyzedAt: timestamp("analyzedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type PostingPattern = typeof postingPatterns.$inferSelect;
export type InsertPostingPattern = typeof postingPatterns.$inferInsert;
