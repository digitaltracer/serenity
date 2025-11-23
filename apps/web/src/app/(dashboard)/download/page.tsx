'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@serenity/ui'
import { Download, Apple, Monitor, CheckCircle2, Zap, Shield, Database } from 'lucide-react'

/**
 * Download page for the web app - provides links to download desktop apps
 */
export default function DownloadPage() {
  const features = [
    {
      icon: Zap,
      title: 'Offline Access',
      description: 'Work without an internet connection. Your data syncs when you reconnect.',
    },
    {
      icon: Database,
      title: 'Local Database',
      description: 'All your data stored securely on your device with SQLite.',
    },
    {
      icon: Shield,
      title: 'Enhanced Privacy',
      description: 'Your notes and tasks never leave your computer unless you choose to sync.',
    },
  ]

  return (
    <div className="flex-1 h-full bg-background">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <Download className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Download Serenity Notes
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get the full desktop experience with offline access, local storage, and enhanced features.
            </p>
          </div>

          {/* Download Cards */}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1 mb-12">
            {/* macOS Download */}
            <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 text-white">
                    <Apple className="w-8 h-8" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">macOS</CardTitle>
                    <CardDescription>For Mac computers with Apple Silicon or Intel</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      macOS 12+
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      Apple Silicon
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      Intel
                    </span>
                  </div>
                  <a
                    href="https://github.com/serenity-notes/serenity/releases/latest"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download for Mac
                  </a>
                  <p className="text-xs text-muted-foreground">
                    By downloading, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Windows - Coming Soon */}
            <Card className="relative overflow-hidden opacity-60">
              <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <span className="px-4 py-2 rounded-full bg-muted text-muted-foreground font-medium">
                  Coming Soon
                </span>
              </div>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <Monitor className="w-8 h-8" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Windows</CardTitle>
                    <CardDescription>For Windows 10 and later</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted">
                      Windows 10+
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted">
                      64-bit
                    </span>
                  </div>
                  <button
                    disabled
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-lg bg-muted text-muted-foreground font-medium cursor-not-allowed"
                  >
                    <Download className="w-5 h-5" />
                    Download for Windows
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
              Why use the desktop app?
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <Card key={feature.title} className="text-center">
                    <CardContent className="pt-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* System Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>System Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <Apple className="w-4 h-4" />
                    macOS
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>macOS 12 (Monterey) or later</li>
                    <li>Apple Silicon (M1/M2/M3) or Intel processor</li>
                    <li>4 GB RAM minimum</li>
                    <li>200 MB available disk space</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Windows (Coming Soon)
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Windows 10 or later</li>
                    <li>64-bit processor</li>
                    <li>4 GB RAM minimum</li>
                    <li>200 MB available disk space</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
