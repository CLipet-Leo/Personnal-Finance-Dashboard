'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useTransition,
  type TransitionStartFunction
} from 'react'

const TransitionContext = createContext<TransitionStartFunction | null>(null)

/**
 * Pose `data-pending` pendant le rendu serveur déclenché par un changement de
 * filtre : l'ancien contenu reste affiché, estompé, au lieu de figer sans retour.
 */
export function QueryParamsTransition({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  const [isPending, startTransition] = useTransition()
  return (
    <TransitionContext value={startTransition}>
      <div data-pending={isPending || undefined} aria-busy={isPending} className={className}>
        {children}
      </div>
    </TransitionContext>
  )
}

/**
 * Les filtres vivent dans l'URL : les Server Components restent la seule source
 * de données, et l'état est partageable / restaurable au rechargement.
 */
export function useQueryParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const startTransition = useContext(TransitionContext)

  const setParams = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const next = new URLSearchParams(searchParams.toString())

      for (const [key, value] of Object.entries(updates)) {
        next.delete(key)
        // Un tableau devient une clé répétée : ?tag=a&tag=b.
        for (const item of [value ?? []].flat()) if (item) next.append(key, item)
      }

      const query = next.toString()
      const navigate = () =>
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
      if (startTransition) startTransition(navigate)
      else navigate()
    },
    [pathname, router, searchParams, startTransition]
  )

  return { searchParams, setParams }
}
