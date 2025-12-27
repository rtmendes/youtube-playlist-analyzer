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
