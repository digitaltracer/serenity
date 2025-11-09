'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@serenity/ui'
import { CheckSquare, BookOpen, FolderOpen, BarChart3 } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      title: 'ActionHub',
      description: 'Efficiently manage tasks, projects, and priorities with a customizable workflow.',
      icon: CheckSquare,
      route: '/actionhub',
      color: 'text-blue-500',
    },
    {
      title: 'Journal',
      description: 'Capture thoughts, ideas, and reflections with a private, secure journaling system.',
      icon: BookOpen,
      route: '/journal',
      color: 'text-green-500',
    },
    {
      title: 'Projects',
      description: 'Organize related tasks into projects with visual progress tracking.',
      icon: FolderOpen,
      route: '/actionhub',
      color: 'text-purple-500',
    },
    {
      title: 'Analytics',
      description: 'Gain insights into your productivity patterns and achievements.',
      icon: BarChart3,
      route: '/analytics',
      color: 'text-orange-500',
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
              <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${feature.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-gray-900 dark:text-gray-100">{feature.title}</CardTitle>
                  </div>
                  <CardDescription className="text-gray-600 dark:text-gray-400">{feature.description}</CardDescription>
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
