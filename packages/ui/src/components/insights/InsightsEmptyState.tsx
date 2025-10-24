/**
 * Insights Empty State Component
 * Displays helpful empty states for different scenarios in the Insights Hub
 */

import React from 'react';
import {
  Sparkles,
  ClipboardList,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Target,
  Play,
} from 'lucide-react';

export type EmptyStateType = 'no-provider' | 'no-data' | 'no-insights' | 'all-dismissed';

export interface ProgressItem {
  label: string;
  completed: boolean;
  description?: string;
}

export interface InsightsEmptyStateProps {
  type: EmptyStateType;
  onConfigure?: () => void;
  onStartAnalysis?: () => void;
  onViewDismissed?: () => void;
  onGetStarted?: () => void;
  progressItems?: ProgressItem[];
  nextAnalysisIn?: string;
  showSampleInsights?: boolean;
}

const sampleInsights = [
  {
    icon: TrendingUp,
    iconColor: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    title: 'Peak productivity at 10 AM',
    description: 'You complete 40% more tasks in the morning. Consider scheduling important work before noon.',
  },
  {
    icon: Target,
    iconColor: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    title: 'Consistent journaling habit forming',
    description: "You've written entries 5 days in a row. Keep it up for better self-reflection!",
  },
  {
    icon: AlertCircle,
    iconColor: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    title: '3 overdue tasks need attention',
    description: 'Review due dates and reschedule or complete overdue work to reduce stress.',
  },
];

const defaultProgressItems: ProgressItem[] = [
  { label: 'Create 3+ tasks', completed: false, description: 'Add tasks to track your work' },
  { label: 'Complete 2+ tasks', completed: false, description: 'Mark tasks as done to build history' },
  { label: 'Write 2+ journal entries', completed: false, description: 'Reflect on your day and mood' },
  { label: 'Run your first analysis', completed: false, description: 'Generate AI-powered insights' },
];

export const InsightsEmptyState: React.FC<InsightsEmptyStateProps> = ({
  type,
  onConfigure,
  onStartAnalysis,
  onViewDismissed,
  onGetStarted,
  progressItems = defaultProgressItems,
  nextAnalysisIn,
  showSampleInsights = false,
}) => {
  // Render based on type
  switch (type) {
    case 'no-provider':
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-2xl mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <Sparkles className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Get started with AI-powered insights
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
            Configure an AI provider to unlock personalized insights about your productivity patterns, habits, and goals.
          </p>

          {onConfigure && (
            <button
              onClick={onConfigure}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              Configure AI Provider
            </button>
          )}

          {showSampleInsights && (
            <div className="mt-12 w-full">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-left">
                Here's what you'll get:
              </p>
              <div className="space-y-3">
                {sampleInsights.map((insight, idx) => {
                  const IconComponent = insight.icon;
                  return (
                    <div
                      key={idx}
                      className={`${insight.bgColor} rounded-lg p-4 text-left border border-gray-200 dark:border-gray-700`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                          <IconComponent className={`w-5 h-5 ${insight.iconColor}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            {insight.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {insight.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );

    case 'no-data':
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-2xl mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <ClipboardList className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Complete some tasks and write journal entries to unlock insights
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
            AI insights work best with a bit of data. Complete the checklist below to get started.
          </p>

          {/* Progress Checklist */}
          <div className="w-full max-w-md mb-8">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 text-left">
                Your Progress
              </h3>
              <div className="space-y-3">
                {progressItems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {item.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-medium ${
                        item.completed
                          ? 'text-gray-900 dark:text-gray-100 line-through'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {item.label}
                      </p>
                      {item.description && !item.completed && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {onGetStarted && (
            <button
              onClick={onGetStarted}
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              Get Started
            </button>
          )}
        </div>
      );

    case 'no-insights':
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-2xl mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <Sparkles className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Run your first analysis to generate insights
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
            Analyze your tasks and journal entries to discover patterns, get recommendations, and optimize your productivity.
          </p>

          {onStartAnalysis && (
            <button
              onClick={onStartAnalysis}
              className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              Analyze My Data
            </button>
          )}

          {showSampleInsights && (
            <div className="mt-12 w-full">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-left">
                Example insights you might see:
              </p>
              <div className="space-y-3">
                {sampleInsights.map((insight, idx) => {
                  const IconComponent = insight.icon;
                  return (
                    <div
                      key={idx}
                      className={`${insight.bgColor} rounded-lg p-4 text-left border border-gray-200 dark:border-gray-700`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                          <IconComponent className={`w-5 h-5 ${insight.iconColor}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            {insight.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {insight.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );

    case 'all-dismissed':
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-2xl mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            You're all caught up!
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
            You've reviewed all your insights. New insights will appear here after your next analysis.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {onViewDismissed && (
              <button
                onClick={onViewDismissed}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-600"
              >
                View Dismissed Insights
              </button>
            )}

            {onStartAnalysis && (
              <button
                onClick={onStartAnalysis}
                className="px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors shadow-md hover:shadow-lg"
              >
                Run New Analysis
              </button>
            )}
          </div>

          {nextAnalysisIn && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Next automatic analysis in {nextAnalysisIn}</span>
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
};
