CREATE TABLE `locality_guides` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`title` text NOT NULL,
	`excerpt` text,
	`hero_image_url` text,
	`metro_connectivity` text,
	`orr_access` text,
	`upcoming_infra` text,
	`content_html` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`author_id` integer,
	`published_at` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `locality_guides_slug_unique` ON `locality_guides` (`slug`);