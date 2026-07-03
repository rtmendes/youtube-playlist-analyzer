# Standard Operating Procedure (SOP)

**Application**: YouTube Playlist Analyzer — Marketing Intelligence Platform  
**Version**: 2.0  
**Last Updated**: July 2, 2026  
**Author**: Manus AI  

---

## Purpose

This document provides step-by-step procedures for operating the Marketing Intelligence Platform. It covers the primary workflows for data collection, analysis, content generation, competitor tracking, and data management.

---

## 1. YouTube Playlist Analysis

### 1.1 Single Playlist Analysis

**Objective**: Extract video metadata and comments from a YouTube playlist for audience research.

**Steps**:

1. Navigate to **New Analysis** from the sidebar or home page.
2. Paste the YouTube playlist URL into the input field. Accepted formats include:
   - `https://www.youtube.com/playlist?list=PLxxxxxx`
   - `https://youtube.com/watch?v=xxx&list=PLxxxxxx`
3. Enter your YouTube Data API key (required for live data).
4. Click **Analyze Playlist**.
5. Wait for the system to fetch video metadata (titles, views, likes, thumbnails) and comments.
6. Review results in the analysis dashboard showing:
   - Video performance metrics
   - Comment sentiment distribution
   - Top comments by engagement
   - AI-categorized insights

### 1.2 Bulk Video Analysis

**Objective**: Process multiple videos simultaneously for large-scale research.

**Steps**:

1. Navigate to **Bulk Analyze** from the sidebar.
2. Paste multiple YouTube video URLs (one per line) or a playlist URL.
3. Configure batch settings:
   - Maximum comments per video (default: 100)
   - Include replies (default: yes)
4. Click **Start Bulk Analysis**.
5. Monitor progress as each video is processed sequentially.
6. Results are saved automatically and accessible from the **History** page.

### 1.3 Saving and Organizing Comments

**Steps**:

1. During analysis, select individual comments by clicking the bookmark icon.
2. Saved comments appear in **Saved Comments** in the sidebar.
3. Create collections to organize comments by theme, campaign, or project.
4. Add notes to individual comments for context.
5. Use drag-and-drop to reorder comments within collections.

---

## 2. Amazon Product Research

### 2.1 Product Search and Review Analysis

**Objective**: Extract and analyze Amazon product reviews for marketing insights.

**Steps**:

1. Navigate to **Amazon Reviews** from the sidebar.
2. Enter a product search query or paste an ASIN directly.
3. Select the API provider:
   - **Sample mode** — Uses pre-loaded sample data (no API key required)
   - **Rainforest API** — Live data (requires API key)
   - **ScraperAPI** — Alternative live data source
4. Click **Search Products** or **Analyze ASIN**.
5. Review extracted data:
   - Product metadata (title, price, rating, images)
   - Reviews sorted by helpfulness
   - AI-identified pain points and praises
   - Sentiment breakdown (positive/neutral/negative)
6. Save products to your library for ongoing tracking.

---

## 3. Reddit Research

### 3.1 Subreddit Analysis

**Objective**: Mine Reddit discussions for audience language and pain points.

**Steps**:

1. Navigate to **Reddit Research** from the sidebar.
2. Enter a subreddit name (e.g., `entrepreneur`, `fitness`).
3. Select time range and sort order (hot, top, new).
4. Click **Fetch Posts**.
5. Review posts with scores, comment counts, and flairs.
6. Click into individual posts to see threaded comments with depth indicators.
7. Save relevant posts and comments to your library.

---

## 4. TikTok Intelligence

### 4.1 TikTok Content Analysis

**Objective**: Analyze TikTok videos and comments for trend insights.

**Steps**:

1. Navigate to **TikTok Intelligence** from the sidebar.
2. Paste a TikTok video URL or search by keyword.
3. The system extracts video metadata and comments.
4. Review engagement metrics and comment themes.
5. Identify trending formats and audience reactions.

---

## 5. AI Content Generation

### 5.1 Generating Marketing Content

**Objective**: Create production-ready marketing assets from collected audience data.

**Steps**:

1. Navigate to **Content Generator** from the sidebar.
2. Select a content type from the 9 available generators:
   - Advertorial, VSL Script, UGC Scenario, Course Outline, Ad Copy, Sales Page, Email Sequence, Product Ideas, Custom Prompt
3. Configure generation parameters:
   - **Target product/service** — What you are marketing
   - **Target audience** — Who the content is for
   - **Tone** — Professional, casual, urgent, etc.
   - **Source comments** — Select saved comments to inform the generation
4. Click **Generate Content**.
5. Wait 10–30 seconds for AI processing.
6. Review the generated content in the editor.
7. Use **Save** to store the content, or **Regenerate** for a new version.
8. Access all generated content from the **Data Manager** under the Generated tab.

### 5.2 Content from Gap Analysis

**Steps**:

1. Navigate to **Content Gap Analysis**.
2. Run an analysis to identify content opportunities.
3. Click **Generate Content for This Gap** on any identified opportunity.
4. The Content Generator opens pre-filled with the topic and competitor context.
5. Select your preferred content type and generate.

---

## 6. Competitor Analysis

### 6.1 Adding a Competitor

**Steps**:

1. Navigate to **Competitor Analysis** from the sidebar.
2. Click **Add Competitor**.
3. Use the Channel Linking Wizard:
   - **Step 1 (Search)**: Enter a channel name, URL, or @handle
   - **Step 2 (Preview)**: Review channel info (subscribers, video count)
   - **Step 3 (Link)**: Confirm and link to your competitor list
4. The competitor appears in your tracking dashboard.

### 6.2 Importing Competitor Content

**Steps**:

1. Navigate to **Competitor Calendar** from the sidebar.
2. Click **Import from YouTube**.
3. Select a linked competitor channel.
4. Set the date range for import (last 30/60/90 days).
5. Click **Import** to fetch and populate the calendar.
6. View imported videos on the calendar with color-coded competitor indicators.

### 6.3 Generating Competitor Reports

**Steps**:

1. In the **Competitor Calendar**, click the **Reports** tab.
2. Choose a report type: Weekly Summary, Monthly Summary, or Deep Dive.
3. Click **Generate Now** for an immediate report, or **Schedule Report** for automated delivery.
4. For scheduled reports, configure:
   - Frequency (weekly, bi-weekly, monthly, quarterly)
   - Day of week and time
   - Included competitors
   - Email notification preference
5. Generated reports include AI executive summaries, SWOT analysis, and strategic recommendations.

---

## 7. Data Management

### 7.1 Using the Data Manager

**Objective**: Browse, filter, export, and manage all collected data in one unified view.

**Steps**:

1. Navigate to **Data Manager** from the sidebar (under Library).
2. The page displays summary cards showing counts for each data type.
3. Click a tab (Videos, Comments, Generated, Amazon, Reddit, Insights) to view that data.
4. Use the global search bar to filter across all fields.
5. Click column headers to sort ascending/descending.
6. Drag column edges to resize (widths are persisted).
7. Click any row to open a detail dialog with full record information.

### 7.2 Exporting Data

**Steps**:

1. In the Data Manager, select the desired tab.
2. Apply any filters using the search bar.
3. Click the **Export** dropdown in the top-right.
4. Choose **CSV** or **JSON** format.
5. The file downloads automatically with the current date in the filename.

### 7.3 Bulk Operations

**Steps**:

1. Check the selection boxes on individual rows (or use select-all).
2. The bulk action toolbar appears showing the count of selected items.
3. Click **Delete** to remove selected items (available for Saved Comments).
4. Click **Clear** to deselect all.

---

## 8. Project Organization

### 8.1 Creating Projects

**Steps**:

1. Navigate to **Projects** from the sidebar.
2. Click **New Project**.
3. Enter a project name and optional description.
4. Assign to a folder (create folders for campaign organization).
5. Add tags for cross-project filtering.
6. Associate analysis sessions with the project.

### 8.2 Using Folders and Tags

**Steps**:

1. Create folders from the sidebar by clicking the **+** icon next to "Folders".
2. Drag projects into folders for organization.
3. Create tags from the Tags section.
4. Apply multiple tags to any project for cross-referencing.
5. Use the universal search to find projects by name, tag, or folder.

---

## 9. Troubleshooting

| Issue | Solution |
|---|---|
| YouTube API returns 403 | Check API key quota in Google Cloud Console |
| Comments not loading | Verify the video has comments enabled |
| LLM generation fails | Check network connectivity; retry after 30 seconds |
| Export file is empty | Ensure the active tab has data loaded |
| Page shows "No data yet" | Run an analysis first from the respective source page |
| Slow performance | Reduce batch size for bulk operations |

---

## 10. Maintenance

### Database Backup
- The application uses MySQL/TiDB which handles replication automatically
- For manual backup: export via Data Manager (CSV/JSON) for critical data
- Future: Supabase integration will provide automated backup

### Updating the Application
```bash
git pull origin main
pnpm install
pnpm db:push
pnpm dev
```

### Monitoring
- Check the History page for failed analysis sessions
- Review error messages in the browser console for frontend issues
- Server logs are available in the terminal running `pnpm dev`
