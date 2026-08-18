CREATE TABLE `learnerProviderReminderQueue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`queueKey` varchar(128) NOT NULL,
	`userId` int NOT NULL,
	`window` enum('morning','afternoon','evening') NOT NULL,
	`scheduledFor` timestamp NOT NULL,
	`oneSignalMessageId` varchar(128) NOT NULL,
	`status` enum('scheduled','cancelled','failed') NOT NULL DEFAULT 'scheduled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learnerProviderReminderQueue_id` PRIMARY KEY(`id`),
	CONSTRAINT `learnerProviderReminderQueue_queueKey_unique` UNIQUE(`queueKey`)
);
--> statement-breakpoint
ALTER TABLE `learnerProviderReminderQueue` ADD CONSTRAINT `learnerProviderReminderQueue_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;