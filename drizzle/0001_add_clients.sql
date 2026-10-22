CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`category` text DEFAULT 'Outros' NOT NULL,
	`monthly_revenue` real DEFAULT 0 NOT NULL,
	`receivable` real DEFAULT 0 NOT NULL,
	`expenses` real DEFAULT 0 NOT NULL,
	`total_revenue` real DEFAULT 0 NOT NULL,
	`reference_month` text NOT NULL,
	`services_json` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `clients_status_idx` ON `clients` (`status`);
--> statement-breakpoint
CREATE INDEX `clients_month_idx` ON `clients` (`reference_month`);
