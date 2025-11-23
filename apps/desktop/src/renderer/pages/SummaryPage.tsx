import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Button } from '@serenity/ui';
import { SummaryPage as SharedSummaryPage } from '@serenity/ui/pages';
import { ArrowLeft } from 'lucide-react';
import {
  fetchSummaries,
  generateSummary,
  deleteSummary,
  exportSummary,
  type AppDispatch,
} from '@serenity/core';

/**
 * Desktop-specific wrapper for the shared SummaryPage
 * Provides platform-specific handlers for Electron
 */
export function SummaryPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Load summaries using Electron API
  const handleLoadSummaries = async () => {
    await dispatch(fetchSummaries());
  };

  // Platform-specific handlers using Redux thunks
  const handleGenerateSummary = async (params: {
    startDate: string;
    endDate: string;
    types: ('tasks' | 'journal')[];
  }) => {
    await dispatch(generateSummary({
      startDate: params.startDate,
      endDate: params.endDate,
      types: params.types,
    }));
  };

  const handleDeleteSummary = async (id: string) => {
    await dispatch(deleteSummary(id));
  };

  const handleExportSummary = async (id: string) => {
    await dispatch(exportSummary(id));
  };

  // Back button for desktop navigation
  const headerContent = (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate(-1)}
      className="gap-2"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </Button>
  );

  return (
    <SharedSummaryPage
      onLoadSummaries={handleLoadSummaries}
      onGenerateSummary={handleGenerateSummary}
      onDeleteSummary={handleDeleteSummary}
      onExportSummary={handleExportSummary}
      headerContent={headerContent}
    />
  );
}

export default SummaryPage;
