CREATE TABLE `geo_hits` (
	`day` text NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`hits` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`day`, `kind`, `name`, `path`)
);
