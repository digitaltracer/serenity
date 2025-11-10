'use client'

import { Card, CardContent } from '@serenity/ui'
import { Database } from 'lucide-react'

export default function DatabasePage() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Database className="w-6 h-6 text-green-600 dark:text-green-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Database
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Database configuration and management
        </p>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4">🗄️</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Cloud Database Integration
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Your data is automatically synced to our secure cloud database.
            Database configuration and management features for self-hosted setups coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
