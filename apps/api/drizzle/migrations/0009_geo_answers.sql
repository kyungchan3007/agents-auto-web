CREATE TABLE `geo_answers` (
	`day` text NOT NULL,
	`engine` text NOT NULL,
	`question` text NOT NULL,
	`status` text NOT NULL,
	`cited` integer DEFAULT 0 NOT NULL,
	`found` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`day`, `engine`, `question`)
);
