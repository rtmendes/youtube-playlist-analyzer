# Product Requirements Document (PRD)

**Product Name**: YouTube Playlist Analyzer — Marketing Intelligence Platform  
**Version**: 2.0  
**Last Updated**: July 2, 2026  
**Author**: Manus AI  

---

## 1. Executive Summary

The YouTube Playlist Analyzer is a marketing intelligence platform designed for content creators, digital marketers, and product researchers who need to extract actionable insights from audience conversations across multiple platforms. The product aggregates data from YouTube, Amazon, Reddit, and TikTok, applies AI-powered analysis, and generates production-ready marketing content using real audience language.

The platform eliminates the manual process of reading thousands of comments, reviews, and posts by automating pattern recognition, sentiment analysis, and content generation. Users can track competitors, identify content gaps, and produce marketing assets in minutes rather than days.

---

## 2. Problem Statement

Digital marketers and content creators face several critical challenges:

1. **Information overload** — Thousands of comments and reviews across platforms contain valuable insights, but manual extraction is impractical at scale.
2. **Disconnected tools** — Separate tools for YouTube analytics, Amazon research, Reddit monitoring, and content creation create workflow friction.
3. **Generic content** — Marketing content that does not use actual audience language underperforms content that mirrors how customers naturally speak.
4. **Competitor blindness** — Without systematic tracking, creators miss competitor strategies, posting patterns, and content gaps.
5. **No single source of truth** — Research findings are scattered across spreadsheets, documents, and browser bookmarks with no unified view.

---

## 3. Target Users

| Persona | Description | Primary Use Case |
|---|---|---|
| Content Creator | YouTube/TikTok creator with 10K–1M subscribers | Audience research, content ideas, competitor tracking |
| Digital Marketer | Agency or in-house marketer managing campaigns | Ad copy generation, audience insights, product research |
| Product Researcher | Entrepreneur or PM validating product ideas | Review mining, pain point extraction, market gaps |
| Course Creator | Online educator building curriculum | Student question analysis, course structure generation |

---

## 4. Core Features

### 4.1 Multi-Source Data Collection

The platform collects and normalizes data from four sources into a unified schema:

- **YouTube**: Playlists, videos (metadata + thumbnails), comments with nested replies, channel details
- **Amazon**: Products (ASIN, price, rating, images), reviews with sentiment
- **Reddit**: Posts (score, flair, awards), comments with threading depth
- **TikTok**: Videos (views, shares, engagement), comments

Each source supports bulk input accepting multiple URL formats (channel URLs, @handles, playlist links, ASIN codes, subreddit names, etc.).

### 4.2 AI-Powered Analysis

The analysis engine processes collected data through several AI pipelines:

- **Comment categorization** — Classifies comments into: personal_story, testimonial, product_request, pain_point, humor, question, praise, criticism, suggestion
- **Sentiment scoring** — Assigns -1 to +1 sentiment scores per comment
- **Marketing potential** — Rates each comment 0–100 for marketing asset utility
- **Theme extraction** — Identifies recurring themes across comment sets
- **Audience psychographics** — Builds audience profiles from language patterns

### 4.3 Content Generation (9 Generators)

Each generator uses specialized marketing frameworks and real audience language:

| Generator | Framework | Output |
|---|---|---|
| Advertorial | AIDA (Attention, Interest, Desire, Action) | 1500–3000 word native ad article |
| VSL Script | Hook → Story → Offer → Close | 10–20 minute video script |
| UGC Scenario | Situation → Problem → Solution → CTA | 60–90 second creator brief |
| Course Outline | Module → Lesson → Exercise structure | Full course curriculum |
| Ad Copy | PAS (Problem, Agitate, Solution) + BAB (Before, After, Bridge) | 5–10 ad variations |
| Sales Page | Hero → Problem → Solution → Proof → CTA | Full landing page copy |
| Email Sequence | Welcome → Nurture → Pitch → Follow-up | 5–7 email series |
| Product Ideas | Pain Point → Solution → Validation | 3–5 product concepts |
| Custom Prompt | User-defined | Variable |

### 4.4 Competitor Intelligence

- **Channel Linking Wizard** — 3-step flow: Search → Preview → Link (supports @handle, /channel/, /c/ URL formats)
- **Content Calendar** — Month/week/day views showing competitor posting schedules with color coding
- **Auto-Import** — Fetches competitor YouTube videos automatically and populates the calendar
- **Posting Pattern Analysis** — Identifies optimal posting times and frequency patterns
- **Automated Reports** — Scheduled weekly/monthly competitor intelligence reports with AI summaries

### 4.5 Content Gap Analysis

- **Topic coverage comparison** — Shows topics competitors cover that the user does not
- **Content type distribution** — Compares shorts vs. long-form, tutorials vs. vlogs
- **Engagement benchmarks** — Performance comparison across competitors
- **Strategic recommendations** — AI-generated action items for content strategy
- **Generate Content integration** — One-click from gap insight to Content Generator with pre-filled context

### 4.6 Data Manager

An Airtable-style unified data view providing:

- **Tabular rows** for all data types (videos, comments, generated content, products, posts, insights)
- **Global search** across all fields
- **Column sorting** and resizable columns with persistent widths
- **Bulk selection** and deletion
- **Export** to CSV and JSON
- **Detail dialogs** with full record inspection including nested replies
- **Row counts** and summary statistics per data type

---

## 5. Non-Functional Requirements

| Requirement | Specification |
|---|---|
| Authentication | None required (standalone mode) |
| Performance | Page load < 2s, API responses < 5s (excluding LLM calls) |
| Data persistence | MySQL/TiDB with Drizzle ORM |
| Browser support | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| Responsive design | Desktop-first with mobile-friendly layouts |
| Export formats | CSV, JSON, Markdown |
| Test coverage | 620+ automated tests |

---

## 6. Technical Constraints

- LLM calls use Manus Forge API (Gemini 2.5 Flash) — future support for self-hosted models planned
- YouTube Data API v3 requires user-provided API key for live data
- Amazon/Reddit scraping uses sample data mode unless API keys are provided
- File storage uses S3-compatible object storage
- Database is MySQL-compatible (TiDB in production)

---

## 7. Success Metrics

| Metric | Target |
|---|---|
| Time to first insight | < 5 minutes from URL input |
| Content generation quality | Uses 3+ real audience phrases per piece |
| Competitor tracking coverage | Monitor 10+ channels simultaneously |
| Data export completeness | All fields preserved in CSV/JSON |
| System reliability | 99.5% uptime, < 1% error rate on API calls |

---

## 8. Roadmap

### Phase 1 (Current)
- Multi-source data collection (YouTube, Amazon, Reddit, TikTok)
- 9 AI content generators
- Competitor analysis with calendar and auto-import
- Content gap analysis with strategy integration
- Data Manager with export capabilities

### Phase 2 (Planned)
- Self-hosted Supabase integration for persistent storage
- GridBase 2-way sync for external data management
- Free/low-cost LLM support (Ollama, OpenRouter, local models)
- Automated periodic content refresh
- Webhook-based competitor alerts

### Phase 3 (Future)
- Team collaboration features
- White-label report generation
- API access for external integrations
- Mobile-optimized interface
- Custom AI model fine-tuning on user data
