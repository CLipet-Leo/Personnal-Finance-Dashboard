'use client'

import { CheckCircleIcon, UploadSimpleIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useRef, useState, useTransition } from 'react'

import { importCsvAction, type ImportResult } from '@/app/actions/import-csv'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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

export function CsvUploader() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleFile(file: File) {
    setResult(null)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    startTransition(async () => {
      try {
        setResult(await importCsvAction(formData))
      } catch {
        setError("Le fichier n'a pas pu être importé. Vérifie qu'il s'agit d'un export CSV valide.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
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

      {error && (
        <Alert variant="destructive">
          <WarningCircleIcon />
          <AlertTitle>Import impossible</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert>
          <CheckCircleIcon />
          <AlertTitle>
            {result.imported} opération{result.imported > 1 ? 's' : ''} importée
            {result.imported > 1 ? 's' : ''}
          </AlertTitle>
          <AlertDescription>
            {result.total} ligne{result.total > 1 ? 's' : ''} lue{result.total > 1 ? 's' : ''} ·{' '}
            {result.duplicates} doublon{result.duplicates > 1 ? 's' : ''} ignoré
            {result.duplicates > 1 ? 's' : ''}.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
