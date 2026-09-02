CREATE TABLE `ownerQuestionCorrections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`questionItemId` int NOT NULL,
	`ownerUserId` int NOT NULL,
	`beforeJson` text NOT NULL,
	`afterJson` text NOT NULL,
	`changedFieldsJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ownerQuestionCorrections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ownerQuestionCorrections` ADD CONSTRAINT `ownerQuestionCorrections_questionItemId_questionItems_id_fk` FOREIGN KEY (`questionItemId`) REFERENCES `questionItems`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ownerQuestionCorrections` ADD CONSTRAINT `ownerQuestionCorrections_ownerUserId_users_id_fk` FOREIGN KEY (`ownerUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;