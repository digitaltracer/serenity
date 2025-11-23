'use client'

export const dynamic = 'force-dynamic'

import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { SummaryPage } from '@serenity/ui/pages'
import {
  setSummaries,
  addSummary,
  removeSummary,
  setSummariesLoading,
  setSummariesGenerating,
  setSummariesError,
  type AppDispatch,
} from '@serenity/core'

interface Summary {
  id: string
  title: string
  content: string
  summaryType: string
  startDate: string
  endDate: string
  generatedAt: string
  wordCount: number
  metadata?: {
    tags?: string[]
    [key: string]: unknown
  }
  provider?: string
}

/**
 * Web-specific wrapper for the shared SummaryPage
 * Provides API-based handlers for web app
 */
export default function SummaryPageWrapper() {
  const dispatch = useDispatch<AppDispatch>()

  // Load summaries from API (called by shared component on mount)
  const handleLoadSummaries = useCallback(async () => {
    try {
      dispatch(setSummariesLoading(true))
      const response = await fetch('/api/summary')
      const data = await response.json()

      if (data.success && data.summaries) {
        dispatch(setSummaries(data.summaries))
      } else if (data.error) {
        dispatch(setSummariesError(data.error))
      }
    } catch (error) {
      dispatch(setSummariesError('Failed to fetch summaries'))
      console.error('Error fetching summaries:', error)
    } finally {
      dispatch(setSummariesLoading(false))
    }
  }, [dispatch])

  // Generate summary via API
  const handleGenerateSummary = useCallback(async (params: {
    startDate: string
    endDate: string
    types: ('tasks' | 'journal')[]
  }) => {
    try {
      dispatch(setSummariesGenerating(true))
      dispatch(setSummariesError(null))

      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: params.startDate,
          endDate: params.endDate,
          types: params.types,
        }),
      })

      const data = await response.json()

      if (data.success && data.summary) {
        dispatch(addSummary(data.summary))
      } else {
        const errorMessage = data.error || 'Failed to generate summary'
        dispatch(setSummariesError(errorMessage))
        // Show error to user
        alert(errorMessage)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary'
      dispatch(setSummariesError(errorMessage))
      alert(errorMessage)
      console.error('Error generating summary:', error)
    } finally {
      dispatch(setSummariesGenerating(false))
    }
  }, [dispatch])

  // Delete summary via API
  const handleDeleteSummary = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/summary/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        dispatch(removeSummary(id))
      } else {
        alert(data.error || 'Failed to delete summary')
      }
    } catch (error) {
      console.error('Error deleting summary:', error)
      alert('Failed to delete summary')
    }
  }, [dispatch])

  // Export summary (client-side download)
  const handleExportSummary = useCallback(async (id: string) => {
    try {
      // Fetch the summary first
      const response = await fetch(`/api/summary/${id}`)
      const data = await response.json()

      if (!data.success || !data.summary) {
        alert('Failed to export summary')
        return
      }

      const summary: Summary = data.summary

      // Build markdown content
      const exportContent = `# ${summary.title}

**Generated:** ${new Date(summary.generatedAt).toLocaleString()}
**Period:** ${new Date(summary.startDate).toLocaleDateString()} - ${new Date(summary.endDate).toLocaleDateString()}
**Type:** ${summary.summaryType}
**Word Count:** ${summary.wordCount}

---

${summary.content}

---

*Exported from Serenity Notes*
`

      // Create and download file
      const blob = new Blob([exportContent], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${summary.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting summary:', error)
      alert('Failed to export summary')
    }
  }, [])

  return (
    <SummaryPage
      onLoadSummaries={handleLoadSummaries}
      onGenerateSummary={handleGenerateSummary}
      onDeleteSummary={handleDeleteSummary}
      onExportSummary={handleExportSummary}
    />
  )
}
