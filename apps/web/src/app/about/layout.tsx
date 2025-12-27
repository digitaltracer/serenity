import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Serenity Notes',
  description:
    'Learn about Serenity Notes features, download desktop app for macOS, and explore AI-powered productivity tools with privacy-first design.',
  openGraph: {
    title: 'About Serenity Notes',
    description: 'Features, downloads, and resources for Serenity Notes productivity app',
    url: 'https://serenitynotes.cloud/about',
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
