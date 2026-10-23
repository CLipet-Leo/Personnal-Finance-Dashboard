'use client'

import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useQueryParams } from '@/hooks/use-query-params'
import type { FilterOptions, FlowFilter, ReconciledFilter } from '@/services/DBService'

const STATUS_ITEMS = [
  { label: 'Tous les statuts', value: null },
  { label: 'Pointées', value: 'reconciled' },
  { label: 'Non pointées', value: 'pending' }
]

const FLOW_ITEMS = [
  { label: 'Tout', value: 'all' },
  { label: 'Entrées', value: 'in' },
  { label: 'Sorties', value: 'out' }
]

export function TransactionFilters({
  options,
  search,
  category,
  subcategory,
  status,
  flow,
  tags,
  selectedTags
}: {
  options: FilterOptions
  search: string
  category: string
  subcategory: string
  status: ReconciledFilter
  flow: FlowFilter
  tags: string[]
  selectedTags: string[]
}) {
  const { setParams } = useQueryParams()
  const [draftSearch, setDraftSearch] = useState(search)
  const [syncedSearch, setSyncedSearch] = useState(search)

  // La recherche peut venir d'ailleurs (top dépenses, fiche transaction) : on resynchronise au rendu.
  if (search !== syncedSearch) {
    setSyncedSearch(search)
    setDraftSearch(search)
  }

  // Debounce : on ne veut pas une navigation serveur par frappe clavier.
  useEffect(() => {
    if (draftSearch === search) return
    const timer = setTimeout(() => setParams({ q: draftSearch || null, page: null }), 350)
    return () => clearTimeout(timer)
  }, [draftSearch, search, setParams])

  const categoryItems = [
    { label: 'Toutes les catégories', value: null },
    ...options.map((entry) => ({ label: entry.category, value: entry.category }))
  ]

  const subcategorySource = category
    ? (options.find((entry) => entry.category === category)?.subcategories ?? [])
    : [...new Set(options.flatMap((entry) => entry.subcategories))].sort()

  const subcategoryItems = [
    { label: 'Toutes les sous-catégories', value: null },
    ...subcategorySource.map((value) => ({ label: value, value }))
  ]

  const hasFilters = Boolean(
    search || category || subcategory || status !== 'all' || flow !== 'all' || selectedTags.length
  )

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-56 flex-1">
        <MagnifyingGlassIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={draftSearch}
          onChange={(event) => setDraftSearch(event.target.value)}
          placeholder="Rechercher un libellé…"
          className="pl-8"
          aria-label="Rechercher dans les libellés"
        />
      </div>

      <ToggleGroup
        className="flex-wrap"
        variant="outline"
        size="sm"
        value={[flow]}
        onValueChange={(value: string[]) =>
          value[0] && setParams({ flow: value[0] === 'all' ? null : value[0], page: null })
        }
        aria-label="Sens des opérations"
      >
        {FLOW_ITEMS.map((item) => (
          <ToggleGroupItem key={item.value} value={item.value}>
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Select
        items={categoryItems}
        value={category || null}
        onValueChange={(value) =>
          setParams({ category: (value as string) ?? null, subcategory: null, page: null })
        }
      >
        <SelectTrigger className="w-52" aria-label="Filtrer par catégorie">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {categoryItems.map((item) => (
              <SelectItem key={item.value ?? 'all'} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        items={subcategoryItems}
        value={subcategory || null}
        onValueChange={(value) => setParams({ subcategory: (value as string) ?? null, page: null })}
      >
        <SelectTrigger className="w-56" aria-label="Filtrer par sous-catégorie">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {subcategoryItems.map((item) => (
              <SelectItem key={item.value ?? 'all'} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        items={STATUS_ITEMS}
        value={status === 'all' ? null : status}
        onValueChange={(value) => setParams({ status: (value as string) ?? null, page: null })}
      >
        <SelectTrigger className="w-44" aria-label="Filtrer par statut de pointage">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {STATUS_ITEMS.map((item) => (
              <SelectItem key={item.value ?? 'all'} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Rien à filtrer tant qu'aucune règle n'existe : on n'encombre pas la barre. */}
      {tags.length > 0 && (
        <Select
          multiple
          value={selectedTags}
          onValueChange={(value) => setParams({ tag: value as string[], page: null })}
        >
          <SelectTrigger className="w-44" aria-label="Filtrer par tags">
            <SelectValue>
              {(value: string[]) =>
                value.length === 0
                  ? 'Tous les tags'
                  : value.length === 1
                    ? value[0]
                    : `${value.length} tags`
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {tags.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setParams({
              q: null,
              category: null,
              subcategory: null,
              status: null,
              flow: null,
              tag: null,
              page: null
            })
          }
        >
          <XIcon data-icon="inline-start" />
          Réinitialiser
        </Button>
      )}
    </div>
  )
}
