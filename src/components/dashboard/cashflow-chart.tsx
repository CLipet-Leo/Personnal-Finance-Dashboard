'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart'
import { formatAmount, formatCompactAmount, formatShortDate } from '@/lib/format'
import type { DailyFlow } from '@/services/DBService'

const chartConfig = {
  credits: { label: 'Entrées', color: 'var(--color-credit)' },
  debits: { label: 'Sorties', color: 'var(--color-debit)' }
} satisfies ChartConfig

export function CashflowChart({ data }: { data: DailyFlow[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
      <AreaChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
        <defs>
          <linearGradient id="fill-credits" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-credits)" stopOpacity={0.6} />
            <stop offset="95%" stopColor="var(--color-credits)" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="fill-debits" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-debits)" stopOpacity={0.6} />
            <stop offset="95%" stopColor="var(--color-debits)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={formatShortDate}
        />
        <YAxis
          width={64}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={formatCompactAmount}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) => formatShortDate(String(value))}
              formatter={(value, name) => (
                <>
                  <span className="text-muted-foreground">
                    {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                  </span>
                  <span className="ml-auto font-mono tabular-nums">
                    {formatAmount(Number(value))}
                  </span>
                </>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          dataKey="credits"
          type="monotone"
          stroke="var(--color-credits)"
          fill="url(#fill-credits)"
          strokeWidth={2}
        />
        <Area
          dataKey="debits"
          type="monotone"
          stroke="var(--color-debits)"
          fill="url(#fill-debits)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
