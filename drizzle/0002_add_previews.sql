CREATE TABLE `previews` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`slug` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`theme` text DEFAULT 'modern' NOT NULL,
	`accent` text DEFAULT '#7c3aed' NOT NULL,
	`headline` text NOT NULL,
	`subheadline` text NOT NULL,
	`about` text NOT NULL,
	`cta_label` text DEFAULT 'Falar no WhatsApp' NOT NULL,
	`hero_image_url` text DEFAULT '' NOT NULL,
	`gallery_json` text DEFAULT '[]' NOT NULL,
	`services_json` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `previews_lead_id_unique` ON `previews` (`lead_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `previews_slug_unique` ON `previews` (`slug`);
--> statement-breakpoint
CREATE INDEX `previews_lead_idx` ON `previews` (`lead_id`);
--> statement-breakpoint
CREATE INDEX `previews_slug_idx` ON `previews` (`slug`);
