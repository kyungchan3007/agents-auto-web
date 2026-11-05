CREATE TABLE `gsc_daily` (
	`day` text PRIMARY KEY NOT NULL,
	`clicks` integer NOT NULL,
	`impressions` integer NOT NULL,
	`position` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `gsc_sync` (
	`id` integer PRIMARY KEY NOT NULL,
	`synced_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `gsc_top` (
	`kind` text NOT NULL,
	`key` text NOT NULL,
	`clicks` integer NOT NULL,
	`impressions` integer NOT NULL,
	`position` real NOT NULL,
	PRIMARY KEY(`kind`, `key`)
);
