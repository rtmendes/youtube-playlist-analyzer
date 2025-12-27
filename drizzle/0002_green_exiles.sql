ALTER TABLE `analysisSessions` ADD `name` varchar(255);--> statement-breakpoint
ALTER TABLE `analysisSessions` ADD `inputUrls` text;--> statement-breakpoint
ALTER TABLE `analysisSessions` ADD `totalViews` bigint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `analysisSessions` ADD `totalLikes` bigint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `analysisSessions` ADD `videosData` json;--> statement-breakpoint
ALTER TABLE `analysisSessions` ADD `commentsData` json;