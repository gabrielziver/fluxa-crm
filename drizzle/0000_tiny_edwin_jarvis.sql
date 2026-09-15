CREATE TABLE `lead_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lead_id` text NOT NULL,
	`event_type` text NOT NULL,
	`from_stage` text,
	`to_stage` text,
	`metadata_json` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `events_lead_time_idx` ON `lead_events` (`lead_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `lead_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lead_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `notes_lead_time_idx` ON `lead_notes` (`lead_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_number` integer NOT NULL,
	`clinic` text NOT NULL,
	`location` text NOT NULL,
	`city` text NOT NULL,
	`neighborhood` text NOT NULL,
	`stage` text NOT NULL,
	`contact_result` text,
	`interest` text,
	`preview_accepted` integer DEFAULT false NOT NULL,
	`paid` integer DEFAULT false NOT NULL,
	`score` integer NOT NULL,
	`score_breakdown` text NOT NULL,
	`class_name` text NOT NULL,
	`site_issue` text NOT NULL,
	`site_problem` text NOT NULL,
	`instagram` text NOT NULL,
	`rating` real NOT NULL,
	`review_count` integer NOT NULL,
	`services` text NOT NULL,
	`phone` text NOT NULL,
	`whatsapp_url` text NOT NULL,
	`rationale` text NOT NULL,
	`verification_notes` text NOT NULL,
	`specific_opening` text NOT NULL,
	`sources_json` text NOT NULL,
	`first_contact_at` text,
	`replied_at` text,
	`preview_accepted_at` text,
	`preview_sent_at` text,
	`proposal_at` text,
	`closed_at` text,
	`paid_at` text,
	`delivered_at` text,
	`next_follow_up_at` text,
	`last_contact_at` text,
	`closed_value` real,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leads_lead_number_unique` ON `leads` (`lead_number`);--> statement-breakpoint
CREATE INDEX `leads_stage_idx` ON `leads` (`stage`);--> statement-breakpoint
CREATE INDEX `leads_city_idx` ON `leads` (`city`);--> statement-breakpoint
CREATE INDEX `leads_class_idx` ON `leads` (`class_name`);--> statement-breakpoint
CREATE INDEX `leads_followup_idx` ON `leads` (`next_follow_up_at`);