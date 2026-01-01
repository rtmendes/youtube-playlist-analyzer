ALTER TABLE `commentCollections` ADD `isPublic` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `commentCollections` ADD `shareToken` varchar(64);--> statement-breakpoint
ALTER TABLE `savedComments` ADD `sortOrder` int DEFAULT 0;