CREATE TABLE `airfare_calendar` (
	`airport` text NOT NULL,
	`fetched_on` text NOT NULL,
	`depart` text NOT NULL,
	`return_date` text NOT NULL,
	`price` integer NOT NULL,
	`fetched_at` text NOT NULL,
	PRIMARY KEY(`airport`, `fetched_on`, `depart`)
);
