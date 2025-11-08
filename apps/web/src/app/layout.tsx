import type { Metadata } from 'next'
import './globals.css'

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
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
