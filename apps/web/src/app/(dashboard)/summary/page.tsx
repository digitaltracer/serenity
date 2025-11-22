'use client'

export const dynamic = 'force-dynamic'

import { SummaryPage } from '@serenity/ui/pages'

/**
 * Web-specific wrapper for the shared SummaryPage
 * Provides placeholder handlers for web app
 * TODO: Implement full API-based summary functionality
 */
export default function SummaryPageWrapper() {
  // Web-specific handlers (placeholder for now)
  const handleGenerateSummary = async (params: {
    startDate: string;
    endDate: string;
    types: ('tasks' | 'journal')[];
  }) => {
    // TODO: Implement API call for web
    console.log('Generate summary:', params);
    alert('Summary generation is not yet available in the web app. This feature is coming soon!');
  };

  const handleDeleteSummary = async (id: string) => {
    // TODO: Implement API call for web
    console.log('Delete summary:', id);
    alert('Summary deletion is not yet available in the web app.');
  };

  const handleExportSummary = async (id: string) => {
    // TODO: Implement API call for web
    console.log('Export summary:', id);
    alert('Summary export is not yet available in the web app.');
  };

  return (
    <SummaryPage
      onGenerateSummary={handleGenerateSummary}
      onDeleteSummary={handleDeleteSummary}
      onExportSummary={handleExportSummary}
    />
  );
}
