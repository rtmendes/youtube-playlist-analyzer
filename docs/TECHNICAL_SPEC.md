# Technical Specification Document

**Application**: YouTube Playlist Analyzer — Marketing Intelligence Platform  
**Version**: 2.0  
**Last Updated**: July 2, 2026  
**Author**: Manus AI  

---

## 1. System Architecture

### 1.1 Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React + TypeScript | 19.x |
| Styling | Tailwind CSS + shadcn/ui | 4.x |
| Routing | Wouter | 3.x |
| State/Data | TanStack Query + tRPC | 5.x / 11.x |
| Backend | Express + tRPC | 4.x / 11.x |
| Database | MySQL/TiDB + Drizzle ORM | 0.44.x |
| AI/LLM | Manus Forge API (Gemini 2.5 Flash) | — |
| Storage | S3-compatible object storage | — |
| Testing | Vitest | — |
| Build | Vite + esbuild | — |

### 1.2 Directory Structure

```
youtube-playlist-analyzer/
├── client/                    # Frontend application
│   ├── src/
│   │   ├── pages/             # Page-level components (25+ pages)
│   │   ├── components/        # Reusable UI components
│   │   ├── contexts/          # React contexts (Theme, Navigation)
│   │   ├── hooks/             # Custom hooks
│   │   ├── lib/               # tRPC client, utilities
│   │   └── _core/             # Auth hooks (no-auth mode)
│   └── public/                # Static assets
├── server/                    # Backend application
│   ├── _core/                 # Framework plumbing (OAuth, context, LLM)
│   ├── routers.ts             # All tRPC procedures (~7100 lines)
│   ├── youtube.ts             # YouTube API client class
│   ├── content-prompts.ts     # AI generation prompt templates
│   ├── db.ts                  # Database connection helpers
│   └── storage.ts             # S3 storage helpers
├── drizzle/                   # Database schema and migrations
│   ├── schema.ts              # All table definitions (20+ tables)
│   └── migrations/            # SQL migration files
├── shared/                    # Shared types and constants
├── docs/                      # Documentation suite
└── tests/                     # Test files (620+ tests)
```

---

## 2. Data Flow Diagrams

### 2.1 YouTube Analysis Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    YouTube Analysis Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  User Input          API Layer           Processing        DB     │
│  ─────────          ─────────           ──────────        ──     │
│                                                                   │
│  Playlist URL ──→ parseYouTubeInput() ──→ Extract playlist ID     │
│       │                                                           │
│       ▼                                                           │
│  YouTube API ──→ getPlaylist() ──→ Fetch video list               │
│       │                                                           │
│       ▼                                                           │
│  For each video:                                                  │
│    ├── getVideoDetails() ──→ title, views, likes, thumbnail       │
│    └── getComments() ──→ top-level + replies (nested)             │
│              │                                                     │
│              ▼                                                     │
│  Save to DB: videos table + comments table                        │
│              │                                                     │
│              ▼                                                     │
│  AI Analysis: categorize comments, score sentiment                │
│              │                                                     │
│              ▼                                                     │
│  Store in: commentInsights table                                  │
│              │                                                     │
│              ▼                                                     │
│  Display: Analysis dashboard with charts + tables                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Content Generation Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                  Content Generation Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Input Sources                Processing              Output      │
│  ─────────────               ──────────              ──────      │
│                                                                   │
│  Saved Comments ─┐                                                │
│  Video Titles ───┤──→ Aggregate source material                   │
│  User Config ────┘         │                                      │
│                            ▼                                      │
│              Select prompt template (1 of 9)                      │
│                            │                                      │
│                            ▼                                      │
│              Build system prompt:                                  │
│              ├── Marketing framework (AIDA/PAS/etc.)              │
│              ├── CRO best practices                               │
│              ├── Audience language samples                         │
│              └── User parameters (product, tone, audience)        │
│                            │                                      │
│                            ▼                                      │
│              invokeLLM() ──→ Gemini 2.5 Flash                     │
│                            │                                      │
│                            ▼                                      │
│              Parse response ──→ contentTemplates table             │
│                            │                                      │
│                            ▼                                      │
│              Display in editor with save/regenerate               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Competitor Tracking Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                 Competitor Tracking Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Channel Linking          Auto-Import           Calendar View     │
│  ──────────────          ───────────           ─────────────     │
│                                                                   │
│  Search by name/URL ──→ YouTube Search API                        │
│         │                                                         │
│         ▼                                                         │
│  Preview channel info (subs, videos)                              │
│         │                                                         │
│         ▼                                                         │
│  Link to competitor ──→ competitorYouTubeChannels table           │
│         │                                                         │
│         ▼                                                         │
│  Import videos ──→ getChannelVideos() ──→ Fetch recent uploads    │
│         │                                                         │
│         ▼                                                         │
│  Map to calendar ──→ competitorContentCalendar table              │
│         │                                                         │
│         ▼                                                         │
│  Calendar renders: month/week/day views                           │
│  Color-coded by competitor                                        │
│         │                                                         │
│         ▼                                                         │
│  Pattern Analysis: posting frequency, optimal times               │
│         │                                                         │
│         ▼                                                         │
│  Report Generation: AI summary + SWOT + recommendations           │
│  ──→ competitorReports table                                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 Data Manager Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Data Manager Flow                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Data Sources (DB Tables)    Unified View        Export           │
│  ────────────────────────   ────────────        ──────           │
│                                                                   │
│  analysisSessions ─────┐                                          │
│  savedComments ────────┤                                          │
│  contentTemplates ─────┤──→ DataManager Page                      │
│  amazonProducts ───────┤    ├── Tab selection                     │
│  redditPosts ──────────┤    ├── Global search filter              │
│  commentInsights ──────┘    ├── Sortable columns                  │
│                             ├── Resizable widths (persisted)       │
│                             ├── Pagination (25/page)              │
│                             ├── Row selection (multi)             │
│                             └── Detail dialog (click row)         │
│                                      │                            │
│                                      ▼                            │
│                             Export Options:                        │
│                             ├── CSV (all fields)                  │
│                             └── JSON (structured)                 │
│                                                                   │
│  Future: GridBase 2-way sync ←──→ External API                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.5 Comment Threading Model

```
┌─────────────────────────────────────────────────────────────────┐
│                  Comment Threading Structure                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  YouTube API Response         Database Model        UI Rendering  │
│  ────────────────────        ──────────────        ────────────  │
│                                                                   │
│  commentThread {              comments table:                      │
│    topLevelComment ──────→   id, youtubeId, videoId               │
│    replies[] ────────────→   parentCommentId (self-ref)           │
│  }                           likeCount, replyCount                │
│                              textDisplay, authorName              │
│                                     │                             │
│                                     ▼                             │
│  Ranking Algorithm:                                               │
│  ├── Sort by likeCount (desc) for top-level                      │
│  ├── Sort by publishedAt (asc) for replies                       │
│  └── Filter by sentiment, category, keyword                      │
│                                     │                             │
│                                     ▼                             │
│  UI renders:                                                      │
│  ┌─ Top Comment (author, text, likes, replies count)             │
│  │  └─ Reply 1 (indented, author, text, likes)                   │
│  │  └─ Reply 2 (indented, author, text, likes)                   │
│  ┌─ Top Comment 2                                                │
│  │  └─ Reply 1                                                    │
│                                                                   │
│  Reddit threading adds: depth field (0-10+)                       │
│  ├── parentCommentId chains for deep nesting                     │
│  └── Score-based ranking within each depth level                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema Details

### 3.1 Core Tables

**videos** — Stores YouTube video metadata fetched during analysis.

| Column | Type | Description |
|---|---|---|
| id | INT (PK) | Auto-increment primary key |
| youtubeId | VARCHAR(64) | YouTube video ID (unique) |
| playlistId | INT | FK to playlists table |
| title | TEXT | Video title |
| description | TEXT | Video description |
| channelId | VARCHAR(64) | YouTube channel ID |
| channelTitle | TEXT | Channel display name |
| thumbnailUrl | TEXT | Thumbnail image URL |
| duration | VARCHAR(32) | ISO 8601 duration |
| viewCount | BIGINT | View count |
| likeCount | BIGINT | Like count |
| commentCount | BIGINT | Comment count |
| publishedAt | TIMESTAMP | Original publish date |
| tags | JSON | Video tags array |

**comments** — Stores YouTube comments with self-referencing parent for threading.

| Column | Type | Description |
|---|---|---|
| id | INT (PK) | Auto-increment primary key |
| youtubeId | VARCHAR(64) | YouTube comment ID (unique) |
| videoId | INT | FK to videos table |
| parentCommentId | INT | Self-reference for replies (NULL = top-level) |
| authorChannelId | VARCHAR(64) | Commenter's channel ID |
| authorDisplayName | TEXT | Commenter's display name |
| textDisplay | TEXT | Rendered comment text |
| likeCount | INT | Like count |
| replyCount | INT | Reply count (top-level only) |
| publishedAt | TIMESTAMP | Comment publish date |

### 3.2 AI Analysis Tables

**commentInsights** — AI-categorized comments with marketing scores.

| Column | Type | Description |
|---|---|---|
| id | INT (PK) | Auto-increment primary key |
| projectId | INT | FK to projects table |
| commentId | VARCHAR(64) | Reference to source comment |
| category | ENUM | One of 10 categories (personal_story, testimonial, etc.) |
| sentimentScore | INT | -1 to +1 sentiment rating |
| marketingPotential | INT | 0–100 marketing utility score |
| extractedInsights | JSON | AI-extracted key phrases and themes |
| suggestedUses | JSON | Recommended marketing applications |

**contentTemplates** — Generated marketing content with versioning.

| Column | Type | Description |
|---|---|---|
| id | INT (PK) | Auto-increment primary key |
| userId | INT | FK to users table |
| title | VARCHAR(255) | Content title |
| contentType | ENUM | One of 9 generator types |
| content | TEXT | Full generated content |
| promptUsed | TEXT | The prompt that produced this content |
| sourceComments | JSON | Comment IDs used as input |
| isFavorite | BOOLEAN | User-starred content |

---

## 4. API Design (tRPC Procedures)

### 4.1 Router Structure

The application uses a single monolithic router file (`server/routers.ts`) organized into 20 sub-routers:

| Router | Procedures | Purpose |
|---|---|---|
| `youtube` | parseUrl, getPlaylist, getPlaylistVideos, getVideoComments, getBatchVideoComments | YouTube data fetching |
| `analysis` | list, get, create, getPlaylistHistory | Analysis session management |
| `folders` | list, create, update, delete | Folder organization |
| `tags` | list, create, delete | Tag management |
| `projects` | list, create, update, delete, getDetails | Project workspace |
| `insights` | saveComments, getByProject, updateCategory, toggleSelected | AI comment insights |
| `assets` | list, create, delete | Generated marketing assets |
| `amazon` | searchProducts, getReviews, analyzeReviews, listProducts, deleteProduct | Amazon research |
| `reddit` | fetchPosts, fetchComments, listPosts, deletePost | Reddit research |
| `multiInsights` | generate, listByProject, listBySource | Cross-source insights |
| `savedPlaylists` | list, create, delete, get | Playlist management |
| `playlistRuns` | list, create, get | Playlist analysis runs |
| `playlistVideos` | saveMany, listByPlaylist, updateCommentFetch | Video tracking |
| `tiktok` | parseUrl, searchVideos, getComments | TikTok intelligence |
| `savedComments` | getAll, save, bulkDelete, updateNotes, list | Comment curation |
| `collections` | getAll, create, addComment, removeComment, delete | Comment collections |
| `nlpAnalysis` | categorize, extractInsights | NLP processing |
| `contentGenerator` | generate, getAllGeneratedContent, saveContent, getTemplates | Content creation |
| `competitorAnalysis` | searchYouTubeChannels, resolveYouTubeChannel, addYouTubeChannel, listChannels | Competitor tracking |
| `competitorCalendar` | getEntries, addEntry, importFromYouTube, analyzePatterns, generateReport, scheduleReport | Calendar and reports |

### 4.2 Authentication Model

All procedures use `protectedProcedure` which has been modified to bypass authentication:

```typescript
// server/_core/trpc.ts
export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  // No-auth mode: create anonymous user context
  const user = ctx.user || { id: 1, name: "User", role: "admin" };
  return next({ ctx: { ...ctx, user } });
});
```

This allows the application to function without OAuth while maintaining the procedure structure for future re-enablement.

---

## 5. LLM Integration

### 5.1 Model Configuration

The application uses the Manus Forge API with Gemini 2.5 Flash as the default model:

```typescript
// server/_core/llm.ts
const response = await invokeLLM({
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ],
});
```

### 5.2 Prompt Architecture

Each content generator uses a multi-layer prompt structure:

1. **System prompt** — Marketing framework + CRO best practices + output format
2. **User prompt** — Aggregated source comments + user parameters (product, audience, tone)
3. **Response format** — Structured output with sections, headers, and formatting

The prompts are defined in `server/content-prompts.ts` and include:
- Framework-specific instructions (AIDA, PAS, BAB, Hook-Story-Offer)
- CRO conversion optimization rules
- Audience language integration requirements
- Output length and structure guidelines

---

## 6. Scalability Considerations

### 6.1 Current Limitations

| Aspect | Current State | Bottleneck |
|---|---|---|
| Video processing | Sequential per video | YouTube API quota (10,000 units/day) |
| Comment fetching | 100 per page, paginated | API rate limits |
| LLM generation | Single request, 10–30s | Model inference time |
| Database queries | No pagination on some lists | Memory for large datasets |
| Bulk operations | Client-side batching | Browser memory for 500+ items |

### 6.2 Scaling Strategies (Future)

1. **Queue-based processing** — Move bulk operations to a job queue (Bull/BullMQ) for background processing
2. **Caching layer** — Add Redis for frequently accessed data (channel info, video metadata)
3. **Database indexing** — Add composite indexes on (userId, createdAt) for all user-scoped tables
4. **Pagination everywhere** — Implement cursor-based pagination for all list endpoints
5. **Model routing** — Use cheaper models (Gemini Flash) for categorization, premium models for generation
6. **Self-hosted LLM** — Ollama or vLLM for unlimited local inference at zero marginal cost

---

## 7. Security Considerations

| Area | Implementation |
|---|---|
| API keys | Stored in environment variables, never committed |
| Database | Connection via TLS, credentials in env |
| File uploads | S3 with non-enumerable paths (random suffixes) |
| XSS prevention | React's built-in escaping + no dangerouslySetInnerHTML |
| CSRF | Same-origin cookie policy |
| Rate limiting | YouTube API quota management (client-side) |

---

## 8. Deployment

### 8.1 Build Process

```bash
pnpm build
# Produces:
# - dist/index.js (server bundle via esbuild)
# - dist/client/ (frontend bundle via Vite)
```

### 8.2 Environment Requirements

- Node.js 22+
- MySQL 8.0+ or TiDB
- S3-compatible storage endpoint
- Network access to Manus Forge API

### 8.3 Database Migrations

```bash
pnpm db:push  # Generates and applies migrations via drizzle-kit
```

This runs `drizzle-kit generate` followed by `drizzle-kit migrate` to sync the schema with the database.
