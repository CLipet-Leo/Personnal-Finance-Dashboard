import { readFileSync } from 'node:fs'

import { db } from '../src/db'
import { transactions } from '../src/db/schema'
import { CSVParserService } from '../src/services/CSVParserService'

async function main() {
  const path = process.argv[2] ?? 'data/source.csv'
  // "latin1" si les accents ressortent corrompus en "utf-8"
  const rows = CSVParserService.parseCsvContent(readFileSync(path, 'latin1'))
  const values = CSVParserService.toTransactionValues(rows)

  if (values.length === 0) {
    console.log('Aucune ligne à importer.')
    return
  }

  const inserted = await db
    .insert(transactions)
    .values(values)
    .onConflictDoNothing()
    .returning({ id: transactions.id })

  console.log(
    `${values.length} lignes lues · ${inserted.length} importées · ${values.length - inserted.length} doublons ignorés.`
  )
}

main()
