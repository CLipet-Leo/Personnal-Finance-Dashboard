import { fromIsoDate } from '@/lib/period'

const currency = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2
})

const compactCurrency = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  notation: 'compact',
  maximumFractionDigits: 1
})

const shortDate = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC'
})

const mediumDate = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC'
})

const monthLabel = new Intl.DateTimeFormat('fr-FR', {
  month: 'short',
  year: '2-digit',
  timeZone: 'UTC'
})

const percent = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 0 })

const longDate = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC'
})

export function formatAmount(value: number): string {
  return currency.format(value)
}

export function formatCompactAmount(value: number): string {
  return compactCurrency.format(value)
}

export function formatSignedAmount(value: number): string {
  return `${value > 0 ? '+' : ''}${currency.format(value)}`
}

export function formatShortDate(iso: string): string {
  return shortDate.format(fromIsoDate(iso))
}

export function formatMediumDate(iso: string): string {
  return mediumDate.format(fromIsoDate(iso))
}

export function formatLongDate(iso: string): string {
  return longDate.format(fromIsoDate(iso))
}

/** `2026-10` → « oct. 26 ». */
export function formatMonth(month: string): string {
  return monthLabel.format(fromIsoDate(`${month}-01`))
}

export function formatPercent(ratio: number): string {
  return percent.format(ratio)
}

const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: 'UTC' })
const monthYear = new Intl.DateTimeFormat('fr-FR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC'
})

/** `2026-04` → « avr. ». */
export function formatMonthName(month: string): string {
  return monthName.format(fromIsoDate(`${month}-01`))
}

/** `2026-04` → « avril 2026 ». */
export function formatMonthYear(month: string): string {
  return monthYear.format(fromIsoDate(`${month}-01`))
}
