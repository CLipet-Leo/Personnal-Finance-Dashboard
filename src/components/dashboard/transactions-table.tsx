import { TagIcon } from '@phosphor-icons/react/ssr'
import Link from 'next/link'

import { SortableHeader } from '@/components/dashboard/sortable-header'
import { TransactionsPagination } from '@/components/dashboard/transactions-pagination'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { formatShortDate, formatSignedAmount } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { SortColumn, SortDirection, TransactionPage } from '@/services/DBService'

export function TransactionsTable({
  result,
  sort,
  dir
}: {
  result: TransactionPage
  sort: SortColumn
  dir: SortDirection
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-none border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader column="date" label="Date" sort={sort} dir={dir} />
              <SortableHeader column="label" label="Libellé" sort={sort} dir={dir} />
              <SortableHeader column="category" label="Catégorie" sort={sort} dir={dir} />
              <TableHead>Sous-catégorie</TableHead>
              <TableHead>Pointage</TableHead>
              <SortableHeader
                column="amount"
                label="Montant"
                sort={sort}
                dir={dir}
                className="text-right"
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>Aucune transaction</EmptyTitle>
                      <EmptyDescription>
                        Aucune opération ne correspond à la période et aux filtres sélectionnés.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              result.rows.map((row) => (
                <TableRow key={row.id} className="group">
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {formatShortDate(row.accountingDate)}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="flex items-center gap-2">
                      <span className="truncate" title={row.fullLabel ?? row.shortLabel}>
                        {row.shortLabel}
                      </span>
                      {row.tag ? (
                        <Badge variant="secondary" className="shrink-0">
                          {row.tag}
                        </Badge>
                      ) : (
                        <Link
                          href={`/tags?${new URLSearchParams({ pattern: row.shortLabel })}`}
                          prefetch={false}
                          className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
                          aria-label={`Créer une règle de tag pour « ${row.shortLabel} »`}
                          title="Créer une règle de tag"
                        >
                          <TagIcon className="size-3.5" />
                        </Link>
                      )}
                    </div>
                    {row.operationType && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {row.operationType}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.category || 'Non catégorisé'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.subcategory || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={row.reconciled ? 'secondary' : 'outline'}>
                      {row.reconciled ? 'Pointée' : 'Non pointée'}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-medium whitespace-nowrap tabular-nums',
                      row.amount >= 0 ? 'text-credit' : 'text-debit'
                    )}
                  >
                    {formatSignedAmount(row.amount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {result.pageCount > 1 && (
        <TransactionsPagination
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
          pageSize={result.pageSize}
        />
      )}
    </div>
  )
}
