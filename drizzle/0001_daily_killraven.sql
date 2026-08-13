CREATE TABLE `questionItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` int NOT NULL,
	`externalId` varchar(128) NOT NULL,
	`subject` varchar(48) NOT NULL,
	`topic` varchar(160) NOT NULL,
	`difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'medium',
	`questionText` text NOT NULL,
	`optionsJson` text NOT NULL,
	`answerIndex` int NOT NULL,
	`explanation` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `questionItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `questionItems` ADD CONSTRAINT `questionItems_sourceId_questionSources_id_fk` FOREIGN KEY (`sourceId`) REFERENCES `questionSources`(`id`) ON DELETE no action ON UPDATE no action;