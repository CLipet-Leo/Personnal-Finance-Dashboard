import { FileArrowUpIcon } from '@phosphor-icons/react/ssr'
import Link from 'next/link'

import { CashflowChart } from '@/components/dashboard/cashflow-chart'
import { PeriodFilter } from '@/components/dashboard/period-filter'
import { SpendingByCategoryCard } from '@/components/dashboard/spending-by-category-card'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { TransactionFilters } from '@/components/dashboard/transaction-filters'
import { TransactionsTable } from '@/components/dashboard/transactions-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty'
import { formatLongDate } from '@/lib/format'
import { resolvePeriod, searchParamsFrom } from '@/lib/period'
import {
  dbService,
  SORT_COLUMNS,
  type ReconciledFilter,
  type SortColumn,
  type SortDirection
} from '@/services/DBService'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function parseSort(value: string | null): SortColumn {
  return value && value in SORT_COLUMNS ? (value as SortColumn) : 'date'
}

function parseStatus(value: string | null): ReconciledFilter {
  return value === 'reconciled' || value === 'pending' ? value : 'all'
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = searchParamsFrom(await searchParams)
  const { preset, range } = resolvePeriod(params)

  const dataset = await dbService.getDatasetInfo()

  if (dataset.total === 0) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileArrowUpIcon />
            </EmptyMedia>
            <EmptyTitle>Aucune donnée</EmptyTitle>
            <EmptyDescription>
              Importe un premier relevé CSV pour alimenter le dashboard.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button nativeButton={false} render={<Link href="/import" />}>
              Importer un relevé
            </Button>
          </EmptyContent>
        </Empty>
      </main>
    )
  }

  const search = params.get('q') ?? ''
  const category = params.get('category') ?? ''
  const subcategory = params.get('subcategory') ?? ''
  const status = parseStatus(params.get('status'))
  const tag = params.get('tag') ?? ''
  const sort = parseSort(params.get('sort'))
  const dir: SortDirection = params.get('dir') === 'asc' ? 'asc' : 'desc'
  const page = Number(params.get('page')) || 1

  const [summary, dailyFlow, breakdown, filterOptions, tags, transactions] = await Promise.all([
    dbService.getPeriodSummary(range),
    dbService.getDailyFlow(range),
    dbService.getSpendingBreakdown(range),
    dbService.getFilterOptions(),
    dbService.getTags(),
    dbService.getTransactions({
      range,
      search,
      category,
      subcategory,
      status,
      tag,
      sort,
      dir,
      page
    })
  ])

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-xl">Vue d&apos;ensemble</h1>
          <p className="text-xs text-muted-foreground">
            {formatLongDate(range.from)} — {formatLongDate(range.to)}
          </p>
        </div>
        <PeriodFilter preset={preset} range={range} />
      </div>

      {summary.transactionCount > 0 ? (
        <>
          <SummaryCards summary={summary} />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="gap-4">
              <CardHeader>
                <CardTitle>Entrées et sorties</CardTitle>
                <CardDescription>Évolution quotidienne sur la période</CardDescription>
              </CardHeader>
              <CardContent>
                <CashflowChart data={dailyFlow} />
              </CardContent>
            </Card>

            <SpendingByCategoryCard breakdown={breakdown} />
          </div>
        </>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Aucune opération sur cette période</EmptyTitle>
            <EmptyDescription>
              Les données disponibles vont du {formatLongDate(dataset.firstDate!)} au{' '}
              {formatLongDate(dataset.lastDate!)}. Change de période ou importe un nouveau relevé.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <Card className="gap-4">
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            Vue d&apos;audit : trie, filtre et vérifie les opérations une à une
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <TransactionFilters
            options={filterOptions}
            search={search}
            category={category}
            subcategory={subcategory}
            status={status}
            tags={tags}
            tag={tag}
          />
          <TransactionsTable result={transactions} sort={sort} dir={dir} />
        </CardContent>
      </Card>
    </main>
  )
}
