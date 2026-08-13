CREATE TABLE `learnerAchievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`claimKey` varchar(128) NOT NULL,
	`userId` int NOT NULL,
	`badgeKey` varchar(64) NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learnerAchievements_id` PRIMARY KEY(`id`),
	CONSTRAINT `learnerAchievements_claimKey_unique` UNIQUE(`claimKey`)
);
--> statement-breakpoint
CREATE TABLE `learnerDailyActivities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityKey` varchar(96) NOT NULL,
	`userId` int NOT NULL,
	`dateKey` varchar(10) NOT NULL,
	`questionsAnswered` int NOT NULL DEFAULT 0,
	`correctCount` int NOT NULL DEFAULT 0,
	`roundsCompleted` int NOT NULL DEFAULT 0,
	`xpEarned` int NOT NULL DEFAULT 0,
	`completedMinimum` int NOT NULL DEFAULT 0,
	`recoveryAction` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learnerDailyActivities_id` PRIMARY KEY(`id`),
	CONSTRAINT `learnerDailyActivities_activityKey_unique` UNIQUE(`activityKey`)
);
--> statement-breakpoint
CREATE TABLE `learnerPushSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`endpointHash` varchar(128) NOT NULL,
	`userId` int NOT NULL,
	`subscriptionJson` text NOT NULL,
	`enabled` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learnerPushSubscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `learnerPushSubscriptions_endpointHash_unique` UNIQUE(`endpointHash`)
);
--> statement-breakpoint
CREATE TABLE `learnerReminderPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enabled` int NOT NULL DEFAULT 0,
	`reminderTime` varchar(5) NOT NULL DEFAULT '19:00',
	`scheduleCronTaskUid` varchar(65),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learnerReminderPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `learnerReminderPreferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `learnerSystems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dailyMinimum` int NOT NULL DEFAULT 10,
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`comebackXp` int NOT NULL DEFAULT 0,
	`level` int NOT NULL DEFAULT 1,
	`lastCompletedDate` varchar(10),
	`recoveryPending` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learnerSystems_id` PRIMARY KEY(`id`),
	CONSTRAINT `learnerSystems_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `learnerProfiles` MODIFY COLUMN `targetScore` int NOT NULL DEFAULT 380;--> statement-breakpoint
ALTER TABLE `learnerProfiles` ADD `timeZone` varchar(64) DEFAULT 'Africa/Lagos' NOT NULL;--> statement-breakpoint
ALTER TABLE `learnerAchievements` ADD CONSTRAINT `learnerAchievements_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learnerDailyActivities` ADD CONSTRAINT `learnerDailyActivities_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learnerPushSubscriptions` ADD CONSTRAINT `learnerPushSubscriptions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learnerReminderPreferences` ADD CONSTRAINT `learnerReminderPreferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learnerSystems` ADD CONSTRAINT `learnerSystems_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;