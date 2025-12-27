CREATE TABLE `amazonProducts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`asin` varchar(20) NOT NULL,
	`title` text,
	`description` text,
	`brand` varchar(255),
	`price` varchar(50),
	`rating` varchar(10),
	`reviewCount` int DEFAULT 0,
	`imageUrl` text,
	`productUrl` text,
	`category` varchar(255),
	`features` json,
	`rawData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `amazonProducts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `amazonReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`reviewId` varchar(64),
	`author` varchar(255),
	`rating` int,
	`title` text,
	`body` text,
	`helpfulVotes` int DEFAULT 0,
	`verified` int DEFAULT 0,
	`reviewDate` timestamp,
	`sentiment` enum('positive','neutral','negative') DEFAULT 'neutral',
	`themes` json,
	`painPoints` json,
	`praises` json,
	`rawData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `amazonReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `multiSourceInsights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`sourceType` enum('youtube','amazon','reddit') NOT NULL,
	`sourceId` varchar(64) NOT NULL,
	`sourceTitle` text,
	`authorName` text,
	`contentText` text,
	`engagementScore` int DEFAULT 0,
	`category` enum('personal_story','testimonial','product_request','pain_point','humor','question','praise','criticism','suggestion','comparison','recommendation','warning','tip','other') NOT NULL DEFAULT 'other',
	`sentiment` enum('positive','neutral','negative') DEFAULT 'neutral',
	`marketingPotential` int DEFAULT 0,
	`extractedInsights` json,
	`suggestedUses` json,
	`isSelected` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `multiSourceInsights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `redditComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`commentId` varchar(20) NOT NULL,
	`parentCommentId` varchar(20),
	`author` varchar(100),
	`body` text,
	`score` int DEFAULT 0,
	`isOp` int DEFAULT 0,
	`depth` int DEFAULT 0,
	`postedAt` timestamp,
	`sentiment` enum('positive','neutral','negative') DEFAULT 'neutral',
	`themes` json,
	`rawData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `redditComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `redditPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`postId` varchar(20) NOT NULL,
	`subreddit` varchar(100) NOT NULL,
	`title` text,
	`body` text,
	`author` varchar(100),
	`score` int DEFAULT 0,
	`upvoteRatio` varchar(10),
	`commentCount` int DEFAULT 0,
	`postUrl` text,
	`isNsfw` int DEFAULT 0,
	`flair` varchar(100),
	`mediaUrl` text,
	`postedAt` timestamp,
	`rawData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `redditPosts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `researchSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`projectId` int,
	`sourceType` enum('youtube','amazon','reddit') NOT NULL,
	`name` varchar(255),
	`searchQuery` text,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`itemsFetched` int DEFAULT 0,
	`insightsGenerated` int DEFAULT 0,
	`summary` json,
	`errorMessage` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `researchSessions_id` PRIMARY KEY(`id`)
);
