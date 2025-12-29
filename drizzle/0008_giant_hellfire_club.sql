CREATE TABLE `commentCollections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`color` varchar(7) DEFAULT '#6366f1',
	`icon` varchar(32) DEFAULT 'folder',
	`commentCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commentCollections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nlpAnalysisResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourceType` enum('youtube','amazon','reddit','tiktok','mixed') NOT NULL,
	`sourceId` varchar(128),
	`topics` json,
	`sentimentBreakdown` json,
	`keyThemes` json,
	`painPoints` json,
	`suggestions` json,
	`questions` json,
	`namedEntities` json,
	`summary` text,
	`commentCount` int DEFAULT 0,
	`analyzedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `nlpAnalysisResults_id` PRIMARY KEY(`id`)
);
