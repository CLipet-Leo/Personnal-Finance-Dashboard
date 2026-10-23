// Vérifie les calculs de période : `pnpm tsx scripts/check-period.ts`
import assert from 'node:assert/strict'

import { clampRange, fullMonthOf, monthBounds, previousRange, trailingMonths } from '@/lib/period'

// Mois entier → mois précédent entier, fin de mois conservée (30 → 31).
assert.deepEqual(previousRange({ from: '2026-09-01', to: '2026-09-30' }), {
  from: '2026-08-01',
  to: '2026-08-31'
})
// Mois en cours coupé au 22 → 1–22 du mois précédent.
assert.deepEqual(
  previousRange(clampRange({ from: '2026-10-01', to: '2026-10-31' }, '2026-10-22')),
  {
    from: '2026-09-01',
    to: '2026-09-22'
  }
)
// Trois mois → les trois mois d'avant, à cheval sur l'année.
assert.deepEqual(previousRange({ from: '2026-01-01', to: '2026-03-31' }), {
  from: '2025-10-01',
  to: '2025-12-31'
})
// Plage libre → même nombre de jours juste avant.
assert.deepEqual(previousRange({ from: '2026-03-10', to: '2026-03-19' }), {
  from: '2026-02-28',
  to: '2026-03-09'
})

// Données entièrement passées ou futures : pas de coupe.
assert.deepEqual(clampRange({ from: '2026-09-01', to: '2026-09-30' }, '2026-10-22'), {
  from: '2026-09-01',
  to: '2026-09-30'
})
assert.deepEqual(clampRange({ from: '2026-11-01', to: '2026-11-30' }, '2026-10-22'), {
  from: '2026-11-01',
  to: '2026-11-30'
})

assert.deepEqual(trailingMonths({ from: '2026-10-01', to: '2026-10-31' }), {
  from: '2025-11-01',
  to: '2026-10-31'
})
assert.deepEqual(trailingMonths({ from: '2024-01-01', to: '2026-10-31' }), {
  from: '2024-01-01',
  to: '2026-10-31'
})

console.log('check-period OK')

// Sélecteur de mois : bornes, années bissextiles, détection d'un mois entier.
assert.deepEqual(monthBounds('2028-02'), { from: '2028-02-01', to: '2028-02-29' })
assert.equal(fullMonthOf({ from: '2026-04-01', to: '2026-04-30' }), '2026-04')
assert.equal(fullMonthOf({ from: '2026-04-01', to: '2026-04-29' }), null)
assert.equal(fullMonthOf({ from: '2026-04-01', to: '2026-05-31' }), null)
console.log('check-period months OK')
