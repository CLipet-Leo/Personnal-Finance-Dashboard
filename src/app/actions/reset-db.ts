'use server'

import { revalidatePath } from 'next/cache'

import { db } from '@/db'
import { transactions } from '@/db/schema'

export async function resetTransactionsAction() {
  const deleted = await db.delete(transactions).returning({ id: transactions.id })

  revalidatePath('/')
  revalidatePath('/import')

  return { deleted: deleted.length }
}
