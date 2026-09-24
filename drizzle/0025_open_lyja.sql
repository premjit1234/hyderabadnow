CREATE TABLE `saved_searches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`label` text NOT NULL,
	`filters` text DEFAULT '{}' NOT NULL,
	`last_seen_listing_id` integer DEFAULT 0 NOT NULL,
	`last_notified_at` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `projects` ADD `rera_verified` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `rera_verified_at` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `approved_by` text;