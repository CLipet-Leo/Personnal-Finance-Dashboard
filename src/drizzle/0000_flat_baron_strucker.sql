CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`accounting_date` text NOT NULL,
	`operation_date` text,
	`value_date` text,
	`short_label` text NOT NULL,
	`full_label` text,
	`reference` text,
	`additional_info` text,
	`operation_type` text,
	`category` text,
	`subcategory` text,
	`amount` real NOT NULL,
	`reconciled` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_accounting_date_reference_amount_unique` ON `transactions` (`accounting_date`,`reference`,`amount`);