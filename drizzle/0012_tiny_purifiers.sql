CREATE TABLE `listing_post_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`listing_id` integer,
	`posted_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
ALTER TABLE `site_settings` ADD `default_monthly_listing_limit` integer DEFAULT 20 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `monthly_listing_limit_override` integer;