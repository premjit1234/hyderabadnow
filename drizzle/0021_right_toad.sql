CREATE TABLE `area_update_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`area_update_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`area_update_id`) REFERENCES `area_updates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `area_update_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`area_update_id` integer NOT NULL,
	`url` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`area_update_id`) REFERENCES `area_updates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `area_update_votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`area_update_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`value` integer NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`area_update_id`) REFERENCES `area_updates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `area_update_votes_post_user_idx` ON `area_update_votes` (`area_update_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `area_updates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`locality_guide_id` integer NOT NULL,
	`author_id` integer,
	`content` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`locality_guide_id`) REFERENCES `locality_guides`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
