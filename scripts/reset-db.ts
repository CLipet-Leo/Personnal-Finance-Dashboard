import { count } from 'drizzle-orm'
import { createInterface } from 'node:readline/promises'

import { db } from '../src/db'
import { transactions } from '../src/db/schema'

async function main() {
  const [{ total }] = await db.select({ total: count() }).from(transactions)

  if (total === 0) {
    console.log('La base est déjà vide.')
    return
  }

  if (!process.argv.includes('--yes') && !process.argv.includes('-y')) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const answer = await rl.question(`Supprimer les ${total} opérations ? (oui/non) `)
    rl.close()

    if (!['o', 'oui', 'y', 'yes'].includes(answer.trim().toLowerCase())) {
      console.log('Annulé.')
      return
    }
  }

  await db.delete(transactions)
  console.log(`${total} opérations supprimées.`)
}

main()
