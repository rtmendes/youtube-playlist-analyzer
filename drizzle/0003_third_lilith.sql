CREATE TABLE `commentInsights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`commentId` varchar(64) NOT NULL,
	`videoId` varchar(64),
	`videoTitle` text,
	`authorName` text,
	`commentText` text,
	`likeCount` int DEFAULT 0,
	`replyCount` int DEFAULT 0,
	`category` enum('personal_story','testimonial','product_request','pain_point','humor','question','praise','criticism','suggestion','other') NOT NULL DEFAULT 'other',
	`sentimentScore` int DEFAULT 0,
	`marketingPotential` int DEFAULT 0,
	`extractedInsights` json,
	`suggestedUses` json,
	`isSelected` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commentInsights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`color` varchar(7) DEFAULT '#3B82F6',
	`parentFolderId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generatedAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`type` enum('advertorial','vsl_script','ugc_scenario','ebook_outline','course_structure','ad_copy','sales_page','product_offer','email_sequence','social_post','testimonial_formatted','custom') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text,
	`sourceCommentIds` json,
	`generationPrompt` text,
	`metadata` json,
	`isFavorite` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `generatedAssets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectTags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`tagId` int NOT NULL,
	CONSTRAINT `projectTags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`folderId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`analysisSessionId` int,
	`searchQueries` json,
	`selectedComments` json,
	`audienceInsights` json,
	`psychographicProfile` json,
	`canvasState` json,
	`generatedAssets` json,
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(7) DEFAULT '#6366F1',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tags_id` PRIMARY KEY(`id`)
);
