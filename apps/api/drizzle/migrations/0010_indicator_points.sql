CREATE TABLE `indicator_points` (
	`series` text NOT NULL,
	`period` text NOT NULL,
	`value` real NOT NULL,
	`source` text NOT NULL,
	`fetched_at` text NOT NULL,
	PRIMARY KEY(`series`, `period`)
);
