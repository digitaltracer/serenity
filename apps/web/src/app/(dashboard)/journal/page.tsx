'use client'

export default function JournalPage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Journal</h1>
          <p className="text-muted-foreground mt-2">
            Daily reflections and notes
          </p>
        </div>

        <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📔</div>
          <h3 className="text-xl font-semibold mb-2">Journal Entries</h3>
          <p className="text-muted-foreground">
            API ready for journal entry management with encryption
          </p>
        </div>
      </div>
    </div>
  )
}
