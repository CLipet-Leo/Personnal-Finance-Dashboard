'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { buttonVariants } from '@/components/ui/button'

const LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/import', label: 'Import' }
]

export function AppHeader() {
  const pathname = usePathname()

  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <span className="font-heading text-sm">Finances</span>
        <nav className="flex items-center gap-1">
          {LINKS.map((link, i) => (
            <Link
              key={i}
              href={link.href}
              prefetch={false}
              className={buttonVariants({
                variant: pathname === link.href ? 'secondary' : 'ghost'
              })}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
