CREATE TABLE `contentVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentTemplateId` int NOT NULL,
	`userId` int NOT NULL,
	`versionNumber` int NOT NULL DEFAULT 1,
	`versionName` varchar(128),
	`content` text NOT NULL,
	`changeNotes` text,
	`changeSummary` varchar(255),
	`isAbTest` boolean DEFAULT false,
	`abTestName` varchar(128),
	`abTestVariant` varchar(32),
	`metrics` json,
	`status` enum('draft','active','testing','winner','archived') DEFAULT 'draft',
	`annotations` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contentVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exportHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contentTemplateId` int,
	`contentVersionId` int,
	`destination` enum('google_docs','notion','clipboard','markdown_file','pdf','word') NOT NULL,
	`exportFormat` varchar(32),
	`externalUrl` text,
	`externalId` varchar(255),
	`title` varchar(255),
	`contentPreview` text,
	`wordCount` int,
	`status` enum('pending','success','failed') DEFAULT 'pending',
	`errorMessage` text,
	`exportedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exportHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`contentType` enum('advertorial','vsl_script','ugc_scenario','course_outline','ad_copy','sales_page','email_sequence','product_idea') NOT NULL,
	`templateContent` text NOT NULL,
	`variables` json,
	`frameworkUsed` varchar(64),
	`tone` varchar(64),
	`category` varchar(64),
	`tags` json,
	`useCount` int DEFAULT 0,
	`lastUsedAt` timestamp,
	`isPublic` boolean DEFAULT false,
	`isFavorite` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedTemplates_id` PRIMARY KEY(`id`)
);
