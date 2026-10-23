'use client'

import {
  ArrowDownLeftIcon,
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  ScalesIcon,
  SealQuestionIcon
} from '@phosphor-icons/react'

import { Card, CardAction, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { useQueryParams } from '@/hooks/use-query-params'
import { formatAmount, formatPercent, formatSignedAmount } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { FlowFilter, PeriodSummary, ReconciledFilter } from '@/services/DBService'

/** Variation relative ; `goodWhenUp` inverse la couleur pour les dépenses. */
function Delta({
  current,
  previous,
  goodWhenUp,
  label
}: {
  current: number
  previous: number | undefined
  goodWhenUp: boolean
  label: string
}) {
  if (!previous) return <span>Historique insuffisant pour comparer</span>
  const ratio = (current - previous) / previous
  const Icon = ratio >= 0 ? ArrowUpRightIcon : ArrowDownRightIcon
  const good = ratio >= 0 === goodWhenUp

  return (
    <span className="flex items-center gap-1">
      <span
        className={cn('flex items-center gap-0.5 font-medium', good ? 'text-credit' : 'text-debit')}
      >
        <Icon aria-hidden className="size-3" />
        {ratio >= 0 ? '+' : ''}
        {formatPercent(ratio)}
      </span>
      {label}
    </span>
  )
}

function KpiCard({
  label,
  value,
  icon: Icon,
  valueClassName,
  active,
  onToggle,
  children
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  valueClassName?: string
  active?: boolean
  onToggle?: () => void
  children: React.ReactNode
}) {
  return (
    <Card
      className={cn(
        'relative transition-colors',
        onToggle && 'hover:bg-muted/40',
        active && 'bg-muted/40 ring-primary'
      )}
    >
      <CardHeader>
        <CardDescription>
          {onToggle ? (
            // Bouton étiré sur toute la carte : une seule cible clavier, nom accessible = le libellé.
            <button
              type="button"
              aria-pressed={active}
              onClick={onToggle}
              className="cursor-pointer outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring"
            >
              {label}
            </button>
          ) : (
            label
          )}
        </CardDescription>
        <CardAction>
          <Icon className="size-4 text-muted-foreground" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p className={cn('font-heading text-2xl font-semibold tabular-nums', valueClassName)}>
          {value}
        </p>
        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">{children}</div>
      </CardContent>
    </Card>
  )
}

export function SummaryCards({
  summary,
  previous,
  comparisonLabel,
  days,
  flow,
  status
}: {
  summary: PeriodSummary
  previous: PeriodSummary | null
  comparisonLabel: string
  days: number
  flow: FlowFilter
  status: ReconciledFilter
}) {
  const { setParams } = useQueryParams()
  const toggleFlow = (value: FlowFilter) => () =>
    setParams({ flow: flow === value ? null : value, page: null })

  const savingsRate = summary.credits > 0 ? summary.net / summary.credits : null

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Entrées"
        value={formatAmount(summary.credits)}
        icon={ArrowDownLeftIcon}
        valueClassName="text-credit"
        active={flow === 'in'}
        onToggle={toggleFlow('in')}
      >
        <Delta
          current={summary.credits}
          previous={previous?.credits}
          goodWhenUp
          label={comparisonLabel}
        />
      </KpiCard>
      <KpiCard
        label="Sorties"
        value={formatAmount(summary.debits)}
        icon={ArrowUpRightIcon}
        valueClassName="text-debit"
        active={flow === 'out'}
        onToggle={toggleFlow('out')}
      >
        <Delta
          current={summary.debits}
          previous={previous?.debits}
          goodWhenUp={false}
          label={comparisonLabel}
        />
        <span>{formatAmount(summary.debits / days)} par jour en moyenne</span>
      </KpiCard>
      <KpiCard
        label="Solde net"
        value={formatSignedAmount(summary.net)}
        icon={ScalesIcon}
        valueClassName={summary.net >= 0 ? 'text-credit' : 'text-debit'}
      >
        {savingsRate === null ? (
          'Aucune entrée sur la période'
        ) : (
          <span>
            Taux d&apos;épargne{' '}
            <span className="font-medium text-foreground">{formatPercent(savingsRate)}</span>
            {previous && previous.transactionCount > 0 && (
              <> · solde précédent {formatSignedAmount(previous.net)}</>
            )}
          </span>
        )}
      </KpiCard>
      <KpiCard
        label="À pointer"
        value={String(summary.unreconciledCount)}
        icon={SealQuestionIcon}
        active={status === 'pending'}
        onToggle={() => setParams({ status: status === 'pending' ? null : 'pending', page: null })}
      >
        {summary.unreconciledCount === 0
          ? 'Tout est pointé'
          : `sur ${summary.transactionCount} opérations · cliquer pour filtrer`}
      </KpiCard>
    </div>
  )
}
