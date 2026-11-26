CREATE TABLE `project_inquiries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`message` text NOT NULL,
	`responded_at` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `project_videos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
-- One-time backfill: any project that already had a single video link in
-- the old projects.video_url column gets it copied into the new
-- project_videos table, so switching the admin form and public page over to
-- the new multi-video table (see ProjectForm.tsx / projects/[slug]/page.tsx)
-- never makes an existing video disappear. The old column itself is left in
-- place afterward (untouched, still written by lib/bulkProjects.ts's CSV
-- importer) — this is purely additive, not a column migration.
INSERT INTO `project_videos` (`project_id`, `url`, `sort_order`)
SELECT `id`, `video_url`, 0 FROM `projects` WHERE `video_url` IS NOT NULL AND `video_url` != '';
