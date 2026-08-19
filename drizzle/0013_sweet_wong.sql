CREATE TABLE `learnerQuestionReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportKey` varchar(320) NOT NULL,
	`userId` int NOT NULL,
	`questionId` varchar(128) NOT NULL,
	`subject` varchar(48) NOT NULL,
	`topic` varchar(160) NOT NULL,
	`reason` enum('wrong_answer','missing_context','broken_diagram','confusing_wording','other') NOT NULL,
	`note` varchar(500),
	`status` enum('new','reviewed','resolved') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learnerQuestionReports_id` PRIMARY KEY(`id`),
	CONSTRAINT `learnerQuestionReports_reportKey_unique` UNIQUE(`reportKey`)
);
--> statement-breakpoint
ALTER TABLE `learnerQuestionReports` ADD CONSTRAINT `learnerQuestionReports_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;