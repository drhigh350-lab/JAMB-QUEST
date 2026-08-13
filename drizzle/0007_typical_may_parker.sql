CREATE TABLE `learnerBookmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookmarkKey` varchar(192) NOT NULL,
	`userId` int NOT NULL,
	`questionId` varchar(128) NOT NULL,
	`subject` varchar(48) NOT NULL,
	`topic` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learnerBookmarks_id` PRIMARY KEY(`id`),
	CONSTRAINT `learnerBookmarks_bookmarkKey_unique` UNIQUE(`bookmarkKey`)
);
--> statement-breakpoint
ALTER TABLE `learnerBookmarks` ADD CONSTRAINT `learnerBookmarks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;