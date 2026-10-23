'use client'

import { GearSixIcon, TagIcon, TrashIcon } from '@phosphor-icons/react'

import { deleteTagRuleAction } from '@/app/actions/tag-rules'
import { TagRuleForm } from '@/components/dashboard/tag-rule-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle
} from '@/components/ui/item'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { useQueryParams } from '@/hooks/use-query-params'
import { formatAmount, formatSignedAmount } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TagRuleWithMatches, TagSummary } from '@/services/DBService'

function TagsSheet({ tags, rules }: { tags: string[]; rules: TagRuleWithMatches[] }) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="ghost" size="sm">
            <GearSixIcon data-icon="inline-start" />
            Règles
          </Button>
        }
      />
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Règles de tag</SheetTitle>
          <SheetDescription>
            « Le libellé contient X → tag ». Les règles s&apos;appliquent à tout l&apos;historique
            et aux prochains imports.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 overflow-y-auto px-4 pb-4">
          <TagRuleForm tags={tags} />
          <Separator />
          {rules.length === 0 ? (
            <p className="text-muted-foreground">Aucune règle pour le moment.</p>
          ) : (
            <ItemGroup>
              {rules.map((rule) => (
                <Item key={rule.id} size="sm" variant="outline">
                  <ItemContent>
                    <ItemTitle>
                      <Badge variant="secondary">{rule.tag}</Badge>
                      <span className="truncate">{rule.pattern}</span>
                    </ItemTitle>
                    <ItemDescription>
                      {rule.matches} opération{rule.matches > 1 ? 's' : ''} contiennent ce motif
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
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
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** Moyennes mensuelles sur tout l'historique : indépendantes de la période choisie. */
export function TagsCard({
  summaries,
  tags,
  rules,
  activeTags
}: {
  summaries: TagSummary[]
  tags: string[]
  rules: TagRuleWithMatches[]
  activeTags: string[]
}) {
  const { setParams } = useQueryParams()
  const fixedCharges = summaries
    .filter((summary) => summary.monthlyAverage < 0)
    .reduce((sum, summary) => sum + summary.monthlyAverage, 0)

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Postes récurrents</CardTitle>
        <CardDescription>
          {summaries.length > 0
            ? `${formatAmount(-fixedCharges)}/mois de charges taguées, en moyenne sur l'historique`
            : 'Regroupe loyer, abonnements… à partir de leur libellé'}
        </CardDescription>
        <CardAction>
          <TagsSheet tags={tags} rules={rules} />
        </CardAction>
      </CardHeader>
      <CardContent>
        {summaries.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TagIcon />
              </EmptyMedia>
              <EmptyTitle>Aucun tag</EmptyTitle>
              <EmptyDescription>
                Ouvre une transaction ou le panneau « Règles » pour créer ta première règle.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ItemGroup>
            {summaries.map((summary) => {
              const active = activeTags.includes(summary.tag)
              return (
                <Item
                  key={summary.tag}
                  size="xs"
                  variant={active ? 'muted' : 'default'}
                  render={
                    <button
                      type="button"
                      aria-pressed={active}
                      // Chaque clic ajoute ou retire le tag : plusieurs postes se cumulent.
                      onClick={() =>
                        setParams({
                          tag: active
                            ? activeTags.filter((tag) => tag !== summary.tag)
                            : [...activeTags, summary.tag],
                          page: null
                        })
                      }
                    />
                  }
                  className="cursor-pointer text-left hover:bg-muted/50"
                >
                  <ItemContent>
                    <ItemTitle>{summary.tag}</ItemTitle>
                    <ItemDescription>
                      {summary.transactionCount} opérations · {formatSignedAmount(summary.total)} au
                      total
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions
                    className={cn(
                      'font-medium tabular-nums',
                      summary.monthlyAverage >= 0 ? 'text-credit' : 'text-debit'
                    )}
                  >
                    {formatSignedAmount(summary.monthlyAverage)}/mois
                  </ItemActions>
                </Item>
              )
            })}
          </ItemGroup>
        )}
      </CardContent>
    </Card>
  )
}
