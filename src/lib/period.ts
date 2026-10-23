import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  endOfMonth,
  isLastDayOfMonth,
  startOfMonth,
  subDays,
  subMonths
} from 'date-fns'

export type PeriodPreset = 'current' | 'previous' | 'quarter' | 'year' | 'all' | 'custom'

export const PERIOD_PRESETS: { value: Exclude<PeriodPreset, 'custom'>; label: string }[] = [
  { value: 'current', label: 'Ce mois' },
  { value: 'previous', label: 'Mois dernier' },
  { value: 'quarter', label: '3 mois' },
  { value: 'year', label: '12 mois' },
  { value: 'all', label: 'Tout' }
]

export type DateRange = {
  from: string // ISO yyyy-mm-dd inclus
  to: string // ISO yyyy-mm-dd inclus
}

export type Period = {
  preset: PeriodPreset
  range: DateRange
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function toIsoDate(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
    date.getUTCDate()
  ).padStart(2, '0')}`
}

export function fromIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

/** react-day-picker raisonne en dates locales : conversions dédiées. */
export function toLocalDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function fromLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

/** monthOffset 0 = mois en cours, -1 = mois précédent. */
export function monthRange(monthOffset: number, today = new Date()): DateRange {
  const year = today.getUTCFullYear()
  const month = today.getUTCMonth() + monthOffset
  return {
    from: toIsoDate(new Date(Date.UTC(year, month, 1))),
    to: toIsoDate(new Date(Date.UTC(year, month + 1, 0)))
  }
}

/** `2026-04` → du 1er au dernier jour d'avril 2026. */
export function monthBounds(month: string): DateRange {
  const [year, index] = month.split('-').map(Number)
  return { from: `${month}-01`, to: toIsoDate(new Date(Date.UTC(year, index, 0))) }
}

/** Le mois `yyyy-mm` si la plage couvre exactement un mois calendaire, sinon null. */
export function fullMonthOf(range: DateRange): string | null {
  const month = range.from.slice(0, 7)
  return monthBounds(month).to === range.to && range.from.endsWith('-01') ? month : null
}

/**
 * La période vit dans l'URL : c'est la source de vérité partagée entre les
 * Server Components (qui requêtent) et les filtres client (qui naviguent).
 */
export function resolvePeriod(params: URLSearchParams, bounds?: DateRange | null): Period {
  const preset = params.get('period')
  const from = params.get('from')
  const to = params.get('to')

  if (preset === 'custom' && from && to && ISO_DATE.test(from) && ISO_DATE.test(to)) {
    return {
      preset: 'custom',
      range: from <= to ? { from, to } : { from: to, to: from }
    }
  }

  if (preset === 'previous') return { preset: 'previous', range: monthRange(-1) }
  if (preset === 'quarter')
    return { preset: 'quarter', range: { from: monthRange(-2).from, to: monthRange(0).to } }
  if (preset === 'year')
    return { preset: 'year', range: { from: monthRange(-11).from, to: monthRange(0).to } }
  if (preset === 'all' && bounds) return { preset: 'all', range: bounds }

  return { preset: 'current', range: monthRange(0) }
}

/**
 * Coupe la période à la dernière opération connue : « ce mois » au 22 se compare
 * alors au 1–22 du mois précédent, pas au mois précédent entier.
 */
export function clampRange(range: DateRange, lastDate: string | null): DateRange {
  return lastDate && lastDate >= range.from && lastDate < range.to
    ? { from: range.from, to: lastDate }
    : range
}

/**
 * Période de même durée juste avant. Une période qui commence le 1er recule en
 * mois calendaires (le 31 reste une fin de mois), sinon en nombre de jours.
 */
export function previousRange(range: DateRange): DateRange {
  const from = toLocalDate(range.from)
  const to = toLocalDate(range.to)

  if (from.getDate() === 1) {
    const months = differenceInCalendarMonths(to, from) + 1
    const previousTo = subMonths(to, months)
    return {
      from: fromLocalDate(subMonths(from, months)),
      to: fromLocalDate(isLastDayOfMonth(to) ? endOfMonth(previousTo) : previousTo)
    }
  }

  const days = differenceInCalendarDays(to, from) + 1
  return { from: fromLocalDate(subDays(from, days)), to: fromLocalDate(subDays(to, days)) }
}

/** Au moins `count` mois glissants jusqu'à la fin de la période, plus si elle est plus longue. */
export function trailingMonths(range: DateRange, count = 12): DateRange {
  const start = fromLocalDate(startOfMonth(subMonths(toLocalDate(range.to), count - 1)))
  return { from: start < range.from ? start : range.from, to: range.to }
}

export function searchParamsFrom(
  params: Record<string, string | string[] | undefined>
): URLSearchParams {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') search.set(key, value)
    // Clés répétées (?tag=a&tag=b) conservées : `get` lit la première, `getAll` toutes.
    else if (Array.isArray(value)) value.forEach((item) => search.append(key, item))
  }
  return search
}
