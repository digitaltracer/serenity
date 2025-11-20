import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Serenity Notes',
  description: 'Your productivity companion with tasks, journal, and AI insights',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
