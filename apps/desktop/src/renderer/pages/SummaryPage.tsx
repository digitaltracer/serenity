import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, DatePicker } from '@serenity/ui';
import { ArrowLeft, Sparkles, Calendar, FileText, Trash2, Download, Loader2 } from 'lucide-react';
import {
  generateSummary,
  fetchSummaries,
  deleteSummary,
  exportSummary,
  selectFilteredSummaries,
  selectSummariesLoading,
  selectSummariesGenerating,
  selectSummariesError,
  selectSummariesFilters,
  setFilter,
  type AppDispatch,
} from '@serenity/core';

export default function SummaryPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const summaries = useSelector(selectFilteredSummaries);
  const loading = useSelector(selectSummariesLoading);
  const generating = useSelector(selectSummariesGenerating);
  const error = useSelector(selectSummariesError);
  const filters = useSelector(selectSummariesFilters);

  // Date range state
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<('tasks' | 'journal')[]>(['tasks', 'journal']);

  // Fetch summaries on mount
  useEffect(() => {
    dispatch(fetchSummaries());
  }, [dispatch]);

  // Set default dates (last 7 days)
  useEffect(() => {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    setEndDate(today);
    setStartDate(lastWeek);
  }, []);

  const handleGenerateSummary = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    if (selectedTypes.length === 0) {
      alert('Please select at least one type (Tasks or Journal)');
      return;
    }

    await dispatch(generateSummary({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      types: selectedTypes,
    }));
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this summary?')) {
      await dispatch(deleteSummary(id));
    }
  };

  const handleExport = async (id: string) => {
    await dispatch(exportSummary(id));
  };

  const handleQuickPreset = (days: number) => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - days);

    setEndDate(today);
    setStartDate(start);
  };

  const toggleType = (type: 'tasks' | 'journal') => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleFilterChange = (category: 'all' | 'tasks' | 'journal' | 'combined') => {
    dispatch(setFilter({ category }));
  };

  return (
    <div className="flex-1 h-full bg-background">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-primary" />
                AI Summaries
              </h1>
              <p className="text-muted-foreground mt-1">
                Generate and view AI-powered summaries of your tasks and journal entries
              </p>
            </div>
          </div>
        </div>
          </div>

          {/* Generate Summary Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Generate New Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Presets */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickPreset(7)}
                className="gap-2"
              >
                <Calendar className="w-4 h-4" />
                Last 7 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickPreset(30)}
                className="gap-2"
              >
                <Calendar className="w-4 h-4" />
                Last 30 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickPreset(90)}
                className="gap-2"
              >
                <Calendar className="w-4 h-4" />
                Last 3 Months
              </Button>
            </div>

            {/* Custom Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                placeholder="Select start date"
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                placeholder="Select end date"
                minDate={startDate || undefined}
              />
            </div>

            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Include</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleType('tasks')}
                  className={`
                    inline-flex items-center px-4 py-2 rounded-lg font-medium text-sm
                    transition-all cursor-pointer
                    ${
                      selectedTypes.includes('tasks')
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-background border border-border text-foreground hover:bg-accent hover:text-accent-foreground'
                    }
                  `}
                >
                  Tasks
                </button>
                <button
                  type="button"
                  onClick={() => toggleType('journal')}
                  className={`
                    inline-flex items-center px-4 py-2 rounded-lg font-medium text-sm
                    transition-all cursor-pointer
                    ${
                      selectedTypes.includes('journal')
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-background border border-border text-foreground hover:bg-accent hover:text-accent-foreground'
                    }
                  `}
                >
                  Journal
                </button>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateSummary}
              disabled={generating || !startDate || !endDate || selectedTypes.length === 0}
              className="w-full gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Summary
                </>
              )}
            </Button>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summaries List */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Your Summaries</h2>
          <div className="flex gap-2">
            <Badge
              variant={filters.category === 'all' ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2"
              onClick={() => handleFilterChange('all')}
            >
              All
            </Badge>
            <Badge
              variant={filters.category === 'tasks' ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2"
              onClick={() => handleFilterChange('tasks')}
            >
              Tasks
            </Badge>
            <Badge
              variant={filters.category === 'journal' ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2"
              onClick={() => handleFilterChange('journal')}
            >
              Journal
            </Badge>
            <Badge
              variant={filters.category === 'combined' ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2"
              onClick={() => handleFilterChange('combined')}
            >
              Combined
            </Badge>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : summaries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No summaries yet</h3>
              <p className="text-muted-foreground">
                Generate your first summary using the form above
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {summaries.map((summary) => (
              <Card
                key={summary.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{summary.title}</CardTitle>
                      <div className="flex gap-2 items-center text-sm text-muted-foreground">
                        <Badge variant="outline">{summary.summaryType}</Badge>
                        <span>•</span>
                        <span>{new Date(summary.generatedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{summary.wordCount} words</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExport(summary.id)}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(summary.id)}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full overflow-y-auto">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: summary.content.replace(/\n/g, '<br />'),
                        }}
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  {summary.metadata?.tags && summary.metadata.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-border/50">
                      {summary.metadata.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
