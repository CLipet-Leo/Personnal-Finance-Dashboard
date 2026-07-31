'use client'

import { ArrowLeftIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'

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
import { formatAmount, formatCompactAmount } from '@/lib/format'
import type { CategoryBreakdown } from '@/services/DBService'

const chartConfig = {
  total: { label: 'Dépenses', color: 'var(--color-debit)' }
} satisfies ChartConfig

export function SpendingByCategoryCard({ breakdown }: { breakdown: CategoryBreakdown[] }) {
  const [drilldown, setDrilldown] = useState<string | null>(null)

  const active = drilldown ? breakdown.find((entry) => entry.category === drilldown) : undefined

  const data = active
    ? active.subcategories.map((sub) => ({ label: sub.subcategory, total: sub.total }))
    : breakdown.slice(0, 12).map((entry) => ({ label: entry.category, total: entry.total }))

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>{active ? active.category : 'Dépenses par catégorie'}</CardTitle>
        <CardDescription>
          {active
            ? `Détail par sous-catégorie · ${formatAmount(active.total)}`
            : 'Clique sur une barre pour voir le détail'}
        </CardDescription>
        {active && (
          <CardAction>
            <Button variant="ghost" size="sm" onClick={() => setDrilldown(null)}>
              <ArrowLeftIcon data-icon="inline-start" />
              Toutes les catégories
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
            style={{ height: Math.max(180, data.length * 32 + 24) }}
          >
            <BarChart accessibilityLayer data={data} layout="vertical" margin={{ right: 56 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" dataKey="total" hide />
              <YAxis
                type="category"
                dataKey="label"
                width={140}
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
                radius={2}
                className={active ? undefined : 'cursor-pointer'}
                onClick={(entry) => {
                  const label = (entry as { payload?: { label?: string } }).payload?.label
                  if (!active && label) setDrilldown(label)
                }}
              >
                <LabelList
                  dataKey="total"
                  position="right"
                  className="fill-muted-foreground"
                  formatter={(value) => formatCompactAmount(Number(value))}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
