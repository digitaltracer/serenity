'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

export default function ActionHubPage() {
  const dispatch = useDispatch()

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">ActionHub</h1>
          <p className="text-muted-foreground mt-2">
            Manage your tasks and projects
          </p>
        </div>

        <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold mb-2">Task Management</h3>
          <p className="text-muted-foreground mb-4">
            Full UI integration with existing components coming soon
          </p>
          <p className="text-sm text-muted-foreground">
            API endpoints are ready. Connect to @serenity/ui components next.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 border border-border rounded-lg">
            <h4 className="font-semibold mb-2">✅ Phase 1</h4>
            <p className="text-sm text-muted-foreground">Foundation & Infrastructure</p>
          </div>
          <div className="p-6 border border-border rounded-lg">
            <h4 className="font-semibold mb-2">✅ Phase 2</h4>
            <p className="text-sm text-muted-foreground">Authentication & Encryption</p>
          </div>
          <div className="p-6 border border-border rounded-lg">
            <h4 className="font-semibold mb-2">✅ Phase 3</h4>
            <p className="text-sm text-muted-foreground">Core API Endpoints</p>
          </div>
        </div>
      </div>
    </div>
  )
}
