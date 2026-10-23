'use client'

import { CalendarBlankIcon, CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'
import { fr } from 'date-fns/locale'
import { useState } from 'react'
import type { DateRange as CalendarRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useQueryParams } from '@/hooks/use-query-params'
import { formatMediumDate, formatMonthName, formatMonthYear } from '@/lib/format'
import {
  fromLocalDate,
  fullMonthOf,
  monthBounds,
  PERIOD_PRESETS,
  toLocalDate,
  type DateRange,
  type Period
} from '@/lib/period'

const MONTH_INDEXES = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'))

/** Grille des 12 mois d'une année ; seuls les mois couverts par l'historique sont actifs. */
function MonthPicker({ selected, bounds }: { selected: string | null; bounds: DateRange }) {
  const { setParams } = useQueryParams()
  const firstMonth = bounds.from.slice(0, 7)
  const lastMonth = bounds.to.slice(0, 7)
  const initialYear = Number((selected ?? lastMonth).slice(0, 4))

  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(initialYear)

  function select(month: string) {
    setParams({ period: 'custom', ...monthBounds(month), page: null })
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        // Rouvre toujours sur l'année du mois affiché.
        if (next) setYear(initialYear)
        setOpen(next)
      }}
    >
      <PopoverTrigger
        render={
          <Button variant={selected ? 'secondary' : 'outline'} size="sm">
            <CalendarBlankIcon data-icon="inline-start" />
            {selected ? formatMonthYear(selected) : 'Mois'}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-64">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={year <= Number(firstMonth.slice(0, 4))}
            onClick={() => setYear(year - 1)}
            aria-label="Année précédente"
          >
            <CaretLeftIcon />
          </Button>
          <span className="font-medium tabular-nums" aria-live="polite">
            {year}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={year >= Number(lastMonth.slice(0, 4))}
            onClick={() => setYear(year + 1)}
            aria-label="Année suivante"
          >
            <CaretRightIcon />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {MONTH_INDEXES.map((index) => {
            const month = `${year}-${index}`
            return (
              <Button
                key={month}
                variant={month === selected ? 'default' : 'ghost'}
                size="sm"
                disabled={month < firstMonth || month > lastMonth}
                aria-pressed={month === selected}
                aria-label={formatMonthYear(month)}
                onClick={() => select(month)}
              >
                {formatMonthName(month)}
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function PeriodFilter({ preset, range, bounds }: Period & { bounds: DateRange }) {
  const { setParams } = useQueryParams()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<CalendarRange | undefined>({
    from: toLocalDate(range.from),
    to: toLocalDate(range.to)
  })

  // Un mois entier choisi à la main s'affiche dans le sélecteur de mois, pas comme plage libre.
  const selectedMonth = preset === 'custom' ? fullMonthOf(range) : null

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
      <ToggleGroup
        className="flex-wrap"
        variant="outline"
        size="sm"
        value={preset === 'custom' ? [] : [preset]}
        onValueChange={(value: string[]) => {
          // Un changement de période remet la pagination à zéro.
          if (value[0]) setParams({ period: value[0], from: null, to: null, page: null })
        }}
        aria-label="Période"
      >
        {PERIOD_PRESETS.map((item) => (
          <ToggleGroupItem key={item.value} value={item.value}>
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <MonthPicker selected={selectedMonth} bounds={bounds} />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant={preset === 'custom' && !selectedMonth ? 'secondary' : 'outline'}
              size="sm"
            >
              {formatMediumDate(range.from)} — {formatMediumDate(range.to)}
            </Button>
          }
        />
        <PopoverContent align="end" className="w-auto">
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
