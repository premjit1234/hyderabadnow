CREATE TABLE `availability_slots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`listing_id` integer NOT NULL,
	`owner_id` integer NOT NULL,
	`starts_at` text NOT NULL,
	`duration_minutes` integer DEFAULT 30 NOT NULL,
	`meeting_type` text DEFAULT 'video_call' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`buyer_id` integer,
	`buyer_note` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
