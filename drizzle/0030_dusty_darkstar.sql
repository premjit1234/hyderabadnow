CREATE TABLE `microsite_page_floor_plan_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`floor_plan_id` integer NOT NULL,
	`url` text NOT NULL,
	`label` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`floor_plan_id`) REFERENCES `microsite_page_floor_plans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `microsite_page_floor_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`page_id` integer NOT NULL,
	`label` text NOT NULL,
	`plot_area_sqyd` real,
	`built_up_area_sqft` integer,
	`bedrooms` text,
	`virtual_tour_url` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`page_id`) REFERENCES `microsite_pages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `microsite_page_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`page_id` integer NOT NULL,
	`url` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`page_id`) REFERENCES `microsite_pages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `microsite_page_inquiries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`page_id` integer NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`message` text NOT NULL,
	`responded_at` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`page_id`) REFERENCES `microsite_pages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `microsite_page_nearby_places` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`page_id` integer NOT NULL,
	`category` text NOT NULL,
	`items` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`page_id`) REFERENCES `microsite_pages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `microsite_page_specifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`page_id` integer NOT NULL,
	`category` text NOT NULL,
	`details` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`page_id`) REFERENCES `microsite_pages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `microsite_page_videos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`page_id` integer NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`page_id`) REFERENCES `microsite_pages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `microsite_pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`tagline` text,
	`developer_name` text,
	`developer_url` text,
	`locality` text NOT NULL,
	`city` text DEFAULT 'Hyderabad' NOT NULL,
	`latitude` real,
	`longitude` real,
	`property_type` text DEFAULT 'villa' NOT NULL,
	`construction_status` text DEFAULT 'under_construction' NOT NULL,
	`area_acres` real,
	`total_units` integer,
	`min_area_sqft` integer,
	`max_area_sqft` integer,
	`bhk_options` text,
	`rera_number` text,
	`rera_verified` integer DEFAULT false NOT NULL,
	`rera_verified_at` text,
	`possession_year` integer,
	`description` text,
	`amenities` text,
	`brochure_url` text,
	`master_plan_image_url` text,
	`location_map_image_url` text,
	`specifications_intro` text,
	`contact_phone` text,
	`whatsapp_enabled` integer DEFAULT false NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `microsite_pages_slug_unique` ON `microsite_pages` (`slug`);