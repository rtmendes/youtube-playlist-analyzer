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
