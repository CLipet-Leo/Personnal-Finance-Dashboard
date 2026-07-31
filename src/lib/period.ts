export type PeriodPreset = 'current' | 'previous' | 'custom'

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

/**
 * La période vit dans l'URL : c'est la source de vérité partagée entre les
 * Server Components (qui requêtent) et les filtres client (qui naviguent).
 */
export function resolvePeriod(params: URLSearchParams): Period {
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

  return { preset: 'current', range: monthRange(0) }
}

export function searchParamsFrom(
  params: Record<string, string | string[] | undefined>
): URLSearchParams {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') search.set(key, value)
    else if (Array.isArray(value) && value[0]) search.set(key, value[0])
  }
  return search
}
