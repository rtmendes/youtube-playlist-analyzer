# YouTube Playlist Analyzer — Marketing Intelligence Platform

A full-stack marketing intelligence application that extracts actionable insights from YouTube playlists, Amazon reviews, Reddit discussions, and TikTok content. The platform uses AI-powered analysis to generate marketing assets, identify content gaps, and track competitor activity across multiple channels.

---

## Overview

This application serves as a centralized research and content generation hub for digital marketers, content creators, and product researchers. It aggregates audience intelligence from four major platforms, applies AI analysis to surface patterns and opportunities, and generates production-ready marketing content directly from real customer language.

| Capability | Description |
|---|---|
| Multi-Source Intelligence | YouTube, Amazon, Reddit, TikTok data collection |
| AI Content Generation | 9 specialized generators using real audience language |
| Competitor Tracking | Channel monitoring, calendar view, auto-import |
| Content Gap Analysis | Topic coverage comparison with strategic recommendations |
| Data Management | Airtable-style grid view with export, filter, and sort |
| Bulk Processing | Analyze hundreds of videos/products in batch operations |

---

## Architecture

The application is built on a modern TypeScript full-stack architecture:

- **Frontend**: React 19 + Tailwind CSS 4 + shadcn/ui components
- **Backend**: Express 4 + tRPC 11 (type-safe RPC)
- **Database**: MySQL/TiDB via Drizzle ORM
- **AI**: Manus Forge API (Gemini 2.5 Flash) for content generation and analysis
- **Storage**: S3-compatible object storage for file uploads

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm db:push

# Start development server
pnpm dev

# Run tests
pnpm test
```

The application runs on port 3000 by default and requires no authentication (OAuth has been removed for standalone use).

---

## Key Pages and Navigation

| Page | Route | Purpose |
|---|---|---|
| Home | `/` | Dashboard with quick-start analysis |
| New Analysis | `/analyze` | Analyze a YouTube playlist or video |
| Bulk Analyze | `/bulk-analyze` | Process multiple videos at once |
| All Videos | `/videos` | Video library with thumbnails and metrics |
| All Channels | `/channels` | Tracked YouTube channels |
| All Comments | `/comments` | Browseable comment database |
| Saved Comments | `/saved-comments` | Curated comments with collections |
| YouTube Intelligence | `/intelligence` | AI-powered audience insights |
| Amazon Reviews | `/amazon` | Product review analysis |
| Reddit Research | `/reddit` | Subreddit post and comment mining |
| TikTok Intelligence | `/tiktok` | TikTok content analysis |
| Competitor Analysis | `/competitor-analysis` | Track and compare competitors |
| Competitor Calendar | `/competitor-calendar` | Visual posting schedule |
| Content Gap Analysis | `/content-gap-analysis` | Identify untapped topics |
| Content Generator | `/content-generator` | AI content creation from insights |
| Data Manager | `/data-manager` | Unified Airtable-style data view |
| Canvas | `/canvas` | Visual workspace for marketing assets |
| Projects | `/projects` | Organize research into projects |

---

## Data Sources

### YouTube
- Playlist analysis with full video metadata (views, likes, comments, duration)
- Comment extraction with nested reply threading
- Channel tracking with subscriber and video counts
- Bulk video processing (up to hundreds at a time)

### Amazon
- Product search and ASIN lookup
- Review extraction with sentiment analysis
- Pain point and praise identification
- Competitive product comparison

### Reddit
- Subreddit post collection
- Comment threading with depth tracking
- Sentiment and theme extraction
- Community language pattern analysis

### TikTok
- Video metadata extraction
- Comment analysis
- Trend identification
- Engagement pattern tracking

---

## AI Content Generators

The platform includes 9 specialized content generators, each using distinct marketing frameworks:

1. **Advertorial** — Long-form native advertising using AIDA framework
2. **VSL Script** — Video Sales Letter scripts with hook-story-offer structure
3. **UGC Scenario** — User-Generated Content scripts for creator partnerships
4. **Course Outline** — Educational course structures from audience questions
5. **Ad Copy** — Short-form advertising with PAS/BAB frameworks
6. **Sales Page** — Full landing page copy with social proof integration
7. **Email Sequence** — Multi-email nurture sequences with segmentation
8. **Product Ideas** — New product concepts derived from audience pain points
9. **Custom Prompt** — Flexible generation with user-defined instructions

All generators pull from real audience comments and reviews to ensure authentic language and genuine pain points are reflected in the output.

---

## Database Schema

The application uses 20+ database tables organized into these domains:

- **Core**: users, playlists, videos, comments
- **Analysis**: analysisSessions, commentInsights, multiSourceInsights
- **Organization**: folders, tags, projects, projectTags
- **Content**: generatedAssets, contentTemplates, contentVersions
- **Amazon**: amazonProducts, amazonReviews
- **Reddit**: redditPosts, redditComments
- **Competitor**: competitorYouTubeChannels, competitorContentCalendar, competitorReports, reportSchedules
- **Saved**: savedComments, savedCommentCollections, playlistVideos

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | MySQL/TiDB connection string |
| `JWT_SECRET` | Session cookie signing |
| `BUILT_IN_FORGE_API_URL` | LLM API endpoint |
| `BUILT_IN_FORGE_API_KEY` | LLM API authentication |
| `GRIDBASE_API_KEY` | GridBase integration (future) |

---

## Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test -- server/channel-wizard-strategy.test.ts
```

The project includes 620+ tests covering:
- API procedure validation
- YouTube URL parsing
- Content generation logic
- Comment threading
- Competitor analysis workflows

---

## Future Roadmap

- Self-hosted Supabase integration for long-term data persistence
- GridBase 2-way sync for external data management
- Free/low-cost LLM model support (Ollama, OpenRouter)
- Automated periodic content refresh via scheduled jobs
- Webhook integrations for real-time competitor alerts

---

## License

Private project. All rights reserved.
