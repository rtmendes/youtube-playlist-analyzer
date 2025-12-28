CREATE TABLE `savedComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourceType` enum('youtube','amazon','reddit','tiktok') NOT NULL,
	`sourceId` varchar(128) NOT NULL,
	`commentId` varchar(128) NOT NULL,
	`authorName` varchar(256),
	`text` text NOT NULL,
	`highlighted` boolean DEFAULT false,
	`notes` text,
	`tags` json,
	`collectionName` varchar(128),
	`savedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tiktokComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commentId` varchar(64) NOT NULL,
	`videoId` varchar(64) NOT NULL,
	`authorUniqueId` varchar(128),
	`authorNickname` varchar(256),
	`authorAvatarUrl` text,
	`text` text,
	`diggCount` bigint DEFAULT 0,
	`replyCount` int DEFAULT 0,
	`sentiment` enum('positive','negative','neutral','mixed'),
	`sentimentScore` decimal(5,4),
	`createTime` timestamp,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tiktokComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tiktokCreators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uniqueId` varchar(128) NOT NULL,
	`nickname` varchar(256),
	`avatarUrl` text,
	`signature` text,
	`verified` boolean DEFAULT false,
	`followerCount` bigint DEFAULT 0,
	`followingCount` bigint DEFAULT 0,
	`heartCount` bigint DEFAULT 0,
	`videoCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tiktokCreators_id` PRIMARY KEY(`id`),
	CONSTRAINT `tiktokCreators_uniqueId_unique` UNIQUE(`uniqueId`)
);
--> statement-breakpoint
CREATE TABLE `tiktokVideos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` varchar(64) NOT NULL,
	`creatorId` int,
	`creatorUniqueId` varchar(128),
	`description` text,
	`coverUrl` text,
	`videoUrl` text,
	`duration` int,
	`playCount` bigint DEFAULT 0,
	`diggCount` bigint DEFAULT 0,
	`shareCount` bigint DEFAULT 0,
	`commentCount` bigint DEFAULT 0,
	`collectCount` bigint DEFAULT 0,
	`musicId` varchar(64),
	`musicTitle` varchar(256),
	`musicAuthor` varchar(256),
	`hashtags` json,
	`createTime` timestamp,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tiktokVideos_id` PRIMARY KEY(`id`),
	CONSTRAINT `tiktokVideos_videoId_unique` UNIQUE(`videoId`)
);
