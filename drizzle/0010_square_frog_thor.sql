ALTER TABLE `learnerSystems` ADD `dailyGoalCount` int DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE `learnerSystems` ADD `dailyGoalSubject` varchar(32);--> statement-breakpoint
ALTER TABLE `learnerSystems` ADD `dailyGoalTopic` varchar(160);