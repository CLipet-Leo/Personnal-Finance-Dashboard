'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle
} from '@/components/ui/item'
import { useQueryParams } from '@/hooks/use-query-params'
import { formatPercent, formatShortDate, formatSignedAmount } from '@/lib/format'
import type { TransactionRow } from '@/services/DBService'

/** Les plus gros débits de la période ; un clic cherche les opérations au même libellé. */
export function TopExpensesCard({
  expenses,
  totalDebits
}: {
  expenses: TransactionRow[]
  totalDebits: number
}) {
  const { setParams } = useQueryParams()
  const share = expenses.reduce((sum, row) => sum - row.amount, 0) / (totalDebits || 1)

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Plus grosses dépenses</CardTitle>
        <CardDescription>
          {expenses.length > 0
            ? `Ces ${expenses.length} opérations pèsent ${formatPercent(share)} des sorties`
            : 'Aucune dépense sur la période'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {expenses.map((row) => (
            <Item
              key={row.id}
              size="xs"
              render={
                <button
                  type="button"
                  onClick={() => setParams({ q: row.shortLabel, page: null })}
                  aria-label={`Rechercher les opérations « ${row.shortLabel} »`}
                />
              }
              className="cursor-pointer text-left hover:bg-muted/50"
            >
              <ItemContent className="min-w-0">
                <ItemTitle className="w-full truncate">{row.shortLabel}</ItemTitle>
                <ItemDescription>
                  {formatShortDate(row.accountingDate)} · {row.category || 'Non catégorisé'}
                  {row.tag && ` · ${row.tag}`}
                </ItemDescription>
              </ItemContent>
              <ItemActions className="font-medium text-debit tabular-nums">
                {formatSignedAmount(row.amount)}
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  )
}
