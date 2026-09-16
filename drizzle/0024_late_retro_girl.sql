CREATE TABLE `greenfin_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`farmer_id` text NOT NULL,
	`dimension` text NOT NULL,
	`action_level` text NOT NULL,
	`description` text NOT NULL,
	`action_date` text NOT NULL,
	`evidence_record_ids_json` text DEFAULT '[]' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_greenfin_actions_farmer_date` ON `greenfin_actions` (`farmer_id`,`action_date`);--> statement-breakpoint
CREATE TABLE `greenfin_anomalies` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`document_id` text,
	`anomaly_type` text NOT NULL,
	`severity` text DEFAULT 'WARNING' NOT NULL,
	`description` text NOT NULL,
	`is_resolved` integer DEFAULT false NOT NULL,
	`resolved_by` text,
	`resolved_at` text,
	`resolution_note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_greenfin_anomalies_record` ON `greenfin_anomalies` (`record_id`);--> statement-breakpoint
CREATE INDEX `idx_greenfin_anomalies_unresolved` ON `greenfin_anomalies` (`is_resolved`,`severity`);--> statement-breakpoint
CREATE TABLE `greenfin_audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_type` text NOT NULL,
	`actor_id` text,
	`target_id` text,
	`target_type` text,
	`details_json` text DEFAULT '{}' NOT NULL,
	`ip_address` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_greenfin_audit_target` ON `greenfin_audit_logs` (`target_type`,`target_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_greenfin_audit_event` ON `greenfin_audit_logs` (`event_type`,`created_at`);--> statement-breakpoint
CREATE TABLE `greenfin_authorizations` (
	`id` text PRIMARY KEY NOT NULL,
	`farmer_id` text NOT NULL,
	`institution_id` text NOT NULL,
	`purpose` text NOT NULL,
	`data_scope_json` text DEFAULT '[]' NOT NULL,
	`start_at` text NOT NULL,
	`expire_at` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`revoked_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_greenfin_authorizations_farmer` ON `greenfin_authorizations` (`farmer_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_greenfin_authorizations_institution` ON `greenfin_authorizations` (`institution_id`,`status`,`expire_at`);--> statement-breakpoint
CREATE TABLE `greenfin_bank_cases` (
	`id` text PRIMARY KEY NOT NULL,
	`authorization_id` text NOT NULL,
	`institution_id` text NOT NULL,
	`farmer_id` text NOT NULL,
	`case_number` text,
	`status` text DEFAULT 'open' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_greenfin_bank_cases_authorization` ON `greenfin_bank_cases` (`authorization_id`);--> statement-breakpoint
CREATE INDEX `idx_greenfin_bank_cases_institution` ON `greenfin_bank_cases` (`institution_id`,`status`);--> statement-breakpoint
CREATE TABLE `greenfin_crops` (
	`id` text PRIMARY KEY NOT NULL,
	`farm_id` text NOT NULL,
	`name` text NOT NULL,
	`variety` text DEFAULT '' NOT NULL,
	`cultivation_area_hectares` real,
	`planting_date` text,
	`harvest_date` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_greenfin_crops_farm` ON `greenfin_crops` (`farm_id`);--> statement-breakpoint
CREATE TABLE `greenfin_data_health_results` (
	`id` text PRIMARY KEY NOT NULL,
	`farmer_id` text NOT NULL,
	`domain` text NOT NULL,
	`status` text NOT NULL,
	`reasons_json` text DEFAULT '[]' NOT NULL,
	`actions_json` text DEFAULT '[]' NOT NULL,
	`affected_evidence_ids_json` text DEFAULT '[]' NOT NULL,
	`rule_version` text NOT NULL,
	`calculated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_greenfin_health_farmer_domain` ON `greenfin_data_health_results` (`farmer_id`,`domain`,`calculated_at`);--> statement-breakpoint
CREATE TABLE `greenfin_document_fields` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`field_name` text NOT NULL,
	`raw_value` text,
	`normalized_value` text,
	`confidence` real,
	`source` text DEFAULT 'ocr' NOT NULL,
	`manually_corrected` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_greenfin_document_fields_document` ON `greenfin_document_fields` (`document_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_greenfin_document_fields_name` ON `greenfin_document_fields` (`document_id`,`field_name`);--> statement-breakpoint
CREATE TABLE `greenfin_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`farmer_id` text NOT NULL,
	`original_name` text NOT NULL,
	`file_sha256` text,
	`storage_key` text NOT NULL,
	`mime_type` text,
	`file_size` integer,
	`domain` text NOT NULL,
	`source_level` text DEFAULT 'V1' NOT NULL,
	`status` text DEFAULT 'UPLOADED' NOT NULL,
	`upload_note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_greenfin_documents_farmer_created` ON `greenfin_documents` (`farmer_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_greenfin_documents_farmer_hash` ON `greenfin_documents` (`farmer_id`,`file_sha256`);--> statement-breakpoint
CREATE TABLE `greenfin_experience_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`farmer_id` text NOT NULL,
	`green_action_id` text NOT NULL,
	`dimension` text NOT NULL,
	`base_value` integer NOT NULL,
	`source_recognition_ratio` real NOT NULL,
	`effective_value` real NOT NULL,
	`rule_version` text NOT NULL,
	`calculated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`input_evidence_ids_json` text DEFAULT '[]' NOT NULL,
	`calculation_trace_json` text DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_greenfin_experience_farmer_dimension` ON `greenfin_experience_transactions` (`farmer_id`,`dimension`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_greenfin_experience_action_rule` ON `greenfin_experience_transactions` (`green_action_id`,`rule_version`);--> statement-breakpoint
CREATE TABLE `greenfin_farms` (
	`id` text PRIMARY KEY NOT NULL,
	`farmer_id` text NOT NULL,
	`name` text NOT NULL,
	`city` text NOT NULL,
	`district` text NOT NULL,
	`area_hectares` real,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_greenfin_farms_farmer` ON `greenfin_farms` (`farmer_id`);--> statement-breakpoint
CREATE TABLE `greenfin_indicator_results` (
	`id` text PRIMARY KEY NOT NULL,
	`farmer_id` text NOT NULL,
	`indicator_type` text NOT NULL,
	`score` real NOT NULL,
	`level` text NOT NULL,
	`details_json` text DEFAULT '{}' NOT NULL,
	`rule_version` text NOT NULL,
	`calculated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`input_evidence_ids_json` text DEFAULT '[]' NOT NULL,
	`calculation_trace_json` text DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_greenfin_indicators_farmer_type` ON `greenfin_indicator_results` (`farmer_id`,`indicator_type`,`calculated_at`);--> statement-breakpoint
CREATE TABLE `greenfin_rule_sets` (
	`version` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`config_json` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `greenfin_standardized_records` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`farmer_id` text NOT NULL,
	`domain` text NOT NULL,
	`record_type` text NOT NULL,
	`data_json` text DEFAULT '{}' NOT NULL,
	`source_level` text DEFAULT 'V1' NOT NULL,
	`is_valid` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_greenfin_records_farmer_domain` ON `greenfin_standardized_records` (`farmer_id`,`domain`);--> statement-breakpoint
CREATE INDEX `idx_greenfin_records_document` ON `greenfin_standardized_records` (`document_id`);--> statement-breakpoint
CREATE TABLE `greenfin_verification_results` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`source_level` text NOT NULL,
	`reason` text NOT NULL,
	`verified_by` text DEFAULT 'system' NOT NULL,
	`evidence_ids_json` text DEFAULT '[]' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_greenfin_verifications_record` ON `greenfin_verification_results` (`record_id`,`created_at`);