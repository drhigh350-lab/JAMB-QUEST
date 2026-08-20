CREATE TABLE `directReminderCallbackAudits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cronTaskUid` varchar(65),
	`window` varchar(16),
	`outcome` varchar(32) NOT NULL,
	`observedUtcHour` int,
	`sent` int NOT NULL DEFAULT 0,
	`skipped` int NOT NULL DEFAULT 0,
	`totalEnabled` int NOT NULL DEFAULT 0,
	`transport` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `directReminderCallbackAudits_id` PRIMARY KEY(`id`)
);
