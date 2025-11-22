import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Serenity Notes',
  description: 'Your productivity companion with tasks, journal, and AI insights',
}

// Inline script to set theme before first paint (prevents flash of wrong theme)
const themeScript = `
  (function() {
    try {
      const stored = localStorage.getItem('serenity-theme');
      const theme = stored ? JSON.parse(stored) : 'system';
      const resolvedTheme = theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
      document.documentElement.classList.add(resolvedTheme);
      document.body.classList.add(resolvedTheme);
    } catch (e) {}
  })();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
