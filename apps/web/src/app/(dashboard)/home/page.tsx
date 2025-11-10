'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@serenity/ui'
import { CheckSquare, BookOpen, FolderOpen, Sparkles, Lightbulb, Target } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      title: 'ActionHub',
      description: 'Efficiently manage tasks, projects, and priorities with a customizable workflow.',
      icon: CheckSquare,
      route: '/actionhub',
    },
    {
      title: 'Journal',
      description: 'Capture thoughts, ideas, and reflections with a private, secure journaling system.',
      icon: BookOpen,
      route: '/journal',
    },
    {
      title: 'Projects',
      description: 'Organize related tasks into projects with visual progress tracking.',
      icon: FolderOpen,
      route: '/actionhub',
    },
    {
      title: 'AI Summaries',
      description: 'Generate AI-powered summaries of your tasks and journal entries by date range.',
      icon: Sparkles,
      route: '/summary',
    },
    {
      title: 'Insights Hub',
      description: 'AI-powered insights, analytics, and personalized recommendations.',
      icon: Lightbulb,
      route: '/insights',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-bold text-2xl">S</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Serenity Notes
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Boost your productivity and mindfulness with a powerful integrated task management and journaling experience.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Link key={feature.title} href={feature.route}>
              <Card className="group relative overflow-hidden border border-border/60 bg-card/80 backdrop-blur transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg h-full">
                <CardHeader className="relative z-10 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-primary transition-colors duration-300 group-hover:bg-primary/10">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl">{feature.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base leading-relaxed text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Get Started */}
      <div className="text-center">
        <Card className="inline-block bg-white dark:bg-gray-800">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Ready to get started?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Choose your workflow and begin your journey to enhanced productivity.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/actionhub">
                <Button>Start with Tasks</Button>
              </Link>
              <Link href="/journal">
                <Button variant="secondary">Begin Journaling</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
