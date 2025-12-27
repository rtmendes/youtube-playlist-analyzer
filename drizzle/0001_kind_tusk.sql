CREATE TABLE `analysisSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`playlistId` int,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`videosFetched` int DEFAULT 0,
	`commentsFetched` int DEFAULT 0,
	`errorMessage` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `analysisSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`youtubeId` varchar(64) NOT NULL,
	`videoId` int,
	`parentCommentId` int,
	`authorChannelId` varchar(64),
	`authorDisplayName` text,
	`authorProfileImageUrl` text,
	`textDisplay` text,
	`textOriginal` text,
	`likeCount` int DEFAULT 0,
	`replyCount` int DEFAULT 0,
	`publishedAt` timestamp,
	`updatedAt` timestamp,
	`rawData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comments_id` PRIMARY KEY(`id`),
	CONSTRAINT `comments_youtubeId_unique` UNIQUE(`youtubeId`)
);
--> statement-breakpoint
CREATE TABLE `playlists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`youtubeId` varchar(64) NOT NULL,
	`title` text,
	`description` text,
	`channelId` varchar(64),
	`channelTitle` text,
	`thumbnailUrl` text,
	`videoCount` int DEFAULT 0,
	`publishedAt` timestamp,
	`rawData` json,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playlists_id` PRIMARY KEY(`id`),
	CONSTRAINT `playlists_youtubeId_unique` UNIQUE(`youtubeId`)
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`youtubeId` varchar(64) NOT NULL,
	`playlistId` int,
	`title` text,
	`description` text,
	`channelId` varchar(64),
	`channelTitle` text,
	`thumbnailUrl` text,
	`duration` varchar(32),
	`viewCount` bigint DEFAULT 0,
	`likeCount` bigint DEFAULT 0,
	`commentCount` bigint DEFAULT 0,
	`publishedAt` timestamp,
	`tags` json,
	`rawData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videos_id` PRIMARY KEY(`id`),
	CONSTRAINT `videos_youtubeId_unique` UNIQUE(`youtubeId`)
);
