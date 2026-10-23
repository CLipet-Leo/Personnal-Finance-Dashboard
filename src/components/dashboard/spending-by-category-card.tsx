'use client'

import { ArrowLeftIcon } from '@phosphor-icons/react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from 'recharts'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { useQueryParams } from '@/hooks/use-query-params'
import { formatAmount, formatCompactAmount, formatPercent } from '@/lib/format'
import type { CategoryBreakdown } from '@/services/DBService'

const chartConfig = {
  total: { label: 'Dépenses', color: 'var(--color-debit)' }
} satisfies ChartConfig

/**
 * Le drill-down est piloté par les filtres `category` / `subcategory` de l'URL :
 * cliquer une barre filtre aussi la table des transactions.
 */
export function SpendingByCategoryCard({
  breakdown,
  category,
  subcategory
}: {
  breakdown: CategoryBreakdown[]
  category: string
  subcategory: string
}) {
  const { setParams } = useQueryParams()
  const active = breakdown.find((entry) => entry.category === category)
  const grandTotal = breakdown.reduce((sum, entry) => sum + entry.total, 0)
  const base = active ? active.total : grandTotal

  const data = (
    active
      ? active.subcategories.map((sub) => ({ label: sub.subcategory, total: sub.total }))
      : breakdown.slice(0, 10).map((entry) => ({ label: entry.category, total: entry.total }))
  ).map((entry) => ({
    ...entry,
    display: `${formatCompactAmount(entry.total)} · ${formatPercent(entry.total / base)}`
  }))

  function select(label: string) {
    if (active) setParams({ subcategory: label === subcategory ? null : label, page: null })
    else setParams({ category: label, subcategory: null, page: null })
  }

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>{active ? active.category : 'Dépenses par catégorie'}</CardTitle>
        <CardDescription>
          {active
            ? `${formatAmount(active.total)} · ${formatPercent(active.total / grandTotal)} des sorties`
            : `${formatAmount(grandTotal)} au total · clique une catégorie pour filtrer`}
        </CardDescription>
        {active && (
          <CardAction>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setParams({ category: null, subcategory: null, page: null })}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Tout
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Aucune dépense</EmptyTitle>
              <EmptyDescription>Aucun débit enregistré sur cette période.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto w-full"
            style={{ height: Math.max(180, data.length * 30 + 16) }}
          >
            <BarChart accessibilityLayer data={data} layout="vertical" margin={{ right: 112 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" dataKey="total" hide />
              <YAxis
                type="category"
                dataKey="label"
                width={150}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel={false}
                    formatter={(value) => (
                      <span className="font-mono tabular-nums">{formatAmount(Number(value))}</span>
                    )}
                  />
                }
              />
              <Bar
                dataKey="total"
                fill="var(--color-total)"
                radius={1}
                className="cursor-pointer"
                onClick={(entry) => {
                  const label = (entry as { payload?: { label?: string } }).payload?.label
                  if (label) select(label)
                }}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.label}
                    fillOpacity={!subcategory || entry.label === subcategory ? 1 : 0.35}
                  />
                ))}
                <LabelList dataKey="display" position="right" className="fill-muted-foreground" />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
