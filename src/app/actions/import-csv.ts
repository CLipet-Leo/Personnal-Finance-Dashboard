'use server'

import { revalidatePath } from 'next/cache'

import { db } from '@/db'
import { transactions } from '@/db/schema'
import { CSVParserService } from '@/services/CSVParserService'

export type ImportResult = {
  total: number
  imported: number
  duplicates: number
}

export async function importCsvAction(formData: FormData): Promise<ImportResult> {
  const file = formData.get('file') as File | null
  if (!file) throw new Error('Aucun fichier fourni')

  const buffer = Buffer.from(await file.arrayBuffer())
  const content = buffer.toString('latin1') // à ajuster si tes exports sont en utf-8

  const rows = CSVParserService.parseCsvContent(content)
  const values = CSVParserService.toTransactionValues(rows)

  if (values.length === 0) return { total: 0, imported: 0, duplicates: 0 }

  const inserted = await db
    .insert(transactions)
    .values(values)
    .onConflictDoNothing()
    .returning({ id: transactions.id })

  revalidatePath('/')

  return {
    total: values.length,
    imported: inserted.length,
    duplicates: values.length - inserted.length
  }
}
