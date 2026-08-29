CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name_ar` text NOT NULL,
	`name_en` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_categories_slug` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `cities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name_ar` text NOT NULL,
	`name_en` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_cities_slug` ON `cities` (`slug`);
--> statement-breakpoint
INSERT OR IGNORE INTO `cities` (`slug`,`name_ar`,`name_en`,`created_at`) VALUES
('makkah','مكة المكرمة','Makkah',CAST(strftime('%s','now') AS INTEGER) * 1000),
('madinah','المدينة المنورة','Madinah',CAST(strftime('%s','now') AS INTEGER) * 1000);
--> statement-breakpoint
INSERT OR IGNORE INTO `categories` (`slug`,`name_ar`,`name_en`,`created_at`) VALUES
('mosque','مسجد','Mosque',CAST(strftime('%s','now') AS INTEGER) * 1000),
('revelation','موضع وحي','Revelation site',CAST(strftime('%s','now') AS INTEGER) * 1000),
('mountain','جبل أو معلم طبيعي','Mountain / landmark',CAST(strftime('%s','now') AS INTEGER) * 1000),
('historic_site','موقع تاريخي','Historic site',CAST(strftime('%s','now') AS INTEGER) * 1000),
('route','طريق أو مسار','Route',CAST(strftime('%s','now') AS INTEGER) * 1000),
('residence','منزل أو إقامة','Residence',CAST(strftime('%s','now') AS INTEGER) * 1000),
('cemetery','مقبرة','Cemetery',CAST(strftime('%s','now') AS INTEGER) * 1000);
