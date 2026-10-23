'use client'

import { UploadSimpleIcon } from '@phosphor-icons/react'
import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { importCsvAction } from '@/app/actions/import-csv'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

const s = (count: number) => (count > 1 ? 's' : '')

export function CsvUploader() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [isDragging, setIsDragging] = useState(false)

  function handleFile(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    // Le toast de chargement est remplacé sur place (même id) par le résultat.
    const id = toast.loading('Import en cours…', { description: file.name })

    startTransition(async () => {
      try {
        const { total, imported, duplicates } = await importCsvAction(formData)
        if (total === 0) {
          toast.warning('Rien à importer', {
            id,
            description: `Aucune opération reconnue dans ${file.name}.`
          })
        } else if (imported === 0) {
          toast.info('Aucune nouvelle opération', {
            id,
            description: `${duplicates} doublon${s(duplicates)} ignoré${s(duplicates)} : ce relevé est déjà importé.`
          })
        } else {
          toast.success(`${imported} opération${s(imported)} importée${s(imported)}`, {
            id,
            description: `${total} ligne${s(total)} lue${s(total)} · ${duplicates} doublon${s(duplicates)} ignoré${s(duplicates)}`
          })
        }
      } catch {
        toast.error('Import impossible', {
          id,
          description: "Vérifie qu'il s'agit d'un export CSV valide."
        })
      }
    })
  }

  return (
    <Empty
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setIsDragging(false)
        const file = event.dataTransfer.files[0]
        if (file) handleFile(file)
      }}
      className={cn('border', isDragging && 'border-primary bg-muted/50')}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">{isPending ? <Spinner /> : <UploadSimpleIcon />}</EmptyMedia>
        <EmptyTitle>{isPending ? 'Import en cours…' : 'Importer un relevé CSV'}</EmptyTitle>
        <EmptyDescription>
          Dépose ton export bancaire ici. Les opérations déjà présentes sont ignorées
          automatiquement.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) handleFile(file)
            event.target.value = ''
          }}
        />
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          Choisir un fichier
        </Button>
      </EmptyContent>
    </Empty>
  )
}
