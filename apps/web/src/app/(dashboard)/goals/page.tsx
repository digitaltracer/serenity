'use client'

import { Card, CardContent } from '@serenity/ui'

export default function GoalsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Goals
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your goals and progress
        </p>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Goal Tracking
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            API ready for goal management and progress tracking
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
