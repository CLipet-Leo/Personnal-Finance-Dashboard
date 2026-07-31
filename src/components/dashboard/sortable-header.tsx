'use client'

import { ArrowDownIcon, ArrowUpIcon, ArrowsDownUpIcon } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { TableHead } from '@/components/ui/table'
import { useQueryParams } from '@/hooks/use-query-params'
import { cn } from '@/lib/utils'
import type { SortColumn, SortDirection } from '@/services/DBService'

export function SortableHeader({
  column,
  label,
  sort,
  dir,
  className
}: {
  column: SortColumn
  label: string
  sort: SortColumn
  dir: SortDirection
  className?: string
}) {
  const { setParams } = useQueryParams()
  const isActive = sort === column
  const Icon = isActive ? (dir === 'asc' ? ArrowUpIcon : ArrowDownIcon) : ArrowsDownUpIcon

  return (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        className={cn('-mx-2', !isActive && 'text-muted-foreground')}
        aria-sort={isActive ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
        onClick={() =>
          setParams({
            sort: column,
            dir: isActive && dir === 'desc' ? 'asc' : 'desc',
            page: null
          })
        }
      >
        {label}
        <Icon data-icon="inline-end" />
      </Button>
    </TableHead>
  )
}
