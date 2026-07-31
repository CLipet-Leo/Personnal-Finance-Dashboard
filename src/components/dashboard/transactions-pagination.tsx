'use client'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'
import { useQueryParams } from '@/hooks/use-query-params'

function pageWindow(page: number, pageCount: number): (number | 'ellipsis')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1)

  const pages = new Set([1, pageCount, page, page - 1, page + 1])
  const visible = [...pages]
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((a, b) => a - b)

  return visible.flatMap((value, index) =>
    index > 0 && value - visible[index - 1] > 1 ? ['ellipsis' as const, value] : [value]
  )
}

export function TransactionsPagination({
  page,
  pageCount,
  total,
  pageSize
}: {
  page: number
  pageCount: number
  total: number
  pageSize: number
}) {
  const { searchParams, setParams } = useQueryParams()

  function hrefFor(target: number) {
    const next = new URLSearchParams(searchParams.toString())
    next.set('page', String(target))
    return `?${next.toString()}`
  }

  function goTo(target: number) {
    return (event: React.MouseEvent) => {
      event.preventDefault()
      if (target < 1 || target > pageCount || target === page) return
      setParams({ page: String(target) })
    }
  }

  const first = total === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs text-muted-foreground tabular-nums">
        {first}–{last} sur {total}
      </p>
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              text="Précédent"
              href={hrefFor(page - 1)}
              onClick={goTo(page - 1)}
              aria-disabled={page === 1}
              className={page === 1 ? 'pointer-events-none opacity-50' : undefined}
            />
          </PaginationItem>
          {pageWindow(page, pageCount).map((entry, index) =>
            entry === 'ellipsis' ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={entry}>
                <PaginationLink
                  href={hrefFor(entry)}
                  onClick={goTo(entry)}
                  isActive={entry === page}
                >
                  {entry}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              text="Suivant"
              href={hrefFor(page + 1)}
              onClick={goTo(page + 1)}
              aria-disabled={page === pageCount}
              className={page === pageCount ? 'pointer-events-none opacity-50' : undefined}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
