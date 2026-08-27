CREATE TABLE `favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`profile_id` integer NOT NULL,
	`place_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_favorites_profile_place` ON `favorites` (`profile_id`,`place_id`);--> statement-breakpoint
CREATE TABLE `itineraries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`profile_id` integer NOT NULL,
	`title` text NOT NULL,
	`starts_on` text,
	`is_public` integer DEFAULT false NOT NULL,
	`share_token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_itineraries_share_token` ON `itineraries` (`share_token`);--> statement-breakpoint
CREATE INDEX `idx_itineraries_profile` ON `itineraries` (`profile_id`);--> statement-breakpoint
CREATE TABLE `itinerary_stops` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`itinerary_id` integer NOT NULL,
	`place_id` integer NOT NULL,
	`day_number` integer DEFAULT 1 NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`note` text,
	FOREIGN KEY (`itinerary_id`) REFERENCES `itineraries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_itinerary_stops_itinerary_day_position` ON `itinerary_stops` (`itinerary_id`,`day_number`,`position`);--> statement-breakpoint
CREATE TABLE `place_photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`place_id` integer NOT NULL,
	`object_key` text NOT NULL,
	`alt_ar` text NOT NULL,
	`alt_en` text NOT NULL,
	`credit` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_place_photos_place_position` ON `place_photos` (`place_id`,`position`);--> statement-breakpoint
CREATE TABLE `places` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`city` text NOT NULL,
	`latitude` text NOT NULL,
	`longitude` text NOT NULL,
	`title_ar` text NOT NULL,
	`title_en` text NOT NULL,
	`description_ar` text NOT NULL,
	`description_en` text NOT NULL,
	`category` text NOT NULL,
	`era` text,
	`source_url` text,
	`source_label_ar` text,
	`source_label_en` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_places_slug` ON `places` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_places_city_status` ON `places` (`city`,`status`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`auth_subject` text NOT NULL,
	`username` text NOT NULL,
	`display_name` text,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_profiles_auth_subject` ON `profiles` (`auth_subject`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_profiles_username` ON `profiles` (`username`);