import { AppHeader } from '@/components/app-header'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Dashboard finances',
  description: 'Suivi et audit de mes finances personnelles'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      className={cn(
        'h-full',
        'antialiased',
        inter.variable,
        jetbrainsMono.variable,
        'font-mono',
        'dark'
      )}
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <AppHeader />
        {children}
      </body>
    </html>
  )
}
