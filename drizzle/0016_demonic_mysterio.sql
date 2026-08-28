CREATE TABLE `challengeAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attemptToken` varchar(96) NOT NULL,
	`challengeId` int NOT NULL,
	`participantUserId` int,
	`participantName` varchar(48) NOT NULL,
	`answerJson` text NOT NULL,
	`correctCount` int NOT NULL,
	`score` int NOT NULL,
	`durationSeconds` int NOT NULL DEFAULT 0,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `challengeAttempts_id` PRIMARY KEY(`id`),
	CONSTRAINT `challengeAttempts_attemptToken_unique` UNIQUE(`attemptToken`)
);
--> statement-breakpoint
CREATE TABLE `publicChallenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeCode` varchar(16) NOT NULL,
	`creatorUserId` int NOT NULL,
	`challengeName` varchar(80) NOT NULL,
	`subjectScope` varchar(160) NOT NULL,
	`questionIdsJson` text NOT NULL,
	`questionCount` int NOT NULL,
	`status` enum('open','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`closedAt` timestamp,
	CONSTRAINT `publicChallenges_id` PRIMARY KEY(`id`),
	CONSTRAINT `publicChallenges_challengeCode_unique` UNIQUE(`challengeCode`)
);
--> statement-breakpoint
ALTER TABLE `challengeAttempts` ADD CONSTRAINT `challengeAttempts_challengeId_publicChallenges_id_fk` FOREIGN KEY (`challengeId`) REFERENCES `publicChallenges`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `challengeAttempts` ADD CONSTRAINT `challengeAttempts_participantUserId_users_id_fk` FOREIGN KEY (`participantUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `publicChallenges` ADD CONSTRAINT `publicChallenges_creatorUserId_users_id_fk` FOREIGN KEY (`creatorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;