import { PlusIcon, TrashIcon } from '@phosphor-icons/react/ssr'
import Link from 'next/link'

import { createTagRuleAction, deleteTagRuleAction } from '@/app/actions/tag-rules'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { formatAmount, formatSignedAmount } from '@/lib/format'
import { searchParamsFrom } from '@/lib/period'
import { cn } from '@/lib/utils'
import { dbService } from '@/services/DBService'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function TagsPage({ searchParams }: PageProps) {
  const params = searchParamsFrom(await searchParams)
  const [tags, rules, summaries, dataset] = await Promise.all([
    dbService.getTags(),
    dbService.getTagRules(),
    dbService.getTagSummaries(),
    dbService.getDatasetInfo()
  ])

  // Ouvre le dashboard filtré sur le tag, sur toute la plage de données disponible.
  const dashboardHref = (tag: string) =>
    `/?${new URLSearchParams({
      tag,
      period: 'custom',
      from: dataset.firstDate ?? '',
      to: dataset.lastDate ?? ''
    })}`

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-xl">Tags</h1>
        <p className="text-xs text-muted-foreground">
          Regroupe tes opérations dans des catégories personnelles (loyer, abonnements…) à partir de
          leur libellé. Les règles s&apos;appliquent à tout l&apos;historique et aux prochains
          imports.
        </p>
      </div>

      {summaries.length > 0 && (
        <Card className="gap-4">
          <CardHeader>
            <CardTitle>Récapitulatif</CardTitle>
            <CardDescription>Moyenne calculée sur tous les mois présents en base.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-none border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tag</TableHead>
                    <TableHead className="text-right">Opérations</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Par mois</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaries.map((summary) => (
                    <TableRow key={summary.tag}>
                      <TableCell>
                        <Link href={dashboardHref(summary.tag)}>
                          <Badge variant="secondary">{summary.tag}</Badge>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {summary.transactionCount}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatSignedAmount(summary.total)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-medium tabular-nums',
                          summary.monthlyAverage >= 0 ? 'text-credit' : 'text-debit'
                        )}
                      >
                        {formatAmount(summary.monthlyAverage)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="gap-4">
        <CardHeader>
          <CardTitle>Nouvelle règle</CardTitle>
          <CardDescription>
            Une opération reçoit le tag de la première règle (la plus ancienne) dont le motif
            apparaît dans son libellé, sans tenir compte de la casse.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createTagRuleAction} className="flex flex-wrap items-end gap-3">
            <Field className="min-w-48 flex-1">
              <FieldLabel htmlFor="tag">Tag</FieldLabel>
              <Input id="tag" name="tag" list="tag-list" required placeholder="Loyer" />
              <datalist id="tag-list">
                {tags.map((tag) => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>
            </Field>
            <Field className="min-w-48 flex-1">
              <FieldLabel htmlFor="pattern">Le libellé contient</FieldLabel>
              <Input
                id="pattern"
                name="pattern"
                required
                defaultValue={params.get('pattern') ?? ''}
                placeholder="SCI DUPONT"
              />
            </Field>
            <Button type="submit">
              <PlusIcon data-icon="inline-start" />
              Ajouter
            </Button>
          </form>
          <FieldDescription className="mt-2">
            Astuce : depuis la table du dashboard, l&apos;icône à côté d&apos;un libellé pré-remplit
            ce formulaire.
          </FieldDescription>
        </CardContent>
      </Card>

      {rules.length > 0 && (
        <Card className="gap-4">
          <CardHeader>
            <CardTitle>Règles</CardTitle>
            <CardDescription>
              Le nombre d&apos;opérations compte toutes celles qui contiennent le motif, même si une
              règle plus ancienne leur a déjà attribué un autre tag.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-none border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tag</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead className="text-right">Opérations</TableHead>
                    <TableHead className="w-0" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <Badge variant="secondary">{rule.tag}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{rule.pattern}</TableCell>
                      <TableCell
                        className={cn(
                          'text-right tabular-nums',
                          rule.matches === 0 && 'text-muted-foreground'
                        )}
                      >
                        {rule.matches}
                      </TableCell>
                      <TableCell>
                        <form action={deleteTagRuleAction}>
                          <input type="hidden" name="id" value={rule.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Supprimer la règle « ${rule.pattern} »`}
                          >
                            <TrashIcon />
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
