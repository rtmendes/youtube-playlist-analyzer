# YouTube Playlist Analyzer — Complete Feature List

## Overview

The YouTube Playlist Analyzer is a comprehensive marketing intelligence platform that transforms YouTube comments, Amazon reviews, Reddit discussions, and TikTok content into actionable marketing assets. It combines multi-source data collection, AI-powered analysis, and content generation tools into a single workspace.

---

## 1. YouTube Data Collection & Analysis

### URL Parsing & Input
- Accepts YouTube video URLs, playlist URLs, channel URLs, and @handles
- Bulk URL input (paste multiple URLs, one per line)
- Auto-detects URL type (video, playlist, channel)
- Configurable video limit for channel analysis
- "Remember API Key" option with localStorage persistence

### Data Fetching
- Playlist metadata (title, description, video count, channel info)
- Video metadata (title, views, likes, duration, publish date, thumbnails)
- Full comment threads with replies
- Batch comment fetching across all videos in a playlist/channel
- Progress tracking with real-time status updates
- Channel uploads playlist auto-detection

### Comment Intelligence
- Smart comment search with keyword/phrase filtering
- Automatic pattern detection:
  - Personal stories and testimonials
  - Product requests ("I want that", "make a course")
  - Pain points and problems
  - Funny moments and viral potential
  - High-engagement comments (by likes/replies)
- Comment tagging by category (story, request, pain point, humor, testimonial)
- Comment sorting by likes, date (newest/oldest), and reply count

---

## 2. Multi-Source Intelligence

### Amazon Reviews Intelligence
- Product search by ASIN or keyword
- Review fetching with full metadata (rating, verified, helpful votes)
- Filtering by rating, verified purchase, and helpfulness
- Sentiment analysis for reviews
- Key theme and pain point extraction
- Product data caching to reduce API calls

### Reddit Research Intelligence
- Subreddit and keyword search
- Post fetching with engagement metrics (score, comment count)
- Comment thread display with sentiment indicators
- Trending topic extraction
- Common question identification

### TikTok Intelligence
- TikTok content analysis integration
- Cross-platform insight comparison

### Cross-Source Integration
- Unified data model supporting YouTube, Amazon, Reddit, and TikTok
- Source selector when importing insights to Canvas
- Cross-source analysis and comparison
- Source attribution badges on all items

---

## 3. AI-Powered Content Generation (Marketing Canvas)

### Content Types Generated
- **Advertorials** — AIDA/PAS framework, testimonial integration, CRO checklist
- **VSL (Video Sales Letter) Scripts** — Hook/story/offer structure, emotional triggers, timing guidelines
- **UGC (User-Generated Content) Scenarios** — Problem-solution-result format, platform-specific variations (TikTok, IG, YouTube)
- **Course Outlines** — Module/lesson breakdown, learning objectives from pain points, upsell suggestions
- **Ad Copy** — High-CTR headlines, body, CTA variations; platform-specific formats (Facebook, Google, YouTube)
- **Sales Pages** — Full structure (hero, benefits, proof, offer, FAQ), objection handling, CRO optimization
- **Email Sequences** — Welcome, value, pitch, urgency structure; subject line variations
- **Product Ideas** — Market validation framework, pricing/positioning, MVP feature recommendations
- **Custom Prompts** — Freeform AI generation with any prompt

### Canvas Workspace
- Interactive workspace for organizing generated content
- Import comment insights directly to canvas
- Multi-source AI generation (combine YouTube + Amazon + Reddit insights)
- Content type router and navigation
- Save canvas states to projects

### Knowledge Base & SOPs
- CRO best practices knowledge base
- Conversion optimization checklist
- Copywriting frameworks (AIDA, PAS, BAB, 4Ps)
- Industry benchmarks and targets
- SOP templates for each content type

---

## 4. Content Templates & Versioning

### Reusable Templates Library
- Save generated content as reusable templates
- Variable extraction for dynamic content
- Template categories and tags
- Search and filter templates
- Template loading with variable replacement

### Content Versioning System
- Full version history for all generated content
- A/B test tracking with performance metrics (CTR, conversion rate)
- Version comparison view (diff between versions)
- Version rollback functionality
- Notes and annotations on versions
- **A/B Test Winner Auto-Detection** — Statistical significance calculation, winner badge, confidence level display, manual override option

### Scheduled Content Refresh
- Automatic re-generation on daily, weekly, or monthly schedules
- Notification when content is refreshed
- Refresh history with version comparison
- Pause/resume schedule functionality
- Schedule goals (improve CTR, increase conversions, boost engagement, reduce bounce)
- AI suggestions to improve content based on goals

### Export to External Tools
- Google Docs export
- Notion export via MCP integration
- Export formats: plain text, Markdown, rich text, HTML, JSON
- Batch export with multi-select
- Export history tracking
- Combined document generation

---

## 5. Competitor Analysis Suite

### Competitor Management
- Add/edit/delete competitors with industry and description
- Competitor product/service tracking (name, price, features, positioning)
- Side-by-side comparison matrix
- SWOT analysis generator for each competitor
- Competitive positioning recommendations

### YouTube Channel Comparison
- Compare multiple YouTube channels side-by-side
- Channel statistics (subscribers, views, video count)
- Engagement metrics comparison
- Content theme and posting frequency analysis
- Audience sentiment comparison from comments
- Performance visualization charts

### Competitor YouTube Channel Linking Wizard
- 3-step wizard flow: Search → Preview → Link
- Search channels by name or URL
- Auto-detect channel ID from @handle, /channel/UC..., /c/name formats
- Preview channel info (subscribers, video count) before linking
- One-click link to competitor profile

### Competitor Content Calendar
- Calendar view with month/week/day modes
- Color-coded posts by competitor
- Posting frequency patterns and optimal posting times
- Content gap visualization
- Filter by competitor, content type, and date range
- Click-to-view content details
- **YouTube Auto-Import** — Fetch competitor channel videos automatically, sync status indicator, periodic auto-refresh

### Competitor Tracking Alerts
- Alert types: new content, review/rating changes, significant metric changes
- Configurable thresholds per alert
- Notification bell with unread count
- Alert history with read/unread status
- In-app notifications when alerts trigger

### Automated Competitor Reports
- Report types: Weekly Summary, Monthly Summary, Deep Dive
- AI-generated executive summary
- Performance metrics comparison
- SWOT analysis section
- Strategic recommendations
- Scheduled generation (weekly, bi-weekly, monthly, quarterly)
- Email notification options
- Report download as Markdown

### Content Gap Analysis Dashboard
- Topic coverage comparison visualization
- Content type distribution (shorts vs long-form, tutorials vs vlogs)
- Optimal posting times based on competitor patterns
- Engagement benchmarks comparison
- AI-generated gap recommendations
- Filter by competitor and time range
- **"Generate Content for This Gap"** buttons linking directly to Content Generator

---

## 6. Project & Data Organization

### Project Management
- Create, edit, and delete projects
- Folder organization with unlimited nesting
- Tagging system with custom categories and colors
- Folder context menu (rename, delete, move, duplicate)
- Save canvas states and analysis results to projects

### Data Management
- Add/delete videos, channels, and comments
- Bulk selection and actions
- Tag videos, channels, and comments
- Sort by date, name, views, likes, comments, tags
- Filter by tags, date range, channel, status
- Search across all data types
- Favorite/star items for quick access

### Comment Collections
- Create named collections with custom colors
- Save comments to specific collections
- Collection filtering in Saved Comments page
- Drag-and-drop comment reordering within collections
- Shareable collection links (public/private toggle)
- Unique share tokens with revoke access

### Saved Playlists (Library)
- Save analyzed playlists to library
- Run history tracking per playlist
- Re-run analysis with "Refresh" button
- Last run timestamp display

---

## 7. Navigation & UI

### Sidebar Navigation (Notion-style)
- Persistent collapsible left sidebar
- Sections: Home, Library (Videos, Channels, Comments, Saved Comments), Tools, Folders, Favorites, Recent
- Nested folder tree with accordion expansion
- Quick actions (New Analysis, Import)

### Global Search
- Search across projects, folders, tags, videos, and comments
- Unified search results with categories
- Keyboard shortcut (Cmd/Ctrl+K) to open
- Recent searches history

### Views & Display
- Airtable-style list view with sortable columns
- Grid/card view toggle
- Column resizing with localStorage persistence
- Row selection with checkboxes
- Breadcrumb navigation on all pages
- Back/forward navigation history

### Embedded YouTube Browser
- In-app YouTube search and video playback
- Side-by-side layout (browser + analysis workspace)
- "Analyze This Video" quick action
- Video URL extraction from embedded player

### Theme & Accessibility
- Dark/light mode toggle
- Theme preference persistence
- Swiss Style typography (high contrast black/white with red accent)
- Responsive design for mobile/tablet/desktop

---

## 8. Export & Sharing

### Export Formats
- CSV download for comments with video metadata
- JSON export
- Google Sheets integration
- Markdown, TXT, HTML export
- Batch export with multi-select and combined documents

### Export Templates
- Preset templates: Full Data, Comments Only, Metrics Only, Marketing Insights
- Customizable column selection
- Save custom templates for reuse
- Preview export before download

### Sharing Features
- Shareable collection links (public URLs, no auth required)
- Template sharing between users (view, edit, duplicate permissions)
- Public template gallery for community sharing
- Template usage analytics (views, uses, duplicates)

### Team Collaboration
- Template comments and threaded discussions
- Collaborative editing with version tracking
- Shared template library ("Shared with me" section)

---

## 9. Voice & Audio

### Voice Recording & Transcription
- Voice recording button on comment/video views
- Audio recording via Web Audio API
- Speech-to-text transcription
- Voice notes attached to projects/comments
- Transcribed text with edit capability
- Audio playback

---

## 10. Analysis History & Tracking

### Analysis History
- Save and retrieve past analysis results
- Re-download past exports
- History page with list of all analyses
- Save button on analysis results page

### Template Analytics
- Template usage tracking (views, uses, duplicates)
- A/B test performance metrics
- Schedule goal progress tracking
- Export history

---

## 11. Content Strategy Integration

### Gap-to-Content Pipeline
- "Generate Content for This Gap" buttons on all identified content gaps
- Pre-fill Content Generator with topic, competitor benchmarks, and priority
- "Inspired by Gap Analysis" banner when navigating from gap analysis
- High-priority and medium-priority opportunity routing
- Topic opportunities linked with competitor context

---

## Technical Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS 4, shadcn/ui |
| Backend | Express 4, tRPC 11 |
| Database | MySQL/TiDB via Drizzle ORM |
| AI | Manus Forge LLM API (GPT-based) |
| Auth | Manus OAuth |
| Storage | AWS S3 |
| Testing | Vitest (620+ tests passing) |
| Design | Swiss Style typography, dark/light themes |
