ALTER TABLE `favorite_lists` ADD `is_public` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `favorite_lists` ADD `share_token` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_favorite_lists_share_token` ON `favorite_lists` (`share_token`);