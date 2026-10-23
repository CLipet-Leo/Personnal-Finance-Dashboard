// Vérifie le calcul des tags sur une base en mémoire : `pnpm tsx scripts/check-tags.ts`
import assert from 'node:assert/strict'

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

import * as schema from '@/db/schema'
import { DBService } from '@/services/DBService'

async function main() {
  const db = drizzle(new Database(':memory:'), { schema })
  migrate(db, { migrationsFolder: 'src/drizzle' })

  const tx = (date: string, shortLabel: string, amount: number) => ({
    accountingDate: date,
    shortLabel,
    amount,
    fingerprint: `${date}-${shortLabel}-${amount}`
  })
  await db
    .insert(schema.transactions)
    .values([
      tx('2026-01-05', 'PRLV SCI DUPONT LOYER', -800),
      tx('2026-02-05', 'PRLV SCI DUPONT LOYER', -800),
      tx('2026-02-10', 'NETFLIX.COM', -14),
      tx('2026-03-01', 'CARREFOUR', -60)
    ])
  await db.insert(schema.tagRules).values([
    { tag: 'Loyer', pattern: 'sci dupont' },
    { tag: 'Abonnements', pattern: 'netflix' },
    { tag: 'Autre', pattern: 'PRLV' } // plus récente : ne doit pas écraser « Loyer »
  ])

  const service = new DBService(db)
  const range = { from: '2026-01-01', to: '2026-12-31' }

  const loyer = await service.getTransactions({ range, tags: ['Loyer'] })
  assert.equal(loyer.total, 2)
  assert.ok(loyer.rows.every((row) => row.tag === 'Loyer'))
  assert.equal((await service.getTransactions({ range, tags: ['Autre'] })).total, 0)

  const several = await service.getTransactions({ range, tags: ['Loyer', 'Abonnements'] })
  assert.equal(several.total, 3)
  assert.equal(several.sums.net, -1614)

  const summaries = await service.getTagSummaries()
  // 3 mois présents en base : 1600 / 3 pour le loyer.
  assert.deepEqual(
    summaries.map((s) => [s.tag, s.transactionCount, s.total, Math.round(s.monthlyAverage)]),
    [
      ['Loyer', 2, -1600, -533],
      ['Abonnements', 1, -14, -5]
    ]
  )

  const rules = await service.getTagRules()
  assert.equal(rules.find((rule) => rule.tag === 'Autre')?.matches, 2)
  assert.deepEqual(await service.getTags(), ['Abonnements', 'Autre', 'Loyer'])

  console.log('check-tags OK')
}

main()
