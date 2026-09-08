ALTER TABLE `projects` ADD `slug` text;--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);