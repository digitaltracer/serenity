'use client'

export default function AnalyticsPage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Productivity insights and statistics
          </p>
        </div>

        <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">Analytics Dashboard</h3>
          <p className="text-muted-foreground">
            Stats API ready for productivity tracking
          </p>
        </div>
      </div>
    </div>
  )
}
