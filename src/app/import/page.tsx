import { CsvUploader } from '@/components/csv-uploader'
import { ResetDatabaseButton } from '@/components/reset-database-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatLongDate } from '@/lib/format'
import { dbService } from '@/services/DBService'

// Le récapitulatif dépend du contenu de la base : jamais de version prérendue.
export const dynamic = 'force-dynamic'

export default async function ImportPage() {
  const dataset = await dbService.getDatasetInfo()

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-xl">Import</h1>
        <p className="text-xs text-muted-foreground">
          {dataset.total === 0
            ? 'Aucune opération enregistrée pour le moment.'
            : `${dataset.total} opérations enregistrées, du ${formatLongDate(
                dataset.firstDate!
              )} au ${formatLongDate(dataset.lastDate!)}.`}
        </p>
      </div>

      <Card className="gap-4">
        <CardHeader>
          <CardTitle>Relevé bancaire CSV</CardTitle>
          <CardDescription>
            Séparateur « ; », dates au format JJ/MM/AAAA. La déduplication se fait sur la date de
            comptabilisation, la référence et le montant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CsvUploader />
        </CardContent>
      </Card>

      <Card className="gap-4">
        <CardHeader>
          <CardTitle>Réinitialisation</CardTitle>
          <CardDescription>
            Supprime toutes les opérations pour repartir d&apos;un import propre. Équivalent en
            ligne de commande : <code>pnpm db:reset</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetDatabaseButton total={dataset.total} />
        </CardContent>
      </Card>
    </main>
  )
}
