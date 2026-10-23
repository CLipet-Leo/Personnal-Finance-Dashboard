import { CashflowCard } from '@/components/dashboard/cashflow-card'
import { PeriodFilter } from '@/components/dashboard/period-filter'
import { SpendingByCategoryCard } from '@/components/dashboard/spending-by-category-card'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { TagsCard } from '@/components/dashboard/tags-card'
import { TopExpensesCard } from '@/components/dashboard/top-expenses-card'
import { TransactionFilters } from '@/components/dashboard/transaction-filters'
import { TransactionsTable } from '@/components/dashboard/transactions-table'
import { CsvUploader } from '@/components/csv-uploader'
import { ImportSheet } from '@/components/import-sheet'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { QueryParamsTransition } from '@/hooks/use-query-params'
import { formatAmount, formatLongDate, formatSignedAmount } from '@/lib/format'
import {
  clampRange,
  fullMonthOf,
  previousRange,
  resolvePeriod,
  searchParamsFrom,
  trailingMonths,
  type PeriodPreset
} from '@/lib/period'
import { cn } from '@/lib/utils'
import {
  dbService,
  SORT_COLUMNS,
  type FlowFilter,
  type ReconciledFilter,
  type SortColumn,
  type SortDirection
} from '@/services/DBService'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const COMPARISON_LABELS: Partial<Record<PeriodPreset, string>> = {
  current: 'vs mois précédent',
  previous: 'vs mois précédent',
  quarter: 'vs 3 mois précédents',
  year: 'vs 12 mois précédents'
}

function parseSort(value: string | null): SortColumn {
  return value && value in SORT_COLUMNS ? (value as SortColumn) : 'date'
}

function parseStatus(value: string | null): ReconciledFilter {
  return value === 'reconciled' || value === 'pending' ? value : 'all'
}

function parseFlow(value: string | null): FlowFilter {
  return value === 'in' || value === 'out' ? value : 'all'
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = searchParamsFrom(await searchParams)
  const dataset = await dbService.getDatasetInfo()

  if (dataset.total === 0) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-10">
        <Card className="gap-4">
          <CardHeader>
            <CardTitle>Bienvenue</CardTitle>
            <CardDescription>
              Importe un premier relevé CSV pour alimenter le dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CsvUploader />
          </CardContent>
        </Card>
      </main>
    )
  }

  const bounds = { from: dataset.firstDate!, to: dataset.lastDate! }
  const { preset, range } = resolvePeriod(params, bounds)
  const effective = clampRange(range, dataset.lastDate)
  const comparison = previousRange(effective)
  // Pas de variation si l'historique ne couvre pas la période précédente : +3000 % n'apprend rien.
  const comparable = comparison.from.slice(0, 7) >= dataset.firstDate!.slice(0, 7)
  const days = (Date.parse(effective.to) - Date.parse(effective.from)) / 86_400_000 + 1

  const search = params.get('q') ?? ''
  const category = params.get('category') ?? ''
  const subcategory = params.get('subcategory') ?? ''
  const status = parseStatus(params.get('status'))
  const flow = parseFlow(params.get('flow'))
  const selectedTags = params.getAll('tag')
  const sort = parseSort(params.get('sort'))
  const dir: SortDirection = params.get('dir') === 'asc' ? 'asc' : 'desc'
  const page = Number(params.get('page')) || 1

  const [
    summary,
    previous,
    dailyFlow,
    monthlyFlow,
    breakdown,
    topExpenses,
    filterOptions,
    tags,
    tagRules,
    tagSummaries,
    transactions
  ] = await Promise.all([
    dbService.getPeriodSummary(effective),
    comparable ? dbService.getPeriodSummary(comparison) : null,
    dbService.getDailyFlow(range),
    dbService.getMonthlyFlow(trailingMonths(range)),
    dbService.getSpendingBreakdown(range),
    dbService.getTransactions({ range, flow: 'out', sort: 'amount', dir: 'asc', pageSize: 5 }),
    dbService.getFilterOptions(),
    dbService.getTags(),
    dbService.getTagRules(),
    dbService.getTagSummaries(),
    dbService.getTransactions({
      range,
      search,
      category,
      subcategory,
      status,
      flow,
      tags: selectedTags,
      sort,
      dir,
      page
    })
  ])

  return (
    <QueryParamsTransition className="group/pending flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex flex-col">
            <h1 className="font-heading text-sm font-semibold">Finances</h1>
            <p className="text-xs text-muted-foreground">
              {formatLongDate(range.from)} — {formatLongDate(range.to)}
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <PeriodFilter preset={preset} range={range} bounds={bounds} />
            <ImportSheet dataset={dataset} />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6 transition-opacity *:min-w-0 sm:px-6 group-data-pending/pending:opacity-60">
        {summary.transactionCount > 0 ? (
          <>
            <SummaryCards
              summary={summary}
              previous={previous}
              comparisonLabel={
                fullMonthOf(range)
                  ? 'vs mois précédent'
                  : (COMPARISON_LABELS[preset] ?? 'vs période précédente')
              }
              days={days}
              flow={flow}
              status={status}
            />

            <div className="grid gap-4 *:min-w-0 lg:grid-cols-5">
              <CashflowCard
                className="lg:col-span-3"
                daily={dailyFlow}
                monthly={monthlyFlow}
                range={range}
              />
              <div className="lg:col-span-2">
                <SpendingByCategoryCard
                  breakdown={breakdown}
                  category={category}
                  subcategory={subcategory}
                />
              </div>
            </div>

            <div className="grid gap-4 *:min-w-0 lg:grid-cols-2">
              <TopExpensesCard expenses={topExpenses.rows} totalDebits={summary.debits} />
              <TagsCard
                summaries={tagSummaries}
                tags={tags}
                rules={tagRules}
                activeTags={selectedTags}
              />
            </div>
          </>
        ) : (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>Aucune opération sur cette période</EmptyTitle>
              <EmptyDescription>
                Les données disponibles vont du {formatLongDate(dataset.firstDate!)} au{' '}
                {formatLongDate(dataset.lastDate!)}. Choisis « Tout » ou une autre période.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        <Card className="gap-4">
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              {transactions.total} opération{transactions.total > 1 ? 's' : ''} · clique une ligne
              pour le détail
            </CardDescription>
            {transactions.total > 0 && (
              <CardAction className="text-right">
                <p className="text-xs text-muted-foreground">Total filtré</p>
                <p
                  className={cn(
                    'font-heading text-lg font-semibold tabular-nums',
                    transactions.sums.net >= 0 ? 'text-credit' : 'text-debit'
                  )}
                >
                  {formatSignedAmount(transactions.sums.net)}
                </p>
                {/* Le détail n'apporte rien quand tout va dans le même sens. */}
                {transactions.sums.credits > 0 && transactions.sums.debits > 0 && (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    +{formatAmount(transactions.sums.credits)} · −
                    {formatAmount(transactions.sums.debits)}
                  </p>
                )}
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <TransactionFilters
              options={filterOptions}
              search={search}
              category={category}
              subcategory={subcategory}
              status={status}
              flow={flow}
              tags={tags}
              selectedTags={selectedTags}
            />
            <TransactionsTable result={transactions} sort={sort} dir={dir} tags={tags} />
          </CardContent>
        </Card>
      </main>
    </QueryParamsTransition>
  )
}
