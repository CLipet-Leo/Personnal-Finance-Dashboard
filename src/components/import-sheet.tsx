'use client'

import { UploadSimpleIcon } from '@phosphor-icons/react'

import { CsvUploader } from '@/components/csv-uploader'
import { ResetDatabaseButton } from '@/components/reset-database-button'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { formatLongDate } from '@/lib/format'
import type { DatasetInfo } from '@/services/DBService'

export function ImportSheet({ dataset }: { dataset: DatasetInfo }) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button size="sm">
            <UploadSimpleIcon data-icon="inline-start" />
            Importer
          </Button>
        }
      />
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Données</SheetTitle>
          <SheetDescription>
            {dataset.total === 0
              ? 'Aucune opération enregistrée pour le moment.'
              : `${dataset.total} opérations, du ${formatLongDate(dataset.firstDate!)} au ${formatLongDate(dataset.lastDate!)}.`}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 overflow-y-auto px-4 pb-4">
          <CsvUploader />
          <Separator />
          <div className="flex flex-col gap-2">
            <p className="font-medium">Réinitialisation</p>
            <p className="text-muted-foreground">
              Supprime toutes les opérations pour repartir d&apos;un import propre. Les règles de
              tag sont conservées. Équivalent : <code>pnpm db:reset</code>.
            </p>
            <div>
              <ResetDatabaseButton total={dataset.total} />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
