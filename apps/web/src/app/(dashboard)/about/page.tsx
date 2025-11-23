'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@serenity/ui'
import {
  Download,
  Apple,
  Monitor,
  CheckCircle2,
  Zap,
  Shield,
  Database,
  Heart,
  Github,
  ExternalLink,
  BookOpen,
  Target,
  Brain,
  Sparkles,
} from 'lucide-react'

/**
 * About page for the web app - app info, features, and download links
 */
export default function AboutPage() {
  const appFeatures = [
    {
      icon: Target,
      title: 'Task Management',
      description: 'Organize tasks with projects, priorities, tags, and due dates.',
    },
    {
      icon: BookOpen,
      title: 'Journaling',
      description: 'Capture thoughts and track your mood with rich journal entries.',
    },
    {
      icon: Brain,
      title: 'AI Insights',
      description: 'Get intelligent analysis of your productivity patterns.',
    },
    {
      icon: Sparkles,
      title: 'AI Summaries',
      description: 'Generate summaries of your tasks and journal entries.',
    },
  ]

  const desktopBenefits = [
    {
      icon: Zap,
      title: 'Offline Access',
      description: 'Work without an internet connection.',
    },
    {
      icon: Database,
      title: 'Local Database',
      description: 'Data stored securely on your device.',
    },
    {
      icon: Shield,
      title: 'Enhanced Privacy',
      description: 'Your data never leaves your computer.',
    },
  ]

  return (
    <div className="flex-1 h-full bg-background">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <span className="text-3xl font-bold text-primary">S</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Serenity Notes
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A productivity app that combines task management with journaling,
              enhanced by AI-powered insights to help you stay organized and mindful.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Version 1.0.0
            </p>
          </div>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>
                Everything you need to boost productivity and mindfulness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {appFeatures.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <div key={feature.title} className="flex gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Download Desktop App */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Download Desktop App
              </CardTitle>
              <CardDescription>
                Get the full experience with offline access and local storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Benefits */}
              <div className="grid gap-3 sm:grid-cols-3">
                {desktopBenefits.map((benefit) => {
                  const Icon = benefit.icon
                  return (
                    <div key={benefit.title} className="text-center p-3 rounded-lg bg-muted/50">
                      <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                      <h4 className="text-sm font-medium text-foreground">{benefit.title}</h4>
                      <p className="text-xs text-muted-foreground">{benefit.description}</p>
                    </div>
                  )
                })}
              </div>

              {/* Download Options */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* macOS */}
                <div className="p-4 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <Apple className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">macOS</h4>
                      <p className="text-xs text-muted-foreground">macOS 12+</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      Apple Silicon
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      Intel
                    </span>
                  </div>
                  <a
                    href="https://github.com/serenity-notes/serenity/releases/latest"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download for Mac
                  </a>
                </div>

                {/* Windows */}
                <div className="p-4 rounded-lg border border-border bg-card opacity-60">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Monitor className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Windows</h4>
                      <p className="text-xs text-muted-foreground">Coming Soon</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                      Windows 10+
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                      64-bit
                    </span>
                  </div>
                  <button
                    disabled
                    className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    Coming Soon
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Links */}
          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://github.com/serenity-notes/serenity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
                <a
                  href="https://github.com/serenity-notes/serenity/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
                >
                  Report an Issue
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground pb-8">
            <p className="flex items-center justify-center gap-1">
              Made with <Heart className="w-4 h-4 text-red-500" /> by the Serenity Notes team
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
