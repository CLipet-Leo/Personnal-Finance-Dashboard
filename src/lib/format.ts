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

export function formatLongDate(iso: string): string {
  return longDate.format(fromIsoDate(iso))
}
