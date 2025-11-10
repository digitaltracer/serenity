import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  // Redux selectors
  selectKPIs,
  selectInsights,
  selectRecaps,
  selectTimeRange,
  selectIsLoadingDashboard,
  selectIsLoadingInsights,
  selectIsLoadingRecaps,
  selectNonDismissedInsights,
  selectFavoritedRecaps,
  selectAllTasks,
  selectAllEntries,
  // Redux actions
  fetchDashboardData,
  setTimeRangePreset,
  dismissInsight,
  rateInsight,
  markInsightHelpful,
  addInsightNote,
  fetchRecaps,
  toggleRecapFavorite,
  // Services
  VisualizationService,
  // Types
  type AppDispatch,
  type AIInsightEnhanced,
  type AIRecapEnhanced,
} from '@serenity/core';
import {
  // Components
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  KPICard,
  TrendChart,
  InsightCard,
  Button,
  PriorityDistributionChart,
  // Utils
  calculatePriorityDistribution,
  calculateCompletionRate,
  calculateAverageCompletionTime,
} from '@serenity/ui';
import {
  // Icons
  BarChart3,
  TrendingUp,
  Lightbulb,
  Calendar,
  Filter,
  RefreshCw,
  ChevronDown,
  Sparkles,
  Target,
  Smile,
  Zap,
  Flame,
  CheckCircle,
  Clock,
} from 'lucide-react';

export const InsightsHubPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const kpis = useSelector(selectKPIs);
  const insights = useSelector(selectNonDismissedInsights);
  const recaps = useSelector(selectRecaps);
  const timeRange = useSelector(selectTimeRange);
  const isLoadingDashboard = useSelector(selectIsLoadingDashboard);
  const isLoadingInsights = useSelector(selectIsLoadingInsights);
  const isLoadingRecaps = useSelector(selectIsLoadingRecaps);
  const tasks = useSelector(selectAllTasks);
  const journalEntries = useSelector(selectAllEntries);

  // Local state
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | 'year'>('7d');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'tasks' | 'journal' | 'habits' | 'goals'>('all');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'trends' | 'insights' | 'recaps'>('overview');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  // Trend visualization controls
  const [selectedMetric, setSelectedMetric] = useState<'completion' | 'mood' | 'productivity' | 'velocity'>('completion');
  const [selectedGranularity, setSelectedGranularity] = useState<'day' | 'week' | 'month'>('day');

  // Load dashboard data on mount
  useEffect(() => {
    dispatch(fetchDashboardData({
      includeKPIs: true,
      includeInsights: true,
      includeRecaps: true,
    }));
  }, [dispatch]);

  // Handle time range change
  const handleTimeRangeChange = (preset: '7d' | '30d' | '90d' | 'year') => {
    setSelectedTimeRange(preset);

    // Calculate the time range
    const end = new Date();
    const start = new Date();

    switch (preset) {
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    const timeRange = {
      start: start.toISOString(),
      end: end.toISOString(),
    };

    // Update Redux state
    dispatch(setTimeRangePreset(preset));

    // Fetch data with explicit time range
    dispatch(fetchDashboardData({
      timeRange,
      includeKPIs: true,
      includeInsights: true,
      includeRecaps: true,
    }));
  };

  // Handle refresh
  const handleRefresh = () => {
    // Use current time range for refresh
    const timeRangeObj = getTimeRangeFromPreset(selectedTimeRange);
    const timeRange = {
      start: timeRangeObj.start.toISOString(),
      end: timeRangeObj.end.toISOString(),
    };

    dispatch(fetchDashboardData({
      timeRange,
      includeKPIs: true,
      includeInsights: true,
      includeRecaps: true,
    }));
  };

  // Handle generate insights
  const handleGenerateInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      // Get AI settings to determine provider
      const settingsResult = await (window as any).electronAPI?.aiAssistant?.getSettings();
      if (!settingsResult?.success || !settingsResult.settings?.activeProvider) {
        alert('Please configure an AI provider in Settings first');
        return;
      }

      const provider = settingsResult.settings.activeProvider;

      // Call analyze-data to generate new insights
      const result = await (window as any).electronAPI?.aiAssistant?.analyzeData({
        provider,
        dataTypes: ['tasks', 'journal'],
        forceReAnalyze: false,
      });

      if (result?.success) {
        // Refresh dashboard data to show new insights
        dispatch(fetchDashboardData({
          includeKPIs: true,
          includeInsights: true,
          includeRecaps: true,
        }));
      } else {
        alert(`Failed to generate insights: ${result?.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error generating insights:', error);
      alert(`Error: ${error?.message || 'Failed to generate insights'}`);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Filter insights by category
  const filteredInsights = selectedCategory === 'all'
    ? insights
    : insights.filter(i => i.category === selectedCategory);

  // Handle insight actions
  const handleDismissInsight = (id: string) => {
    dispatch(dismissInsight(id));
  };

  const handleRateInsight = (id: string, rating: number) => {
    dispatch(rateInsight({ id, rating }));
  };

  const handleMarkHelpful = (id: string, helpful: boolean) => {
    dispatch(markInsightHelpful({ id, helpful }));
  };

  const handleAddNote = (id: string, note: string) => {
    dispatch(addInsightNote({ id, note }));
  };

  const handleToggleFavorite = (id: string, favorited: boolean) => {
    dispatch(toggleRecapFavorite({ id, favorited }));
  };

  // Helper: Convert time range preset to TimeRange object
  const getTimeRangeFromPreset = (preset: '7d' | '30d' | '90d' | 'year'): { start: Date; end: Date } => {
    const end = new Date();
    const start = new Date();

    switch (preset) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }

    return { start, end };
  };

  // Generate trend data based on selected metric, granularity, and time range
  const trendData = React.useMemo(() => {
    const timeRangeObj = getTimeRangeFromPreset(selectedTimeRange);
    return VisualizationService.generateTrendData(
      tasks,
      journalEntries,
      selectedMetric,
      selectedGranularity,
      timeRangeObj
    );
  }, [tasks, journalEntries, selectedMetric, selectedGranularity, selectedTimeRange]);

  // Calculate task analytics metrics
  const priorityDistribution = React.useMemo(() =>
    calculatePriorityDistribution(tasks as any),
    [tasks]
  );

  const completionRate = React.useMemo(() => {
    const timeRangeObj = getTimeRangeFromPreset(selectedTimeRange);
    return calculateCompletionRate(tasks as any, timeRangeObj);
  }, [tasks, selectedTimeRange]);

  const avgCompletionTime = React.useMemo(() =>
    calculateAverageCompletionTime(tasks as any),
    [tasks]
  );

  return (
    <div className="flex-1 h-full bg-background">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                  <Sparkles className="w-8 h-8 text-blue-500" />
                  Insights Hub
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  AI-powered analytics, trends, and personalized recommendations
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Time Range Selector */}
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                  <button
                    onClick={() => handleTimeRangeChange('7d')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      selectedTimeRange === '7d'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    7D
                  </button>
                  <button
                    onClick={() => handleTimeRangeChange('30d')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      selectedTimeRange === '30d'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    30D
                  </button>
                  <button
                    onClick={() => handleTimeRangeChange('90d')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      selectedTimeRange === '90d'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    90D
                  </button>
                  <button
                    onClick={() => handleTimeRangeChange('year')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      selectedTimeRange === 'year'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    1Y
                  </button>
                </div>

                {/* Generate Insights Button */}
                <Button
                  onClick={handleGenerateInsights}
                  variant="default"
                  size="sm"
                  disabled={isGeneratingInsights || isLoadingDashboard}
                  className="gap-2"
                >
                  <Sparkles className={`w-4 h-4 ${isGeneratingInsights ? 'animate-spin' : ''}`} />
                  {isGeneratingInsights ? 'Generating...' : 'Generate Insights'}
                </Button>

                {/* Refresh Button */}
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  disabled={isLoadingDashboard}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingDashboard ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* KPI Cards Row */}
          {kpis && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4 mb-8">
              <KPICard
                title="Tasks Completed"
                value={kpis.weeklyTasksCompleted.value}
                change={{
                  value: kpis.weeklyTasksCompleted.change,
                  direction: kpis.weeklyTasksCompleted.change > 0 ? 'up' : kpis.weeklyTasksCompleted.change < 0 ? 'down' : 'neutral',
                  period: 'vs last period',
                }}
                sparklineData={kpis.weeklyTasksCompleted.sparkline}
                icon={<Target className="w-5 h-5" />}
                color="blue"
              />

              <KPICard
                title="Average Mood"
                value={kpis.averageMood.value.toFixed(1)}
                change={{
                  value: kpis.averageMood.change,
                  direction: kpis.averageMood.change > 0 ? 'up' : kpis.averageMood.change < 0 ? 'down' : 'neutral',
                  period: 'vs last period',
                }}
                sparklineData={kpis.averageMood.sparkline}
                icon={<Smile className="w-5 h-5" />}
                color="green"
              />

              <KPICard
                title="Productivity Score"
                value={`${kpis.productivityScore.value}%`}
                change={{
                  value: kpis.productivityScore.change,
                  direction: kpis.productivityScore.change > 0 ? 'up' : kpis.productivityScore.change < 0 ? 'down' : 'neutral',
                  period: 'vs last period',
                }}
                sparklineData={kpis.productivityScore.sparkline}
                icon={<Zap className="w-5 h-5" />}
                color="purple"
              />

              <KPICard
                title="Active Streak"
                value={`${kpis.activeStreak.value} days`}
                change={{
                  value: kpis.activeStreak.change,
                  direction: kpis.activeStreak.change > 0 ? 'up' : kpis.activeStreak.change < 0 ? 'down' : 'neutral',
                  period: 'vs last period',
                }}
                icon={<Flame className="w-5 h-5" />}
                color="orange"
              />

              <KPICard
                title="Completion Rate"
                value={`${completionRate.rate.toFixed(1)}%`}
                change={{
                  value: completionRate.change,
                  direction: completionRate.change > 0 ? 'up' : completionRate.change < 0 ? 'down' : 'neutral',
                  period: 'vs last period',
                }}
                icon={<CheckCircle className="w-5 h-5" />}
                color="green"
              />

              <KPICard
                title="Avg Completion Time"
                value={
                  avgCompletionTime.averageDays < 1
                    ? `${avgCompletionTime.averageHours.toFixed(1)}h`
                    : `${avgCompletionTime.averageDays.toFixed(1)}d`
                }
                icon={<Clock className="w-5 h-5" />}
                color="blue"
              />

              {/* Priority Distribution Card */}
              <div className="bg-card rounded-lg border border-border p-4 shadow-sm h-[168px] flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Priority Distribution
                  </span>
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <PriorityDistributionChart
                    data={priorityDistribution}
                    height={80}
                    showLabels={false}
                  />
                  <div className="flex items-center justify-center gap-3 text-xs mt-1">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-muted-foreground">{priorityDistribution.high.count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      <span className="text-muted-foreground">{priorityDistribution.medium.count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-muted-foreground">{priorityDistribution.low.count}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading state for KPIs */}
          {isLoadingDashboard && !kpis && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4 mb-8">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="h-[168px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {/* Main Content Tabs */}
          <div className="w-full">
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSelectedTab('overview')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                  selectedTab === 'overview'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Overview
              </button>
              <button
                onClick={() => setSelectedTab('trends')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                  selectedTab === 'trends'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Trends
              </button>
              <button
                onClick={() => setSelectedTab('insights')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                  selectedTab === 'insights'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                Insights ({insights.length})
              </button>
              <button
                onClick={() => setSelectedTab('recaps')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                  selectedTab === 'recaps'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Recaps ({recaps.length})
              </button>
            </div>

            {/* Overview Tab */}
            {selectedTab === 'overview' && (
              <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  {insights.length === 0 ? (
                    <div className="text-center py-12">
                      <Lightbulb className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        No insights yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-4">
                        You have tasks and journal entries ready for analysis. Click the "Generate Insights" button above to get AI-powered insights about your productivity and wellbeing.
                      </p>
                      <Button
                        onClick={handleGenerateInsights}
                        disabled={isGeneratingInsights}
                        className="gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        {isGeneratingInsights ? 'Generating...' : 'Generate Your First Insights'}
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {insights.slice(0, 4).map(insight => (
                        <InsightCard
                          key={insight.id}
                          insight={insight}
                          onDismiss={handleDismissInsight}
                          onRate={handleRateInsight}
                          onMarkHelpful={handleMarkHelpful}
                          onAddNote={handleAddNote}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {recaps.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Latest Recap</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RecapCard
                      recap={recaps[0]}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  </CardContent>
                </Card>
              )}
              </div>
            )}

            {/* Trends Tab */}
            {selectedTab === 'trends' && (
              <div className="space-y-6">
                {/* Controls */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Metric Selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Metric:
                        </span>
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                          <button
                            onClick={() => setSelectedMetric('completion')}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                              selectedMetric === 'completion'
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                          >
                            Completion
                          </button>
                          <button
                            onClick={() => setSelectedMetric('mood')}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                              selectedMetric === 'mood'
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                          >
                            Mood
                          </button>
                          <button
                            onClick={() => setSelectedMetric('productivity')}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                              selectedMetric === 'productivity'
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                          >
                            Productivity
                          </button>
                          <button
                            onClick={() => setSelectedMetric('velocity')}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                              selectedMetric === 'velocity'
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                          >
                            Velocity
                          </button>
                        </div>
                      </div>

                      {/* Granularity Selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Granularity:
                        </span>
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                          <button
                            onClick={() => setSelectedGranularity('day')}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                              selectedGranularity === 'day'
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                          >
                            Daily
                          </button>
                          <button
                            onClick={() => setSelectedGranularity('week')}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                              selectedGranularity === 'week'
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                          >
                            Weekly
                          </button>
                          <button
                            onClick={() => setSelectedGranularity('month')}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                              selectedGranularity === 'month'
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                          >
                            Monthly
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Trend Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      {selectedMetric === 'completion' && 'Task Completion Trend'}
                      {selectedMetric === 'mood' && 'Mood Trend'}
                      {selectedMetric === 'productivity' && 'Productivity Score Trend'}
                      {selectedMetric === 'velocity' && 'Task Velocity Trend'}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedMetric === 'completion' && 'Track how many tasks you complete over time'}
                      {selectedMetric === 'mood' && 'Monitor your average mood from journal entries'}
                      {selectedMetric === 'productivity' && 'Visualize your productivity score trends'}
                      {selectedMetric === 'velocity' && 'Measure your task completion velocity'}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {trendData.length === 0 ? (
                      <div className="text-center py-12">
                        <BarChart3 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          No data available
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                          {selectedMetric === 'mood'
                            ? 'Create journal entries with mood ratings to see your mood trends.'
                            : 'Complete tasks to see your trend data.'}
                        </p>
                      </div>
                    ) : (
                      <TrendChart
                        data={trendData}
                        type="area"
                        height={400}
                        color={
                          selectedMetric === 'completion' ? '#3b82f6' :
                          selectedMetric === 'mood' ? '#10b981' :
                          selectedMetric === 'productivity' ? '#8b5cf6' :
                          '#f59e0b'
                        }
                        showGrid={true}
                        showLegend={false}
                        yAxisLabel={
                          selectedMetric === 'completion' ? 'Tasks Completed' :
                          selectedMetric === 'mood' ? 'Average Mood' :
                          selectedMetric === 'productivity' ? 'Score (%)' :
                          'Tasks/Day'
                        }
                        xAxisLabel="Time"
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Insights Tab */}
            {selectedTab === 'insights' && (
              <div className="space-y-6">
              {/* Category Filter */}
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-gray-500" />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSelectedCategory('tasks')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      selectedCategory === 'tasks'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    Tasks
                  </button>
                  <button
                    onClick={() => setSelectedCategory('journal')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      selectedCategory === 'journal'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    Journal
                  </button>
                  <button
                    onClick={() => setSelectedCategory('habits')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      selectedCategory === 'habits'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    Habits
                  </button>
                  <button
                    onClick={() => setSelectedCategory('goals')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      selectedCategory === 'goals'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    Goals
                  </button>
                </div>
              </div>

              {/* Insights Grid */}
              {filteredInsights.length === 0 ? (
                <div className="text-center py-12">
                  <Lightbulb className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No insights in this category
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try selecting a different category or time range.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredInsights.map(insight => (
                    <InsightCard
                      key={insight.id}
                      insight={insight}
                      onDismiss={handleDismissInsight}
                      onRate={handleRateInsight}
                      onMarkHelpful={handleMarkHelpful}
                      onAddNote={handleAddNote}
                    />
                  ))}
                </div>
              )}
              </div>
            )}

            {/* Recaps Tab */}
            {selectedTab === 'recaps' && (
              <div className="space-y-4">
                {recaps.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No recaps available
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                      Weekly and monthly recaps will be generated automatically based on your activity.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recaps.map(recap => (
                      <RecapCard
                        key={recap.id}
                        recap={recap}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================================================
// Recap Card Component
// =====================================================================

interface RecapCardProps {
  recap: AIRecapEnhanced;
  onToggleFavorite: (id: string, favorited: boolean) => void;
}

const RecapCard: React.FC<RecapCardProps> = ({ recap, onToggleFavorite }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                recap.type === 'weekly'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
              }`}>
                {recap.type === 'weekly' ? 'Weekly' : 'Monthly'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(recap.period.start).toLocaleDateString()} - {new Date(recap.period.end).toLocaleDateString()}
              </span>
            </div>
            <CardTitle className="text-lg">{recap.title}</CardTitle>
          </div>
          <button
            onClick={() => onToggleFavorite(recap.id, !recap.favorited)}
            className={`p-2 rounded-lg transition-colors ${
              recap.favorited
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <svg className="w-5 h-5" fill={recap.favorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 dark:text-gray-300 mb-4">{recap.summary}</p>

        {isExpanded && (
          <div className="space-y-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {recap.highlights.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">Highlights</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  {recap.highlights.map((highlight, idx) => (
                    <li key={idx}>{highlight}</li>
                  ))}
                </ul>
              </div>
            )}

            {recap.challenges.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">Challenges</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  {recap.challenges.map((challenge, idx) => (
                    <li key={idx}>{challenge}</li>
                  ))}
                </ul>
              </div>
            )}

            {recap.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">Recommendations</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  {recap.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          {isExpanded ? (
            <>
              <span>Show Less</span>
              <ChevronDown className="w-4 h-4 rotate-180 transition-transform" />
            </>
          ) : (
            <>
              <span>Show More</span>
              <ChevronDown className="w-4 h-4 transition-transform" />
            </>
          )}
        </button>
      </CardContent>
    </Card>
  );
};
