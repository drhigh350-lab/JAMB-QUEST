ALTER TABLE `learnerQuestionReports` MODIFY COLUMN `status` enum('new','reviewed','resolved','open','reviewing','dismissed') NOT NULL DEFAULT 'open';--> statement-breakpoint
UPDATE `learnerQuestionReports` SET `status` = CASE `status` WHEN 'new' THEN 'open' WHEN 'reviewed' THEN 'reviewing' ELSE `status` END;--> statement-breakpoint
ALTER TABLE `learnerQuestionReports` MODIFY COLUMN `status` enum('open','reviewing','resolved','dismissed') NOT NULL DEFAULT 'open';--> statement-breakpoint
ALTER TABLE `learnerQuestionReports` ADD `statusUpdatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `learnerQuestionReports` ADD `resolvedByUserId` int;--> statement-breakpoint
ALTER TABLE `learnerQuestionReports` ADD CONSTRAINT `learnerQuestionReports_resolvedByUserId_users_id_fk` FOREIGN KEY (`resolvedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
