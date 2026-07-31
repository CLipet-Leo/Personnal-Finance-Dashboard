import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ScalesIcon,
  SealQuestionIcon
} from '@phosphor-icons/react/ssr'

import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { formatAmount, formatSignedAmount } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { PeriodSummary } from '@/services/DBService'

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
  valueClassName
}: {
  label: string
  value: string
  hint: string
  icon: React.ComponentType<{ className?: string }>
  valueClassName?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardAction>
          <Icon className="size-4 text-muted-foreground" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p className={cn('font-heading text-2xl tabular-nums', valueClassName)}>{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}

export function SummaryCards({ summary }: { summary: PeriodSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        label="Entrées"
        value={formatAmount(summary.credits)}
        hint="Total des crédits sur la période"
        icon={ArrowDownLeftIcon}
        valueClassName="text-credit"
      />
      <SummaryCard
        label="Sorties"
        value={formatAmount(summary.debits)}
        hint="Total des débits sur la période"
        icon={ArrowUpRightIcon}
        valueClassName="text-debit"
      />
      <SummaryCard
        label="Solde net"
        value={formatSignedAmount(summary.net)}
        hint={`${summary.transactionCount} transaction${summary.transactionCount > 1 ? 's' : ''}`}
        icon={ScalesIcon}
        valueClassName={summary.net >= 0 ? 'text-credit' : 'text-debit'}
      />
      <Card>
        <CardHeader>
          <CardDescription>Non pointées</CardDescription>
          <CardAction>
            <SealQuestionIcon className="size-4 text-muted-foreground" />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <p className="font-heading text-2xl tabular-nums">{summary.unreconciledCount}</p>
          <p className="text-xs text-muted-foreground">
            {summary.unreconciledCount === 0 ? (
              <Badge variant="secondary">Tout est pointé</Badge>
            ) : (
              'Opérations restant à vérifier'
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
