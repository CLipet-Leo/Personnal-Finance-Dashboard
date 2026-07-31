import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountingDate: text('accounting_date').notNull(),
  operationDate: text('operation_date'),
  valueDate: text('value_date'),
  shortLabel: text('short_label').notNull(),
  fullLabel: text('full_label'),
  reference: text('reference'),
  additionalInfo: text('additional_info'),
  operationType: text('operation_type'),
  category: text('category'),
  subcategory: text('subcategory'),
  amount: real('amount').notNull(),
  reconciled: integer('reconciled', { mode: 'boolean' }),
  // Clé de déduplication : la référence bancaire est parfois vide, et SQLite
  // considère deux NULL comme distincts — un index composite ne suffit pas.
  fingerprint: text('fingerprint').notNull().unique()
})

export type Transaction = typeof transactions.$inferSelect
