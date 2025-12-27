import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  metadataBase: new URL('https://serenitynotes.cloud'),
  title: {
    default: 'Serenity Notes - AI-Powered Productivity & Journal App',
    template: '%s | Serenity Notes',
  },
  description:
    'Privacy-first productivity app combining task management, journaling, and AI-powered insights. End-to-end encrypted, self-hosted, with offline support.',
  keywords: [
    'productivity app',
    'task management',
    'journal app',
    'AI insights',
    'privacy-focused',
    'end-to-end encryption',
    'self-hosted',
    'offline-first',
    'note-taking',
    'goal tracking',
    'AI-powered productivity',
    'secure notes',
    'digital journal',
  ],
  authors: [{ name: 'Serenity Notes Team' }],
  creator: 'Serenity Notes',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://serenitynotes.cloud',
    title: 'Serenity Notes - AI-Powered Productivity & Journal App',
    description: 'Privacy-first productivity app with tasks, journaling, and AI insights',
    siteName: 'Serenity Notes',
    images: [
      {
        url: '/logo-light.png',
        width: 1200,
        height: 630,
        alt: 'Serenity Notes Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Serenity Notes - AI-Powered Productivity & Journal App',
    description: 'Privacy-first productivity app with tasks, journaling, and AI insights',
    images: ['/logo-light.png'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  icons: {
    icon: [{ url: '/logo-flat.svg', type: 'image/svg+xml' }],
    apple: '/logo-light.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Serenity Notes',
  },
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
