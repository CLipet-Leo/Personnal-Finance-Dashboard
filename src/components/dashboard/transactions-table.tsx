'use client'

import { FolderSimpleIcon, MagnifyingGlassIcon } from '@phosphor-icons/react'
import { useState } from 'react'

import { SortableHeader } from '@/components/dashboard/sortable-header'
import { TagRuleForm } from '@/components/dashboard/tag-rule-form'
import { TransactionsPagination } from '@/components/dashboard/transactions-pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { useQueryParams } from '@/hooks/use-query-params'
import { formatLongDate, formatShortDate, formatSignedAmount } from '@/lib/format'
import { cn } from '@/lib/utils'
import type {
  SortColumn,
  SortDirection,
  TransactionPage,
  TransactionRow
} from '@/services/DBService'

function TransactionDetails({
  row,
  tags,
  onNavigate
}: {
  row: TransactionRow
  tags: string[]
  onNavigate: (updates: Record<string, string | null>) => void
}) {
  const details = [
    ['Libellé complet', row.fullLabel],
    ['Catégorie', row.category || 'Non catégorisé'],
    ['Sous-catégorie', row.subcategory],
    ["Date d'opération", row.operationDate && formatLongDate(row.operationDate)],
    ['Date de valeur', row.valueDate && formatLongDate(row.valueDate)],
    ['Référence', row.reference],
    ['Informations', row.additionalInfo],
    ['Pointage', row.reconciled ? 'Pointée' : 'Non pointée']
  ].filter((entry): entry is [string, string] => Boolean(entry[1]))

  return (
    <>
      <SheetHeader>
        <SheetTitle className="pr-8">{row.shortLabel}</SheetTitle>
        <SheetDescription>
          {formatLongDate(row.accountingDate)}
          {row.operationType && ` · ${row.operationType}`}
        </SheetDescription>
      </SheetHeader>
      <div className="flex flex-col gap-6 overflow-y-auto px-4 pb-4">
        <p
          className={cn(
            'font-heading text-3xl font-semibold tabular-nums',
            row.amount >= 0 ? 'text-credit' : 'text-debit'
          )}
        >
          {formatSignedAmount(row.amount)}
        </p>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          {details.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="[overflow-wrap:anywhere]">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate({ q: row.shortLabel, page: null })}
          >
            <MagnifyingGlassIcon data-icon="inline-start" />
            Opérations similaires
          </Button>
          {row.category && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate({ category: row.category, subcategory: null, page: null })}
            >
              <FolderSimpleIcon data-icon="inline-start" />
              Même catégorie
            </Button>
          )}
        </div>

        <Separator />

        {row.tag ? (
          <p className="flex items-center gap-2">
            Tag <Badge variant="secondary">{row.tag}</Badge>
            <span className="text-muted-foreground">attribué par une règle de libellé</span>
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="font-medium">Créer une règle de tag</p>
            {/* key : formulaire neuf, pré-rempli, à chaque transaction ouverte. */}
            <TagRuleForm key={row.id} tags={tags} defaultPattern={row.shortLabel} />
          </div>
        )}
      </div>
    </>
  )
}

export function TransactionsTable({
  result,
  sort,
  dir,
  tags
}: {
  result: TransactionPage
  sort: SortColumn
  dir: SortDirection
  tags: string[]
}) {
  const { setParams } = useQueryParams()
  // On garde l'id, pas la ligne : après création d'une règle, le tag revalidé apparaît dans la fiche.
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selected = result.rows.find((row) => row.id === selectedId)

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-none border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader column="date" label="Date" sort={sort} dir={dir} />
              <SortableHeader column="label" label="Libellé" sort={sort} dir={dir} />
              <SortableHeader column="category" label="Catégorie" sort={sort} dir={dir} />
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
                <TableCell colSpan={5}>
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
                <TableRow
                  key={row.id}
                  data-state={row.id === selectedId ? 'selected' : undefined}
                  className="cursor-pointer"
                  onClick={() => setSelectedId(row.id)}
                >
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {formatShortDate(row.accountingDate)}
                  </TableCell>
                  <TableCell className="max-w-sm">
                    <div className="flex items-center gap-2">
                      {/* Cible clavier de la ligne ; la souris peut cliquer n'importe où. */}
                      <button
                        type="button"
                        className="truncate text-left outline-none hover:underline focus-visible:underline"
                        title={row.fullLabel ?? row.shortLabel}
                      >
                        {row.shortLabel}
                      </button>
                      {row.tag && (
                        <Badge variant="secondary" className="shrink-0">
                          {row.tag}
                        </Badge>
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
                    {row.subcategory && <span className="block text-xs">{row.subcategory}</span>}
                  </TableCell>
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

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="sm:max-w-md">
          {selected && (
            <TransactionDetails
              row={selected}
              tags={tags}
              onNavigate={(updates) => {
                setSelectedId(null)
                setParams(updates)
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
