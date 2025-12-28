ALTER TABLE `savedPlaylists` ADD `refreshSchedule` enum('none','daily','weekly') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `savedPlaylists` ADD `nextRefreshAt` timestamp;--> statement-breakpoint
ALTER TABLE `savedPlaylists` ADD `refreshHour` int DEFAULT 9;--> statement-breakpoint
ALTER TABLE `savedPlaylists` ADD `refreshDayOfWeek` int DEFAULT 1;