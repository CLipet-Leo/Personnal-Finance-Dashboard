'use client'

import { CalendarBlankIcon } from '@phosphor-icons/react'
import { fr } from 'date-fns/locale'
import { useState } from 'react'
import type { DateRange as CalendarRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQueryParams } from '@/hooks/use-query-params'
import { formatLongDate } from '@/lib/format'
import { fromLocalDate, toLocalDate, type Period } from '@/lib/period'

export function PeriodFilter({ preset, range }: Period) {
  const { setParams } = useQueryParams()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<CalendarRange | undefined>({
    from: toLocalDate(range.from),
    to: toLocalDate(range.to)
  })

  function selectPreset(value: string) {
    if (value === 'custom') {
      setOpen(true)
      return
    }
    // Un changement de période remet la pagination à zéro.
    setParams({ period: value, from: null, to: null, page: null })
  }

  function applyCustomRange() {
    if (!draft?.from) return
    setParams({
      period: 'custom',
      from: fromLocalDate(draft.from),
      to: fromLocalDate(draft.to ?? draft.from),
      page: null
    })
    setOpen(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Tabs value={preset} onValueChange={selectPreset}>
        <TabsList>
          <TabsTrigger value="current">Mois en cours</TabsTrigger>
          <TabsTrigger value="previous">Mois précédent</TabsTrigger>
          <TabsTrigger value="custom">Personnalisée</TabsTrigger>
        </TabsList>
      </Tabs>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button variant="outline" size="sm">
              <CalendarBlankIcon data-icon="inline-start" />
              {formatLongDate(range.from)} — {formatLongDate(range.to)}
            </Button>
          }
        />
        <PopoverContent align="start" className="w-auto">
          <Calendar
            mode="range"
            locale={fr}
            numberOfMonths={2}
            defaultMonth={toLocalDate(range.from)}
            selected={draft}
            onSelect={setDraft}
          />
          <Button size="sm" disabled={!draft?.from} onClick={applyCustomRange}>
            Appliquer
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  )
}
