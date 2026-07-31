import { and, asc, count, desc, eq, gte, like, lt, lte, or, sql } from 'drizzle-orm'

import { db } from '@/db'
import { transactions, type Transaction } from '@/db/schema'
import type { DateRange } from '@/lib/period'

/* -------------------------------------------------------------------------- */
/* Expressions réutilisables                                                   */
/* -------------------------------------------------------------------------- */

const creditsSum = sql<number>`coalesce(sum(case when ${transactions.amount} > 0 then ${transactions.amount} end), 0)`
const debitsSum = sql<number>`coalesce(sum(case when ${transactions.amount} < 0 then abs(${transactions.amount}) end), 0)`
const netSum = sql<number>`coalesce(sum(${transactions.amount}), 0)`

const categoryLabel = sql<string>`coalesce(nullif(${transactions.category}, ''), 'Non catégorisé')`
const subcategoryLabel = sql<string>`coalesce(nullif(${transactions.subcategory}, ''), 'Non renseignée')`

function inRange(range: DateRange) {
  return and(
    gte(transactions.accountingDate, range.from),
    lte(transactions.accountingDate, range.to)
  )
}

/* -------------------------------------------------------------------------- */
/* Vue d'ensemble                                                              */
/* -------------------------------------------------------------------------- */

export type PeriodSummary = {
  credits: number
  debits: number
  net: number
  transactionCount: number
  unreconciledCount: number
}

export async function getPeriodSummary(range: DateRange): Promise<PeriodSummary> {
  const [row] = await db
    .select({
      credits: creditsSum,
      debits: debitsSum,
      net: netSum,
      transactionCount: count(),
      unreconciledCount: sql<number>`coalesce(sum(case when ${transactions.reconciled} = 1 then 0 else 1 end), 0)`
    })
    .from(transactions)
    .where(inRange(range))

  return row ?? { credits: 0, debits: 0, net: 0, transactionCount: 0, unreconciledCount: 0 }
}

/* -------------------------------------------------------------------------- */
/* Séries temporelles                                                          */
/* -------------------------------------------------------------------------- */

export type DailyFlow = {
  date: string
  credits: number
  debits: number
  net: number
}

export async function getDailyFlow(range: DateRange): Promise<DailyFlow[]> {
  return db
    .select({
      date: transactions.accountingDate,
      credits: creditsSum,
      debits: debitsSum,
      net: netSum
    })
    .from(transactions)
    .where(inRange(range))
    .groupBy(transactions.accountingDate)
    .orderBy(asc(transactions.accountingDate))
}

/* -------------------------------------------------------------------------- */
/* Répartition des dépenses                                                    */
/* -------------------------------------------------------------------------- */

export type CategoryBreakdown = {
  category: string
  total: number
  subcategories: { subcategory: string; total: number }[]
}

/**
 * Une seule requête groupée catégorie + sous-catégorie : le volume est faible
 * (quelques dizaines de lignes), le regroupement en arbre se fait ici plutôt
 * qu'avec un second aller-retour SQL au moment du drill-down.
 */
export async function getSpendingBreakdown(range: DateRange): Promise<CategoryBreakdown[]> {
  const rows = await db
    .select({
      category: categoryLabel,
      subcategory: subcategoryLabel,
      total: debitsSum
    })
    .from(transactions)
    .where(and(inRange(range), lt(transactions.amount, 0)))
    .groupBy(categoryLabel, subcategoryLabel)

  const byCategory = new Map<string, CategoryBreakdown>()

  for (const row of rows) {
    const entry = byCategory.get(row.category) ?? {
      category: row.category,
      total: 0,
      subcategories: []
    }
    entry.total += row.total
    entry.subcategories.push({ subcategory: row.subcategory, total: row.total })
    byCategory.set(row.category, entry)
  }

  return [...byCategory.values()]
    .map((entry) => ({
      ...entry,
      subcategories: entry.subcategories.sort((a, b) => b.total - a.total)
    }))
    .sort((a, b) => b.total - a.total)
}

/* -------------------------------------------------------------------------- */
/* Table d'audit                                                               */
/* -------------------------------------------------------------------------- */

export const SORT_COLUMNS = {
  date: transactions.accountingDate,
  label: transactions.shortLabel,
  category: transactions.category,
  amount: transactions.amount
} as const

export type SortColumn = keyof typeof SORT_COLUMNS
export type SortDirection = 'asc' | 'desc'
export type ReconciledFilter = 'all' | 'reconciled' | 'pending'

export type TransactionQuery = {
  range: DateRange
  search?: string
  category?: string
  subcategory?: string
  status?: ReconciledFilter
  sort?: SortColumn
  dir?: SortDirection
  page?: number
  pageSize?: number
}

export type TransactionPage = {
  rows: Transaction[]
  total: number
  page: number
  pageCount: number
  pageSize: number
}

export async function getTransactions(query: TransactionQuery): Promise<TransactionPage> {
  const pageSize = query.pageSize ?? 25
  const sort = query.sort ?? 'date'
  const dir = query.dir ?? 'desc'

  const conditions = [inRange(query.range)]

  if (query.search?.trim()) {
    // Drizzle paramètre la valeur : pas d'injection possible via le pattern.
    const pattern = `%${query.search.trim()}%`
    conditions.push(
      or(
        like(transactions.shortLabel, pattern),
        like(transactions.fullLabel, pattern),
        like(transactions.additionalInfo, pattern)
      )
    )
  }
  if (query.category) conditions.push(eq(categoryLabel, query.category))
  if (query.subcategory) conditions.push(eq(subcategoryLabel, query.subcategory))
  if (query.status === 'reconciled') conditions.push(eq(transactions.reconciled, true))
  if (query.status === 'pending') conditions.push(sql`coalesce(${transactions.reconciled}, 0) = 0`)

  const where = and(...conditions)
  const orderColumn = SORT_COLUMNS[sort]
  const order = dir === 'asc' ? asc(orderColumn) : desc(orderColumn)

  const [{ total }] = await db.select({ total: count() }).from(transactions).where(where)

  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, query.page ?? 1), pageCount)

  const rows = await db
    .select()
    .from(transactions)
    .where(where)
    .orderBy(order, desc(transactions.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  return { rows, total, page, pageCount, pageSize }
}

/* -------------------------------------------------------------------------- */
/* Métadonnées (options de filtre, état du dataset)                            */
/* -------------------------------------------------------------------------- */

export type FilterOptions = {
  category: string
  subcategories: string[]
}[]

export async function getFilterOptions(): Promise<FilterOptions> {
  const rows = await db
    .selectDistinct({ category: categoryLabel, subcategory: subcategoryLabel })
    .from(transactions)
    .orderBy(asc(categoryLabel), asc(subcategoryLabel))

  const byCategory = new Map<string, string[]>()
  for (const row of rows) {
    const list = byCategory.get(row.category) ?? []
    if (!list.includes(row.subcategory)) list.push(row.subcategory)
    byCategory.set(row.category, list)
  }

  return [...byCategory.entries()].map(([category, subcategories]) => ({
    category,
    subcategories
  }))
}

export type DatasetInfo = {
  total: number
  firstDate: string | null
  lastDate: string | null
}

export async function getDatasetInfo(): Promise<DatasetInfo> {
  const [row] = await db
    .select({
      total: count(),
      firstDate: sql<string | null>`min(${transactions.accountingDate})`,
      lastDate: sql<string | null>`max(${transactions.accountingDate})`
    })
    .from(transactions)

  return row ?? { total: 0, firstDate: null, lastDate: null }
}
