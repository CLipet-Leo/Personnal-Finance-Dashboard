'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { db } from '@/db'
import { tagRules } from '@/db/schema'

export async function createTagRuleAction(formData: FormData) {
  const tag = String(formData.get('tag') ?? '').trim()
  const pattern = String(formData.get('pattern') ?? '').trim()
  if (!tag || !pattern) throw new Error('Tag et motif requis')

  await db.insert(tagRules).values({ tag, pattern })

  revalidatePath('/')
}

export async function deleteTagRuleAction(formData: FormData) {
  const id = Number(formData.get('id'))
  if (!Number.isInteger(id)) throw new Error('Identifiant invalide')

  await db.delete(tagRules).where(eq(tagRules.id, id))

  revalidatePath('/')
}
