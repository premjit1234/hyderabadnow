CREATE TABLE `list_view_field_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`config` text DEFAULT '{}' NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
