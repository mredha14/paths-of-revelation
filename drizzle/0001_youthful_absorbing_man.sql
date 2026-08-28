CREATE TABLE `favorite_list_places` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`favorite_list_id` integer NOT NULL,
	`place_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`favorite_list_id`) REFERENCES `favorite_lists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_favorite_list_places_list_place` ON `favorite_list_places` (`favorite_list_id`,`place_id`);--> statement-breakpoint
CREATE INDEX `idx_favorite_list_places_list` ON `favorite_list_places` (`favorite_list_id`);--> statement-breakpoint
CREATE TABLE `favorite_lists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`profile_id` integer NOT NULL,
	`title` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_favorite_lists_profile` ON `favorite_lists` (`profile_id`);