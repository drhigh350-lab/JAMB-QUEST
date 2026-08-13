CREATE TABLE `projectPushConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configKey` varchar(64) NOT NULL,
	`publicKey` text NOT NULL,
	`privateKey` text NOT NULL,
	`subject` varchar(320) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectPushConfigs_id` PRIMARY KEY(`id`),
	CONSTRAINT `projectPushConfigs_configKey_unique` UNIQUE(`configKey`)
);
