CREATE TABLE `amenity_catalog` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`label` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `amenity_catalog_key_unique` ON `amenity_catalog` (`key`);--> statement-breakpoint
ALTER TABLE `listings` ADD `amenities` text;