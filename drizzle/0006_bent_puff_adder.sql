ALTER TABLE `quizRounds` ADD `durationSeconds` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `quizRounds` ADD `flaggedQuestionIds` text;--> statement-breakpoint
ALTER TABLE `quizRounds` ADD `answerReviewJson` text;