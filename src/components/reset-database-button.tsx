'use client'

import { TrashIcon } from '@phosphor-icons/react'
import { useState, useTransition } from 'react'

import { resetTransactionsAction } from '@/app/actions/reset-db'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export function ResetDatabaseButton({ total }: { total: number }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function reset() {
    startTransition(async () => {
      await resetTransactionsAction()
      setOpen(false)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="outline" size="sm" disabled={total === 0}>
            <TrashIcon data-icon="inline-start" />
            Vider la base
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Vider la base ?</AlertDialogTitle>
          <AlertDialogDescription>
            Les {total} opérations enregistrées seront définitivement supprimées. Tu devras
            réimporter tes relevés CSV.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={isPending} onClick={reset}>
            {isPending && <Spinner data-icon="inline-start" />}
            Tout supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
