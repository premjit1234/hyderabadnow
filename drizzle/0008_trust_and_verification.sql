CREATE TABLE `phone_otps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`phone` text NOT NULL,
	`code_hash` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`expires_at` text NOT NULL,
	`consumed_at` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `listings` ADD `last_confirmed_at` text;--> statement-breakpoint
ALTER TABLE `listings` ADD `stale_nudge_sent_at` text;--> statement-breakpoint
ALTER TABLE `listings` ADD `auto_flagged_stale_at` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `rera_number` text;--> statement-breakpoint
ALTER TABLE `users` ADD `phone_verified` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `phone_verified_at` text;