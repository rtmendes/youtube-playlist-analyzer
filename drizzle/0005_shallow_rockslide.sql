CREATE TABLE `playlistRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`savedPlaylistId` int NOT NULL,
	`videosAnalyzed` int DEFAULT 0,
	`commentsCollected` int DEFAULT 0,
	`newVideos` int DEFAULT 0,
	`newComments` int DEFAULT 0,
	`status` enum('running','completed','failed') NOT NULL DEFAULT 'running',
	`errorMessage` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `playlistRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playlistVideos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`savedPlaylistId` int NOT NULL,
	`videoYoutubeId` varchar(64) NOT NULL,
	`videoTitle` text,
	`thumbnailUrl` text,
	`viewCount` bigint DEFAULT 0,
	`likeCount` bigint DEFAULT 0,
	`commentCount` bigint DEFAULT 0,
	`publishedAt` timestamp,
	`firstSeenAt` timestamp NOT NULL DEFAULT (now()),
	`lastCommentFetchAt` timestamp,
	CONSTRAINT `playlistVideos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedPlaylists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`youtubePlaylistId` varchar(64) NOT NULL,
	`title` text,
	`description` text,
	`channelTitle` text,
	`thumbnailUrl` text,
	`videoCount` int DEFAULT 0,
	`lastRunAt` timestamp,
	`lastVideoCount` int DEFAULT 0,
	`lastCommentCount` int DEFAULT 0,
	`autoRefresh` int DEFAULT 0,
	`refreshInterval` int DEFAULT 24,
	`status` enum('active','paused','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedPlaylists_id` PRIMARY KEY(`id`)
);
