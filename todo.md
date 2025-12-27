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
