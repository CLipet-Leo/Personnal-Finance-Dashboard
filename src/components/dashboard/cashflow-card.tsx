'use client'

import { useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis
} from 'recharts'

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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useQueryParams } from '@/hooks/use-query-params'
import {
  formatAmount,
  formatCompactAmount,
  formatMonth,
  formatShortDate,
  formatSignedAmount
} from '@/lib/format'
import { monthBounds, type DateRange } from '@/lib/period'
import { cn } from '@/lib/utils'
import type { DailyFlow, MonthlyFlow } from '@/services/DBService'

const chartConfig = {
  credits: { label: 'Entrées', color: 'var(--color-credit)' },
  debits: { label: 'Sorties', color: 'var(--color-debit)' },
  net: { label: 'Solde', color: 'var(--color-chart-2)' },
  balance: { label: 'Solde cumulé', color: 'var(--color-primary)' }
} satisfies ChartConfig

const VIEWS = [
  { value: 'balance', label: 'Solde cumulé' },
  { value: 'daily', label: 'Quotidien' },
  { value: 'monthly', label: '12 mois' }
] as const

type View = (typeof VIEWS)[number]['value']

function amountTooltip(labelFormatter: (value: string) => string) {
  return (
    <ChartTooltipContent
      labelFormatter={(value) => labelFormatter(String(value))}
      formatter={(value, name) => (
        <>
          <span className="text-muted-foreground">
            {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
          </span>
          <span className="ml-auto font-mono tabular-nums">{formatAmount(Number(value))}</span>
        </>
      )}
    />
  )
}

const axisProps = { tickLine: false, axisLine: false, tickMargin: 8 } as const

export function CashflowCard({
  daily,
  monthly,
  range,
  className
}: {
  daily: DailyFlow[]
  monthly: MonthlyFlow[]
  range: DateRange
  className?: string
}) {
  const { setParams } = useQueryParams()
  const [view, setView] = useState<View>('balance')

  const balance = daily.reduce<{ date: string; balance: number }[]>(
    (acc, day) => [...acc, { date: day.date, balance: (acc.at(-1)?.balance ?? 0) + day.net }],
    []
  )
  const finalBalance = balance.at(-1)?.balance ?? 0

  const months = monthly.length || 1
  const averageDebits = monthly.reduce((sum, month) => sum + month.debits, 0) / months
  const averageNet = monthly.reduce((sum, month) => sum + month.net, 0) / months

  const fromMonth = range.from.slice(0, 7)
  const toMonth = range.to.slice(0, 7)
  const inPeriod = (month: string) => month >= fromMonth && month <= toMonth

  // Clic sur un mois : la période entière du dashboard bascule sur ce mois.
  function focusMonth(month: string) {
    const target = monthBounds(month)
    setParams({ period: 'custom', from: target.from, to: target.to, page: null })
  }

  const description = {
    balance: `Évolution du solde sur la période · ${formatSignedAmount(finalBalance)} à la fin`,
    daily: 'Entrées et sorties jour par jour',
    monthly: `Sorties moyennes ${formatAmount(averageDebits)}/mois · solde moyen ${formatSignedAmount(averageNet)}/mois — clique un mois pour l'explorer`
  }[view]

  return (
    <Card className={cn('gap-4', className)}>
      <CardHeader>
        <CardTitle>Trésorerie</CardTitle>
        <CardDescription>{description}</CardDescription>
        {/* Sous le titre sur mobile, à droite au-delà. */}
        <CardAction className="max-sm:col-start-1 max-sm:row-span-1 max-sm:row-start-3 max-sm:justify-self-start">
          <ToggleGroup
            className="flex-wrap"
            variant="outline"
            size="sm"
            value={[view]}
            onValueChange={(value: string[]) => value[0] && setView(value[0] as View)}
            aria-label="Vue du graphique"
          >
            {VIEWS.map((item) => (
              <ToggleGroupItem key={item.value} value={item.value}>
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
          {view === 'balance' ? (
            <AreaChart data={balance} margin={{ left: 4, right: 4, top: 8 }}>
              <defs>
                <linearGradient id="fill-balance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-balance)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-balance)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                minTickGap={24}
                tickFormatter={formatShortDate}
                {...axisProps}
              />
              <YAxis width={64} tickFormatter={formatCompactAmount} {...axisProps} />
              <ReferenceLine y={0} stroke="var(--color-border)" />
              <ChartTooltip content={amountTooltip(formatShortDate)} />
              <Area
                dataKey="balance"
                type="stepAfter"
                stroke="var(--color-balance)"
                fill="url(#fill-balance)"
                strokeWidth={2}
              />
            </AreaChart>
          ) : view === 'daily' ? (
            <BarChart data={daily} margin={{ left: 4, right: 4, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                minTickGap={24}
                tickFormatter={formatShortDate}
                {...axisProps}
              />
              <YAxis width={64} tickFormatter={formatCompactAmount} {...axisProps} />
              <ChartTooltip content={amountTooltip(formatShortDate)} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="credits" fill="var(--color-credits)" radius={1} />
              <Bar dataKey="debits" fill="var(--color-debits)" radius={1} />
            </BarChart>
          ) : (
            <ComposedChart data={monthly} margin={{ left: 4, right: 4, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickFormatter={formatMonth} {...axisProps} />
              <YAxis width={64} tickFormatter={formatCompactAmount} {...axisProps} />
              <ReferenceLine
                y={averageDebits}
                stroke="var(--color-debits)"
                strokeDasharray="4 4"
                label={{
                  value: 'moy. sorties',
                  position: 'insideTopRight',
                  className: 'fill-muted-foreground text-[10px]'
                }}
              />
              <ChartTooltip content={amountTooltip(formatMonth)} />
              <ChartLegend content={<ChartLegendContent />} />
              {(['credits', 'debits'] as const).map((key) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={`var(--color-${key})`}
                  radius={1}
                  className="cursor-pointer"
                  onClick={(entry) => {
                    const month = (entry as { payload?: MonthlyFlow }).payload?.month
                    if (month) focusMonth(month)
                  }}
                >
                  {/* Les mois hors période restent visibles pour le contexte, mais estompés. */}
                  {monthly.map((month) => (
                    <Cell key={month.month} fillOpacity={inPeriod(month.month) ? 1 : 0.35} />
                  ))}
                </Bar>
              ))}
              <Line
                dataKey="net"
                type="monotone"
                stroke="var(--color-net)"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            </ComposedChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
