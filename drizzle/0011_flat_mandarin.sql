CREATE TABLE `credit_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`amount_rupees` integer NOT NULL,
	`razorpay_order_id` text NOT NULL,
	`razorpay_payment_id` text,
	`status` text DEFAULT 'created' NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`paid_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `credit_orders_razorpay_order_id_unique` ON `credit_orders` (`razorpay_order_id`);--> statement-breakpoint
ALTER TABLE `site_settings` ADD `featured_credit_price_rupees` integer DEFAULT 500 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `featured_credits` integer DEFAULT 0 NOT NULL;