'use client'

import { Card, CardContent } from '@serenity/ui'
import { Sparkles } from 'lucide-react'

export default function SummaryPage() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            AI Summaries
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Generate AI-powered summaries of your tasks and journal entries
        </p>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4">✨</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            AI Summary Generation
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Connect your AI provider in Settings to generate intelligent summaries of your
            productivity data by date range. Get insights from your tasks, journal entries, and more.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
