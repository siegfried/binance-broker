CREATE TABLE `account` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`api_key` text NOT NULL,
	`secret` text NOT NULL,
	`budget` real NOT NULL,
	`interval` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_name_unique` ON `account` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `account_api_key_unique` ON `account` (`api_key`);--> statement-breakpoint
CREATE TABLE `order_attempt` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`signal_id` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`client_order_id` text,
	`status` text NOT NULL,
	`result` text,
	FOREIGN KEY (`signal_id`) REFERENCES `signal`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `order_attempt_signal_id_index` ON `order_attempt` (`signal_id`);--> statement-breakpoint
CREATE INDEX `order_client_order_id_index` ON `order_attempt` (`client_order_id`);--> statement-breakpoint
CREATE TABLE `signal` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`client_order_id` text NOT NULL,
	`timestamp` integer NOT NULL,
	`symbol` text NOT NULL,
	`price` real NOT NULL,
	`type` text NOT NULL,
	`side` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `account`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `signal_account_id_index` ON `signal` (`account_id`);--> statement-breakpoint
CREATE INDEX `signal_client_order_id_index` ON `signal` (`client_order_id`);--> statement-breakpoint
CREATE INDEX `signal_timestamp_index` ON `signal` (`timestamp`);