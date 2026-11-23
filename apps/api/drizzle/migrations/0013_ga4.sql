CREATE TABLE `ga4_daily` (
	`day` text PRIMARY KEY NOT NULL,
	`users` integer NOT NULL,
	`sessions` integer NOT NULL,
	`page_views` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ga4_pages` (
	`day` text NOT NULL,
	`path` text NOT NULL,
	`views` integer NOT NULL,
	PRIMARY KEY(`day`, `path`)
);
--> statement-breakpoint
CREATE TABLE `ga4_sources` (
	`day` text NOT NULL,
	`source` text NOT NULL,
	`medium` text NOT NULL,
	`campaign` text NOT NULL,
	`sessions` integer NOT NULL,
	`users` integer NOT NULL,
	PRIMARY KEY(`day`, `source`, `medium`, `campaign`)
);
