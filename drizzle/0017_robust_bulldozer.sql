ALTER TABLE `publicChallenges` ADD `visibility` enum('link_only','public') DEFAULT 'link_only' NOT NULL;--> statement-breakpoint
ALTER TABLE `publicChallenges` ADD `description` varchar(240);--> statement-breakpoint
ALTER TABLE `publicChallenges` ADD `expiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `publicChallenges` ADD `lastActivityAt` timestamp DEFAULT (now()) NOT NULL;