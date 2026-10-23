'use client'

import { PlusIcon } from '@phosphor-icons/react'
import { useId } from 'react'
import { useFormStatus } from 'react-dom'

import { createTagRuleAction } from '@/app/actions/tag-rules'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Spinner data-icon="inline-start" /> : <PlusIcon data-icon="inline-start" />}
      Ajouter la règle
    </Button>
  )
}

export function TagRuleForm({ tags, defaultPattern }: { tags: string[]; defaultPattern?: string }) {
  const id = useId()

  return (
    // React réinitialise le formulaire après l'action : prêt pour la règle suivante.
    <form action={createTagRuleAction} className="flex flex-col gap-3">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={`${id}-tag`}>Tag</FieldLabel>
          <Input id={`${id}-tag`} name="tag" list={`${id}-tags`} required placeholder="Loyer" />
          <datalist id={`${id}-tags`}>
            {tags.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-pattern`}>Le libellé contient</FieldLabel>
          <Input
            id={`${id}-pattern`}
            name="pattern"
            required
            defaultValue={defaultPattern}
            placeholder="SCI DUPONT"
          />
          <FieldDescription>
            Sans tenir compte de la casse. La règle la plus ancienne l&apos;emporte en cas de
            conflit.
          </FieldDescription>
        </Field>
      </FieldGroup>
      <SubmitButton />
    </form>
  )
}
