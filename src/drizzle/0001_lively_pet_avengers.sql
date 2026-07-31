DROP INDEX `transactions_accounting_date_reference_amount_unique`;--> statement-breakpoint
ALTER TABLE `transactions` ADD `fingerprint` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_fingerprint_unique` ON `transactions` (`fingerprint`);