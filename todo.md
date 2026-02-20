# Project TODO

## Core Features
- [x] YouTube URL parser (video, playlist, channel detection)
- [x] Playlist metadata fetching (title, description, video count, channel info)
- [x] Video metadata fetching (title, views, likes, duration, publish date)
- [x] Comment fetching for videos
- [x] Comment reply fetching
- [x] Export data as JSON/CSV

## UI Components
- [x] Landing page with URL input
- [x] Playlist overview dashboard
- [x] Video list with metadata
- [x] Comment viewer with search/filter
- [x] Export functionality
- [x] Loading states and progress indicators
- [x] Error handling and user feedback

## Design
- [x] Swiss Style typography and layout
- [x] High contrast black/white with red accent
- [x] Responsive design for mobile/tablet/desktop
- [ ] Data visualization charts

## Database
- [x] Schema for playlists
- [x] Schema for videos
- [x] Schema for comments
- [x] Schema for analysis history

## API Integration
- [x] YouTube Data API v3 integration
- [ ] Rate limiting handling
- [ ] Quota management

## Batch Comment Fetching Feature
- [x] Add batch comment fetching API endpoint
- [x] Add "Fetch All Comments" button to Analyze page
- [x] Implement progress tracking for batch fetching
- [x] Add all comments view with combined search/filter
- [x] Add export all comments functionality

## Comment Sorting Feature
- [x] Add sort dropdown for single video comments
- [x] Add sort dropdown for all comments view
- [x] Implement sorting by likes (most liked first)
- [x] Implement sorting by date (newest/oldest first)
- [x] Implement sorting by reply count (most replies first)

## Bulk URL Input & Export Feature
- [x] Add bulk URL textarea input (multiple URLs, one per line)
- [x] Parse multiple playlist/video URLs
- [x] Fetch top 100 comments per video automatically
- [x] Display video metadata with comment counts
- [x] Show comment text content for each video
- [x] Add CSV download for all comments with video metadata
- [x] Add Google Sheets export integration
- [x] Streamline UI for bulk processing workflow

## Channel URL Support Feature
- [x] Add getChannelByHandle API endpoint to resolve channel handles to channel IDs
- [x] Add getChannelById API endpoint to get channel info by ID
- [x] Update BulkAnalyze page to process channel URLs
- [x] Fetch all videos from channel's uploads playlist
- [x] Show channel name in progress tracking
- [x] Add unit tests for channel URL parsing

## Remember API Key Feature
- [x] Add "Remember API Key" checkbox to Home page
- [x] Store API key in localStorage when checkbox is checked
- [x] Auto-populate API key field from localStorage on page load
- [x] Clear localStorage when checkbox is unchecked

## Video Limit for Channels
- [x] Add video limit dropdown/input to Home page
- [x] Pass video limit to BulkAnalyze page
- [x] Implement video limit logic in channel processing
- [x] Show limit indicator in progress tracking

## Analysis History Page
- [x] Update database schema to store analysis results
- [x] Create API endpoints to save and retrieve analysis history
- [x] Create History page UI with list of past analyses
- [x] Add re-download functionality for past exports
- [x] Add navigation link to History page
- [x] Add Save button to BulkAnalyze page

## Comment Intelligence & Marketing Asset Generator

### Smart Comment Search & Pattern Detection
- [x] Add comment search with keyword/phrase filtering
- [x] Detect personal stories and testimonials in comments
- [x] Identify product requests ("I want that", "needs to be a tshirt", "make a course")
- [x] Find pain points and problems mentioned
- [x] Extract funny moments and viral potential comments
- [x] Highlight high-engagement comments (likes, replies)
- [x] Tag comments by category (story, request, pain point, humor, testimonial)

### Google Gemini AI Integration
- [x] Set up Gemini API integration
- [ ] Analyze psychographic profiles from comments
- [ ] Identify demographic patterns
- [ ] Detect personality tendencies (Enneagram, MBTI, DISC, Kolbe, attachment style, love language)
- [ ] Generate audience persona summaries
- [ ] Suggest optimal offer types based on audience insights

### Marketing Canvas Workspace
- [x] Create interactive canvas page
- [x] Add comment search results to canvas
- [x] Generate advertorials from personal stories
- [x] Create video sales letter (VSL) scripts
- [x] Generate UGC video scenarios
- [x] Build ebook outlines from insights
- [x] Create course structure suggestions
- [x] Generate ad copy variations
- [x] Build sales page copy
- [x] Create product offer recommendations
- [x] Add custom prompt input for AI generation

### Project Management System
- [x] Create projects database table
- [x] Create folders database table
- [x] Create tags database table
- [x] Build project creation and editing UI
- [x] Implement folder organization
- [x] Add tagging system with clickable tags
- [x] Save canvas states to projects
- [x] Export project assets

## Bug Fixes
- [ ] Fix issue where playlist analysis doesn't fetch data when URL and API key are entered

- [ ] Add detailed error logging to YouTube API calls
- [ ] Display specific error messages in UI (API key invalid, quota exceeded, etc.)
- [ ] Add "Test API Key" button to verify key before analysis


## Sidebar Navigation Redesign (Notion-style)

### Left Sidebar Structure
- [x] Create persistent left sidebar layout component
- [x] Add collapsible sidebar toggle
- [x] Implement workspace/home section at top
- [x] Add quick actions section (New Analysis, Import, etc.)

### Folder Hierarchy System
- [x] Create nested folder tree component with accordion expansion
- [x] Support unlimited subfolder depth
- [x] Add folder icons with customizable colors
- [ ] Implement drag-and-drop folder reordering
- [x] Add folder context menu (rename, delete, move, duplicate)
- [x] Create "Add Folder" and "Add Subfolder" buttons
- [ ] Show item counts in folders

### Project Organization
- [ ] Move projects into folder structure
- [ ] Allow projects to be moved between folders
- [ ] Support project duplication
- [ ] Add project templates

### Data Management (Videos, Channels, Comments)
- [x] Add/delete videos from projects
- [x] Add/delete channels from tracking
- [x] Bulk selection and actions
- [x] Tag videos, channels, and comments
- [x] Create custom tag categories
- [x] Sort by: date, name, views, likes, comments, tags
- [x] Filter by: tags, date range, channel, status
- [x] Search across all data types
- [x] Favorite/star items for quick access

### Navigation Sections
- [x] Home/Dashboard
- [x] All Videos
- [x] All Channels
- [x] All Comments
- [x] Intelligence (Comment Analysis)
- [x] Canvas (Marketing Assets)
- [x] History
- [x] Trash/Archive

### UI Improvements
- [ ] Keyboard shortcuts for navigation
- [ ] Breadcrumb navigation
- [ ] Recent items section
- [ ] Pinned items section

## Global Search & Enhanced Interactions

### Global Search
- [x] Create global search component in sidebar
- [x] Search across projects by name and description
- [x] Search across folders by name
- [x] Search across tags
- [x] Search across videos by title and channel
- [x] Search across comments by text content
- [x] Display unified search results with categories
- [x] Add keyboard shortcut (Cmd/Ctrl+K) to open search
- [x] Show recent searches

### Multi-Select Functionality
- [ ] Add shift+click for range selection
- [ ] Add Cmd/Ctrl+click for individual toggle
- [ ] Add "Select All" checkbox in headers
- [ ] Show selection count in toolbar
- [ ] Enable bulk actions on selected items (tag, move, delete)
- [ ] Add selection persistence across page navigation

### Drag and Drop
- [ ] Install and configure dnd-kit library
- [ ] Enable drag-and-drop folder reordering in sidebar
- [ ] Enable drag items into folders
- [ ] Enable drag folders into other folders (nesting)
- [ ] Add visual drop indicators
- [ ] Implement drag handle for items
- [ ] Add keyboard accessibility for drag operations

## Dashboard & Knowledge Base Improvements

### Modern Dashboard Redesign
- [ ] Replace generic dashboard image with feature-specific widgets
- [ ] Add stats cards showing: Total Videos, Total Comments, Total Channels, Projects
- [ ] Add recent activity feed widget
- [ ] Add quick action cards linking to app features
- [ ] Make all dashboard widgets clickable and link to respective features
- [ ] Add modern visual styling with gradients and icons

### Knowledge Base Section
- [ ] Add Help/Knowledge Base section to sidebar bottom
- [ ] Create explanations for each app section:
  - Home: Start new analyses
  - All Videos: Browse and manage collected videos
  - All Channels: Track YouTube channels
  - All Comments: Search and filter comments
  - Intelligence: AI-powered comment analysis
  - Canvas: Generate marketing assets
  - History: View past analyses
  - Projects: Organize work into folders
- [ ] Add collapsible knowledge base panel
- [ ] Include quick tips and feature descriptions

## Clickable Tags, Export Templates & Voice Recording

### Clickable Tags
- [x] Make tags clickable in video cards
- [x] Make tags clickable in comment cards
- [x] Navigate to filtered view when tag is clicked
- [x] Show tag filter in URL for shareable links
- [x] Add tag highlight when active filter

### Export Templates
- [x] Create export template selection dialog
- [x] Add preset templates (Full Data, Comments Only, Metrics Only, Marketing Insights)
- [x] Allow customizable column selection
- [x] Support CSV, JSON, and Google Sheets formats
- [x] Save custom templates for reuse
- [x] Preview export before download

### Voice Recording & Transcription
- [x] Add voice recording button to comment/video views
- [x] Implement audio recording using Web Audio API
- [x] Integrate speech-to-text transcription
- [x] Save voice notes attached to projects/comments
- [x] Display transcribed text with edit capability
- [x] Allow playback of recorded audio

## List View, Channel Details & Breadcrumb Navigation

### Airtable-Style List View
- [x] Create reusable DataTable component with sortable columns
- [x] Add list view option for videos (tabular rows with all metadata)
- [x] Add list view option for comments (tabular rows with all info)
- [x] Make list view the default view
- [x] Add view toggle (list/grid) in page header
- [x] Support column resizing and reordering
- [x] Add row selection with checkboxes

### Channel Detail Page
- [x] Create channel detail page showing all channel metadata
- [x] Display all videos from the channel in list view
- [x] Make channel name clickable in video cards/rows
- [x] Show channel stats (subscribers, total views, video count)
- [x] Add channel thumbnail and banner

### Breadcrumb Navigation
- [x] Create reusable Breadcrumb component
- [x] Add breadcrumbs to all pages
- [x] Track navigation history for back navigation
- [x] Show current location in app hierarchy
- [x] Support dynamic breadcrumbs based on context (e.g., Channel > Video)

## Column Resizing & In-App Navigation

### Column Resizing
- [x] Add draggable column borders to DataTable
- [x] Store column widths in localStorage for persistence
- [x] Add minimum/maximum column width constraints
- [x] Show resize cursor on hover over column borders

### In-App Navigation History
- [x] Create NavigationHistory context to track visited pages
- [x] Add back/forward buttons to breadcrumb component
- [x] Store navigation stack with page state (filters, scroll position)
- [ ] Enable keyboard shortcuts (Alt+Left/Right) for back/forward
- [ ] Persist navigation history across page refreshes

## Dark Mode Toggle

### Theme Toggle Feature
- [x] Create ThemeToggle component with sun/moon icons
- [x] Add toggle to sidebar footer near Knowledge Base
- [x] Persist theme preference in localStorage
- [x] Update CSS variables for dark theme colors
- [x] Ensure all UI components work in dark mode

## Multi-Source Intelligence Expansion

### Amazon Comments Intelligence
- [x] Create Amazon products database table (asin, title, rating, reviewCount, price, imageUrl)
- [x] Create Amazon reviews database table (productId, reviewId, author, rating, title, body, helpful, verified, date)
- [x] Build API routes for Amazon product search and review fetching
- [x] Create AmazonIntelligence page with product search input
- [x] Display product details with review statistics
- [x] Show review list with filtering (rating, verified, helpful)
- [x] Add sentiment analysis for reviews
- [x] Extract key themes and pain points from reviews
- [x] Add to sidebar navigation under Tools

### Reddit Research Intelligence
- [x] Create Reddit posts database table (postId, subreddit, title, body, author, score, commentCount, url, createdAt)
- [x] Create Reddit comments database table (postId, commentId, author, body, score, createdAt)
- [x] Build API routes for Reddit search and post/comment fetching
- [x] Create RedditResearch page with subreddit and keyword search
- [x] Display posts with engagement metrics
- [x] Show comment threads with sentiment indicators
- [x] Extract trending topics and common questions
- [x] Add to sidebar navigation under Tools

### Canvas Multi-Source Integration
- [x] Update Canvas data model to support multiple source types (youtube, amazon, reddit)
- [x] Add source selector when importing insights to Canvas
- [x] Create unified insight card component for all sources
- [x] Enable cross-source analysis and comparison
- [x] Add source attribution badges to Canvas items
- [ ] Support combining insights from multiple sources into single marketing assets

## Advanced Features Implementation

### Real Amazon API Integration
- [x] Research and select Amazon product data API (Rainforest API, ScraperAPI, or similar)
- [x] Create API service wrapper for fetching real product data
- [x] Update Amazon Intelligence page to use real API
- [x] Add API key configuration in settings
- [x] Handle rate limiting and error responses
- [x] Cache product data to reduce API calls

### Multi-Source AI Generation in Canvas
- [x] Create unified prompt builder that combines YouTube, Amazon, and Reddit insights
- [x] Add "Generate from All Sources" button in Canvas
- [x] Build context aggregator to summarize insights from each source
- [x] Create specialized prompts for multi-source content types
- [ ] Add source weighting options (prioritize certain sources)
- [x] Show which sources contributed to generated content

### Competitor Analysis Feature
- [x] Create competitor comparison database schema
- [x] Build competitor analysis page UI
- [x] Add side-by-side product/channel comparison view
- [x] Calculate sentiment comparison across competitors
- [x] Identify unique selling points and gaps
- [x] Generate competitive positioning recommendations
- [ ] Add competitor tracking with alerts for new reviews/comments

## Playlist Persistence Feature

### Database Schema
- [x] Create saved_playlists table (playlistId, userId, title, thumbnailUrl, videoCount, lastRunAt, createdAt)
- [x] Create playlist_runs table (playlistId, runId, runAt, videosAnalyzed, commentsCollected)
- [x] Link existing videos/comments to playlist runs for historical tracking

### API Routes
- [x] Add savePlaylist mutation to save playlist after analysis
- [x] Add getSavedPlaylists query to list user's saved playlists
- [x] Add getPlaylistRuns query to get run history for a playlist
- [x] Add deletePlaylist mutation to remove saved playlists
- [x] Add refreshPlaylist mutation to re-run analysis and update timestamp

### UI Updates
- [x] Add "Save to Library" button on analysis results page
- [x] Display saved playlists in sidebar under Library section
- [x] Show last run timestamp on playlist cards
- [x] Add playlist detail page showing run history and results
- [x] Add "Refresh" button to re-run analysis on saved playlists
- [x] Preserve analysis results when navigating back

### User Experience
- [ ] Auto-save playlist option after successful analysis
- [x] Show notification when playlist is saved
- [x] Display relative timestamps (e.g., "Last run 2 hours ago")
- [ ] Allow renaming saved playlists

## Bug Fixes

### YouTube URL Parser
- [x] Fix parser to handle youtube.com/?list=PLAYLIST_ID format
- [x] Support playlist URLs without /playlist path

### Expanded YouTube URL Support
- [x] Add support for all YouTube video URL formats
- [x] Support music.youtube.com URLs
- [x] Support youtube-nocookie.com embed URLs
- [x] Support URLs with additional query parameters

### Auto-Save Playlists Feature
- [x] Add auto-save toggle setting in user preferences
- [x] Automatically save playlists after successful analysis
- [x] Show auto-save status indicator during analysis
- [x] Allow users to opt-out of auto-save per analysis

## Enhanced Playlist Timestamps & Scheduled Refresh

### Detailed Timestamps
- [x] Show full date and time of last analysis run
- [x] Display relative time (e.g., "2 hours ago") with full timestamp on hover
- [x] Add "Next scheduled run" indicator for scheduled playlists

### Scheduled Refresh Feature
- [x] Add refresh_schedule column to saved_playlists table (none, daily, weekly)
- [x] Add next_refresh_at column to track when next refresh should occur
- [x] Create API route to update playlist refresh schedule
- [x] Create API route to get playlists due for refresh
- [x] Build scheduled refresh settings UI in playlist detail page
- [ ] Add schedule indicator badge on playlist cards in sidebar

### Amazon Research Bug Fix
- [x] Fix Amazon search not returning results
- [x] Ensure sample data is returned when no API key configured
- [x] Debug getProduct and getReviews mutations
- [x] Verify sample data generation works correctly
- [x] Test end-to-end product analysis flow

### Reddit Research Bug Fix
- [x] Fix Reddit 403 error - API requires authentication
- [x] Add sample data fallback for Reddit when API fails

### YouTube URL Parser Bug (Recurring)
- [x] Fix youtube.com/?list= format still not working - fixed client-side parser in BulkAnalyze.tsx
- [x] Debug parseYouTubeInput function - server-side was working, client-side needed update

## TikTok Intelligence & Enhanced Comments

### TikTok Intelligence Tool
- [x] Create TikTok database tables (videos, creators, comments)
- [x] Build TikTok URL parser for video links
- [x] Create TikTok API service with sample data fallback
- [x] Build TikTok Intelligence page with video search
- [x] Display video metrics (views, likes, shares, comments)
- [x] Show creator profile and engagement stats
- [x] Analyze trending sounds and hashtags
- [x] Add to sidebar navigation under Tools

### Enhanced YouTube Video Metadata
- [ ] Display all video metadata fields (duration, definition, dimension, caption, licensedContent)
- [ ] Show parent channel full details (subscribers, total videos, join date)
- [ ] Display video statistics (views, likes, comments, favorites)
- [ ] Show video tags and category
- [ ] Display publish date and last updated
- [ ] Add thumbnail preview options (default, medium, high, maxres)

### Split-Pane CSV Comment View
- [x] Create split-pane layout with video metadata on left, comments on right
- [x] Display comments in sortable table/CSV format
- [x] Add column sorting (date, likes, replies, sentiment)
- [x] Implement quick scroll with keyboard navigation
- [x] Add row selection for bulk operations

### Comment Quick Actions
- [x] Add one-click copy button for each comment
- [x] Implement highlight/bookmark feature for important comments
- [x] Add "Save to Collection" option for future reference
- [x] Enable multi-select for bulk copy/export
- [x] Add export selected comments to CSV/clipboard
- [x] Show copy confirmation toast

## Split View Enhancements & Saved Comments

### Keyword/Sentiment Filtering in Split View
- [x] Add keyword filter input to search within comments
- [x] Implement sentiment filter dropdown (positive, negative, neutral, all)
- [x] Add sentiment analysis to comments using AI
- [x] Display sentiment badge on each comment row
- [x] Allow combining keyword and sentiment filters

### Saved Comments Page
- [ ] Create SavedComments page component
- [ ] Add route and sidebar navigation link
- [ ] Display all saved/bookmarked comments across videos
- [ ] Group comments by source video
- [ ] Add bulk delete and export options
- [ ] Enable editing notes on saved comments
- [ ] Add filter by source (YouTube, Amazon, Reddit, TikTok)

### AI Topic/Theme Summarization
- [ ] Add "Generate Summary" button to Split View
- [ ] Create AI prompt to extract key topics and themes
- [ ] Display summary in a collapsible panel
- [ ] Show top themes with comment counts
- [ ] Extract common pain points and suggestions
- [ ] Allow regenerating summary with different focus

## Comment Collections & Advanced NLP

### Comment Collections Feature
- [x] Create collections database table (id, userId, name, description, color, createdAt)
- [x] Add collectionId foreign key to savedComments table
- [x] Create API routes for collection CRUD operations
- [x] Build collection management UI (create, rename, delete, change color)
- [x] Add collection selector when saving comments
- [x] Display comments grouped by collection in Saved Comments page
- [ ] Enable drag-and-drop to move comments between collections
- [x] Add collection filtering in Saved Comments page

### Advanced NLP Integration
- [x] Integrate with Forge API for advanced text analysis
- [x] Implement advanced sentiment analysis with confidence scores
- [x] Add topic modeling using keyword extraction and clustering
- [x] Generate AI-powered summaries of comment themes
- [x] Extract named entities (products, features, competitors)
- [x] Identify common questions and pain points automatically
- [ ] Add sentiment trend visualization over time

## Drag-and-Drop & Collection Sharing

### Drag-and-Drop Comment Reordering
- [x] Add sortOrder column to savedComments table
- [x] Install and configure dnd-kit library for drag-and-drop
- [x] Create draggable comment rows in Saved Comments page
- [x] Implement reorder logic to update sortOrder on drop
- [x] Add visual drag handle and drop indicators
- [x] Persist sort order to database on reorder

### Shareable Collection Links
- [x] Add shareToken column to commentCollections table
- [x] Add isPublic boolean column to commentCollections table
- [x] Create API route to generate unique share token
- [x] Create public collection view page (no auth required)
- [x] Add "Share Collection" button with copy link functionality
- [x] Show share status indicator on collection cards
- [x] Allow revoking share access

## Embedded YouTube Browser/Player Feature
- [x] Create YouTubeBrowser component with iframe embedding
- [x] Add search bar for YouTube video search within the app
- [x] Implement video selection and playback in embedded player
- [x] Add toggle button to show/hide YouTube browser panel
- [x] Create side-by-side layout for browser + analysis workspace
- [x] Add "Analyze This Video" quick action button
- [x] Preserve YouTube login session in embedded browser
- [x] Add video URL extraction from embedded player for analysis

## AI Content Creation Tools (Functional Generators)

### Core Infrastructure
- [x] Create content templates database table for storing generated content
- [x] Create AI prompts knowledge base table with expert prompts
- [x] Build content generator base component with saved content selection
- [x] Add content type router and navigation

### Advertorial Generator
- [x] Create Advertorial generator page with story selection
- [x] Add expert AI prompts for top 1% advertorials
- [x] Implement AIDA/PAS framework options
- [x] Add testimonial and pain point integration
- [x] Include CRO best practices checklist

### VSL Script Generator
- [x] Create VSL Script generator page
- [x] Add expert prompts for high-converting VSL scripts
- [x] Implement hook, story, offer structure
- [x] Add emotional trigger integration from comments
- [x] Include timing and pacing guidelines

### UGC Scenario Generator
- [x] Create UGC Scenario generator page
- [x] Add prompts for authentic UGC scripts
- [x] Implement problem-solution-result format
- [x] Add real comment integration for authenticity
- [x] Include platform-specific variations (TikTok, IG, YouTube)

### Course Outline Generator
- [x] Create Course Outline generator page
- [x] Add prompts for comprehensive course structures
- [x] Implement module and lesson breakdown
- [x] Extract learning objectives from pain points
- [x] Include bonus and upsell suggestions

### Ad Copy Generator
- [x] Create Ad Copy generator page
- [x] Add prompts for high-CTR ad copy
- [x] Implement headline, body, CTA variations
- [x] Add platform-specific formats (FB, Google, YouTube)
- [x] Include A/B testing variations

### Sales Page Generator
- [x] Create Sales Page generator page
- [x] Add prompts for high-converting sales pages
- [x] Implement full page structure (hero, benefits, proof, offer, FAQ)
- [x] Add testimonial and objection handling sections
- [x] Include CRO optimization checklist

### Email Sequence Generator
- [x] Create Email Sequence generator page
- [x] Add prompts for nurture and sales sequences
- [x] Implement welcome, value, pitch, urgency structure
- [x] Add subject line variations
- [x] Include open rate optimization tips

### Product Ideas Generator
- [x] Create Product Ideas generator page
- [x] Add prompts for product ideation from "I wish" comments
- [x] Implement market validation framework
- [x] Add pricing and positioning suggestions
- [x] Include MVP feature recommendations

### Knowledge Base & SOPs
- [x] Create CRO best practices knowledge base
- [x] Add conversion optimization checklist
- [x] Include copywriting frameworks (AIDA, PAS, BAB, 4Ps)
- [x] Add industry benchmarks and targets
- [x] Create SOP templates for each content type

## Content Templates & Versioning Feature

### Reusable Templates Library
- [x] Create savedTemplates database table (name, contentType, variables, baseContent, userId)
- [x] Build template save dialog with name and variable extraction
- [x] Create Templates Library page with search and filter
- [x] Implement template loading with variable replacement
- [x] Add template categories and tags
- [ ] Enable template sharing between users

### Content Versioning System
- [x] Create contentVersions database table (contentId, version, content, notes, metrics)
- [x] Add version history panel to generated content view
- [x] Implement A/B test tracking with performance metrics
- [x] Add version comparison view (diff between versions)
- [x] Enable version rollback functionality
- [x] Add notes and annotations to versions

### Export to External Tools
- [x] Implement Google Docs export via API
- [x] Implement Notion export via MCP integration
- [x] Add export format options (plain text, markdown, rich text)
- [x] Create export history tracking
- [x] Add batch export functionality

## Batch Export Feature
- [x] Add batch export API endpoint to handle multiple content items
- [x] Create batch export UI with multi-select checkboxes
- [x] Support export formats: Markdown, TXT, HTML, JSON
- [x] Add select all / deselect all functionality
- [x] Show selection summary with word count
- [x] Generate combined document or individual files
- [x] Track batch exports in export history

## Batch Export Google Docs & Notion Integration
- [x] Add Google Docs destination option to batch export
- [x] Add Notion destination option to batch export
- [x] Create combined document in Google Docs with all selected content
- [x] Create Notion page with all selected content organized by sections
- [x] Update batch export UI with destination selector (File, Google Docs, Notion)
- [x] Add destination-specific UI hints and instructions
- [x] Track cloud exports in export history

## A/B Test Winner Auto-Detection
- [x] Create algorithm to calculate winner based on CTR and conversion rate
- [x] Add statistical significance calculation for A/B tests
- [x] Display winner badge (crown/trophy icon) on best-performing version
- [x] Add winner summary showing performance metrics comparison
- [x] Highlight winning version in version history panel
- [x] Add "Declare Winner" manual override option
- [x] Show confidence level for auto-detected winners

## Scheduled Content Refresh
- [x] Create content_schedules database table (templateId, frequency, lastRunAt, nextRunAt, status)
- [x] Add schedule configuration UI to templates
- [x] Implement scheduler service for automatic re-generation
- [x] Support daily, weekly, and monthly refresh frequencies
- [x] Send notification when content is refreshed
- [x] Track refresh history with version comparison
- [x] Add pause/resume schedule functionality

## Team Collaboration & Template Sharing
- [x] Add sharing permissions to savedTemplates table (isPublic, sharedWith)
- [x] Create template sharing dialog with user search
- [x] Implement permission levels (view, edit, duplicate)
- [x] Add "Shared with me" section in templates library
- [x] Create public template gallery for community sharing
- [x] Add template usage analytics (views, uses, duplicates)
- [x] Enable collaborative editing with version tracking

## Schedule Goals Feature
- [x] Add goal field to contentSchedules table (goalType, targetMetric, targetValue)
- [x] Create goal type options (improve_ctr, increase_conversions, boost_engagement, reduce_bounce)
- [x] Add goal configuration UI to schedule creation dialog
- [x] Display goal progress tracking in schedules tab
- [x] Show goal achievement status (on track, behind, achieved)
- [x] Generate AI suggestions to improve content based on goal

## Template Comments & Discussion
- [x] Create templateComments database table (templateId, userId, content, parentId, createdAt)
- [x] Add comments section to shared template view
- [x] Implement threaded replies for discussions
- [ ] Add @mention functionality for team members
- [x] Show comment count on template cards
- [ ] Add notification when someone comments on your template

## Competitor Analysis Feature
- [x] Create competitors database table (name, website, industry, description)
- [x] Create competitorProducts table (competitorId, productName, price, features, positioning)
- [x] Create competitorContent table (competitorId, contentType, url, analysis)
- [x] Build Competitor Analysis page with competitor management
- [x] Add competitor product/service comparison matrix
- [x] Implement content gap analysis (what competitors cover that you don't)
- [x] Add pricing comparison visualization
- [x] Generate competitive positioning recommendations
- [x] Track competitor content updates and changes
- [x] Add SWOT analysis generator for each competitor

## YouTube Channel Comparison Feature
- [x] Create YouTube channel comparison UI in Competitor Analysis page
- [x] Add channel input fields for comparing multiple channels
- [x] Fetch channel statistics (subscribers, views, video count)
- [x] Compare engagement metrics across channels
- [x] Analyze content themes and posting frequency
- [x] Show audience sentiment comparison from comments
- [x] Generate competitive insights and recommendations
- [x] Add channel performance visualization charts

## Competitor Tracking Alerts Feature
- [x] Create competitorAlerts database table (competitorId, alertType, threshold, enabled)
- [x] Create alertHistory database table (alertId, triggeredAt, details, read)
- [x] Add alert configuration UI for each competitor
- [x] Implement new content detection alerts
- [x] Implement review/rating change alerts
- [x] Implement significant metric change alerts
- [x] Add notification bell icon with unread count
- [x] Create alerts management page
- [x] Send in-app notifications when alerts trigger


## Competitor Content Calendar Feature
- [x] Create competitorContentCalendar database table for tracking competitor posts
- [x] Build calendar view component with month/week/day views
- [x] Display competitor posts on calendar with color coding by competitor
- [x] Show posting frequency patterns and optimal posting times
- [x] Add content gap analysis visualization (insights tab)
- [x] Enable filtering by competitor, content type, and date range
- [x] Add click-to-view content details

## Automated Competitor Reports Feature
- [x] Create competitorReports database table for storing generated reports
- [x] Build markdown report generation with competitor summary
- [x] Include performance metrics comparison
- [x] Add SWOT analysis section to reports
- [x] Include AI-generated executive summary
- [x] Add strategic recommendations section
- [x] Enable scheduled report generation (weekly/biweekly/monthly/quarterly)
- [x] Add report scheduling with email notification options


## YouTube Channel Auto-Import Feature
- [x] Add "Import from YouTube" button to Competitor Calendar
- [x] Create backend procedure to fetch competitor's YouTube channel videos
- [x] Auto-populate calendar with fetched videos (title, publish date, views, likes)
- [x] Add sync status indicator showing last import time
- [x] Enable periodic auto-refresh option for competitor channels
- [x] Map YouTube video data to calendar entry format

## Content Gap Analysis Dashboard
- [x] Create new ContentGapAnalysis page component
- [x] Add navigation link in sidebar under Tools
- [x] Build topic coverage comparison visualization
- [x] Show content type distribution comparison (shorts vs long-form, tutorials vs vlogs)
- [x] Display optimal posting times based on competitor success patterns
- [x] Add engagement benchmarks comparison chart
- [x] Include AI-generated gap recommendations
- [x] Enable filtering by competitor and time range

## Competitor YouTube Channel Linking Wizard
- [x] Search for YouTube channels by name or URL from Competitor Analysis
- [x] Auto-detect channel ID from various URL formats (@handle, /channel/UC..., /c/name)
- [x] Preview channel info (subscribers, video count, recent uploads) before linking
- [x] One-click link to competitor profile
- [x] 3-step wizard flow: Search → Preview → Link

## Content Strategy Integration
- [x] Add "Generate Content for This Gap" button on content gaps in Overview tab
- [x] Add "Generate Content" buttons on all opportunities in Opportunities tab
- [x] Pre-fill Content Generator with topic and competitor benchmarks via URL params
- [x] Add "Inspired by Gap Analysis" banner in Content Generator when navigated from gaps
- [x] Connect high-priority and medium-priority opportunities to Content Generator
- [x] Connect topic opportunities to Content Generator with competitor context
