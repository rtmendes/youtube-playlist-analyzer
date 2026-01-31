CREATE TABLE `aiPromptsKnowledgeBase` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentType` enum('advertorial','vsl_script','ugc_scenario','course_outline','ad_copy','sales_page','email_sequence','product_idea') NOT NULL,
	`category` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`promptTemplate` text NOT NULL,
	`variables` json,
	`bestPractices` json,
	`examples` json,
	`useCount` int DEFAULT 0,
	`avgRating` decimal(3,2),
	`isSystem` boolean DEFAULT true,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiPromptsKnowledgeBase_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contentType` enum('advertorial','vsl_script','ugc_scenario','course_outline','ad_copy','sales_page','email_sequence','product_idea') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`sourceComments` json,
	`sourceInsights` json,
	`promptUsed` text,
	`frameworkUsed` varchar(64),
	`tone` varchar(64),
	`targetAudience` text,
	`wordCount` int DEFAULT 0,
	`version` int DEFAULT 1,
	`parentTemplateId` int,
	`isFavorite` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contentTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `copywritingFrameworks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`acronym` varchar(20) NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text NOT NULL,
	`steps` json,
	`bestFor` json,
	`templateStructure` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `copywritingFrameworks_id` PRIMARY KEY(`id`),
	CONSTRAINT `copywritingFrameworks_acronym_unique` UNIQUE(`acronym`)
);
--> statement-breakpoint
CREATE TABLE `croBestPractices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentType` varchar(64) NOT NULL,
	`section` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`doList` json,
	`dontList` json,
	`examples` json,
	`benchmarks` json,
	`priority` enum('critical','high','medium','low') DEFAULT 'medium',
	`impactScore` int DEFAULT 50,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `croBestPractices_id` PRIMARY KEY(`id`)
);
