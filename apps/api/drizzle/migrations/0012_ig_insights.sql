CREATE TABLE `ig_account_insights` (
	`day` text NOT NULL,
	`metric` text NOT NULL,
	`value` integer NOT NULL,
	PRIMARY KEY(`day`, `metric`)
);
--> statement-breakpoint
CREATE TABLE `ig_media` (
	`media_id` text PRIMARY KEY NOT NULL,
	`posted_at` text NOT NULL,
	`permalink` text NOT NULL,
	`kind` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ig_media_insights` (
	`day` text NOT NULL,
	`media_id` text NOT NULL,
	`metric` text NOT NULL,
	`value` integer NOT NULL,
	PRIMARY KEY(`day`, `media_id`, `metric`)
);
