import React, { useMemo, useState, Suspense, lazy } from 'react';
import { useSelector } from 'react-redux';
import { selectAllTasks, selectAllEntries, selectAllProjects } from '@serenity/core';
import { Card, CardHeader, CardTitle, CardContent } from '@serenity/ui';
import { BarChart3, TrendingUp, Target, Zap, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

// Lazy load the advanced analytics to avoid circular dependencies
const AdvancedAnalytics = lazy(() => 
  import('@serenity/ui').then(module => ({ default: module.AdvancedAnalytics }))
);

export const AnalyticsPage: React.FC = () => {
  const tasks = useSelector(selectAllTasks);
  const journalEntries = useSelector(selectAllEntries);
  const projects = useSelector(selectAllProjects);
  const [showAdvanced, setShowAdvanced] = useState(true);

  // Basic analytics calculations
  const basicStats = useMemo(() => {
    const completedTasks = tasks.filter(task => task.completed);
    const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
    
    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      completionRate,
      totalJournalEntries: journalEntries.length,
      totalProjects: projects.length,
    };
  }, [tasks, journalEntries, projects]);

  return (
    <div className="flex-1 h-full bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your productivity and progress over time
            </p>
          </div>

          {/* Basic Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Total Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {basicStats.totalTasks}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {basicStats.completedTasks} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Journal Entries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {basicStats.totalJournalEntries}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  entries written
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {basicStats.completionRate}%
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  overall progress
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {basicStats.totalProjects}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  active projects
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Advanced Analytics Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Advanced Analytics
                </div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  {showAdvanced ? (
                    <>
                      <span>Hide Details</span>
                      <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Show Details</span>
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showAdvanced ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-400 mb-4">
                    Click "Show Details" to view advanced analytics including charts, trends, and project insights.
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500">
                    Features include daily progress charts, completion trends, and project distribution.
                  </div>
                </div>
              ) : (
                <Suspense fallback={
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <div className="text-gray-500 dark:text-gray-400">Loading advanced analytics...</div>
                  </div>
                }>
                  <AdvancedAnalytics 
                    tasks={tasks}
                    journalEntries={journalEntries}
                    projects={projects}
                  />
                </Suspense>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};