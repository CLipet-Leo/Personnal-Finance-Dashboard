import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  gt,
  gte,
  inArray,
  like,
  lt,
  lte,
  or,
  sql
} from 'drizzle-orm'

import { db, type SQLiteDB } from '@/db'
import { tagRules, transactions, type TagRule, type Transaction } from '@/db/schema'
import type { DateRange } from '@/lib/period'

/* -------------------------------------------------------------------------- */
/* Expressions réutilisables                                                   */
/* -------------------------------------------------------------------------- */

const creditsSum = sql<number>`coalesce(sum(case when ${transactions.amount} > 0 then ${transactions.amount} end), 0)`
const debitsSum = sql<number>`coalesce(sum(case when ${transactions.amount} < 0 then abs(${transactions.amount}) end), 0)`
const netSum = sql<number>`coalesce(sum(${transactions.amount}), 0)`

const categoryLabel = sql<string>`coalesce(nullif(${transactions.category}, ''), 'Non catégorisé')`
const subcategoryLabel = sql<string>`coalesce(nullif(${transactions.subcategory}, ''), 'Non renseignée')`

/**
 * Tag d'une transaction : la plus ancienne règle dont le pattern apparaît dans un
 * des libellés. LIKE est insensible à la casse (ASCII) en SQLite.
 * ponytail: sous-requête corrélée évaluée par ligne, suffisant pour quelques
 * milliers d'opérations ; matérialiser une colonne `tag` si ça devient lent.
 */
const ruleMatches = sql`(${transactions.shortLabel} like '%' || ${tagRules.pattern} || '%' or ${transactions.fullLabel} like '%' || ${tagRules.pattern} || '%')`
const tagLabel = sql<
  string | null
>`(select ${tagRules.tag} from ${tagRules} where ${ruleMatches} order by ${tagRules.id} limit 1)`

function inRange(range: DateRange) {
  return and(
    gte(transactions.accountingDate, range.from),
    lte(transactions.accountingDate, range.to)
  )
}

export const SORT_COLUMNS = {
  date: transactions.accountingDate,
  label: transactions.shortLabel,
  category: transactions.category,
  amount: transactions.amount
} as const

export type SortColumn = keyof typeof SORT_COLUMNS
export type SortDirection = 'asc' | 'desc'
export type ReconciledFilter = 'all' | 'reconciled' | 'pending'
export type FlowFilter = 'all' | 'in' | 'out'

export type PeriodSummary = {
  credits: number
  debits: number
  net: number
  transactionCount: number
  unreconciledCount: number
}

export type DailyFlow = {
  date: string
  credits: number
  debits: number
  net: number
}

export type MonthlyFlow = {
  month: string // yyyy-mm
  credits: number
  debits: number
  net: number
}

export type CategoryBreakdown = {
  category: string
  total: number
  subcategories: { subcategory: string; total: number }[]
}

export type TransactionQuery = {
  range: DateRange
  search?: string
  category?: string
  subcategory?: string
  status?: ReconciledFilter
  flow?: FlowFilter
  tags?: string[]
  sort?: SortColumn
  dir?: SortDirection
  page?: number
  pageSize?: number
}

export type TransactionRow = Transaction & { tag: string | null }

export type TransactionPage = {
  rows: TransactionRow[]
  total: number
  /** Sommes sur toutes les opérations filtrées, pas seulement la page affichée. */
  sums: { credits: number; debits: number; net: number }
  page: number
  pageCount: number
  pageSize: number
}

export type FilterOptions = {
  category: string
  subcategories: string[]
}[]

export type TagRuleWithMatches = TagRule & { matches: number }

export type TagSummary = {
  tag: string
  transactionCount: number
  total: number
  monthlyAverage: number
}

export type DatasetInfo = {
  total: number
  firstDate: string | null
  lastDate: string | null
}

export class DBService {
  constructor(private readonly db: SQLiteDB) {}

  async getPeriodSummary(range: DateRange): Promise<PeriodSummary> {
    const [row] = await this.db
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

  async getDailyFlow(range: DateRange): Promise<DailyFlow[]> {
    return this.db
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

  async getMonthlyFlow(range: DateRange): Promise<MonthlyFlow[]> {
    const month = sql<string>`substr(${transactions.accountingDate}, 1, 7)`
    return this.db
      .select({ month, credits: creditsSum, debits: debitsSum, net: netSum })
      .from(transactions)
      .where(inRange(range))
      .groupBy(month)
      .orderBy(asc(month))
  }

  /**
   * Une seule requête groupée catégorie + sous-catégorie : le volume est faible
   * (quelques dizaines de lignes), le regroupement en arbre se fait ici plutôt
   * qu'avec un second aller-retour SQL au moment du drill-down.
   */
  async getSpendingBreakdown(range: DateRange): Promise<CategoryBreakdown[]> {
    const rows = await this.db
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

  async getTransactions(query: TransactionQuery): Promise<TransactionPage> {
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
    if (query.status === 'pending')
      conditions.push(sql`coalesce(${transactions.reconciled}, 0) = 0`)
    if (query.flow === 'in') conditions.push(gt(transactions.amount, 0))
    if (query.flow === 'out') conditions.push(lt(transactions.amount, 0))
    if (query.tags?.length) conditions.push(inArray(tagLabel, query.tags))

    const where = and(...conditions)
    const orderColumn = SORT_COLUMNS[sort]
    const order = dir === 'asc' ? asc(orderColumn) : desc(orderColumn)

    const [{ total, ...sums }] = await this.db
      .select({ total: count(), credits: creditsSum, debits: debitsSum, net: netSum })
      .from(transactions)
      .where(where)

    const pageCount = Math.max(1, Math.ceil(total / pageSize))
    const page = Math.min(Math.max(1, query.page ?? 1), pageCount)

    const rows = await this.db
      .select({ ...getTableColumns(transactions), tag: tagLabel })
      .from(transactions)
      .where(where)
      .orderBy(order, desc(transactions.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize)

    return { rows, total, sums, page, pageCount, pageSize }
  }

  async getFilterOptions(): Promise<FilterOptions> {
    const rows = await this.db
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

  async getTags(): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ tag: tagRules.tag })
      .from(tagRules)
      .orderBy(asc(tagRules.tag))
    return rows.map((row) => row.tag)
  }

  /** Nombre de transactions contenant le pattern, indépendamment des autres règles. */
  async getTagRules(): Promise<TagRuleWithMatches[]> {
    return this.db
      .select({
        ...getTableColumns(tagRules),
        matches: sql<number>`(select count(*) from ${transactions} where ${ruleMatches})`
      })
      .from(tagRules)
      .orderBy(asc(tagRules.tag), asc(tagRules.id))
  }

  /**
   * Moyenne mensuelle sur tous les mois présents en base, pas seulement ceux où le
   * tag apparaît : un abonnement sauté un mois fait baisser la moyenne.
   */
  async getTagSummaries(): Promise<TagSummary[]> {
    const [{ months }] = await this.db
      .select({ months: sql<number>`count(distinct substr(${transactions.accountingDate}, 1, 7))` })
      .from(transactions)

    const rows = await this.db
      .select({ tag: sql<string>`${tagLabel}`, transactionCount: count(), total: netSum })
      .from(transactions)
      .where(sql`${tagLabel} is not null`)
      .groupBy(tagLabel)
      .orderBy(asc(netSum))

    return rows.map((row) => ({ ...row, monthlyAverage: months ? row.total / months : 0 }))
  }

  async getDatasetInfo(): Promise<DatasetInfo> {
    const [row] = await this.db
      .select({
        total: count(),
        firstDate: sql<string | null>`min(${transactions.accountingDate})`,
        lastDate: sql<string | null>`max(${transactions.accountingDate})`
      })
      .from(transactions)

    return row ?? { total: 0, firstDate: null, lastDate: null }
  }
}

// ponytail: instance unique partagée, l'injection du constructeur ne sert qu'aux scripts et aux tests.
export const dbService = new DBService(db)
