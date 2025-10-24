/**
 * Visualization Tabs Component
 * Main tabbed interface for different chart visualizations in Insights Hub
 */

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Heart,
  Calendar,
  Download,
  Maximize2,
} from 'lucide-react';
import { OverviewChart } from './charts/OverviewChart';
import { ProductivityChart } from './charts/ProductivityChart';
import { WellbeingChart } from './charts/WellbeingChart';
import { HabitsHeatmap } from './charts/HabitsHeatmap';

export type VisualizationTab = 'overview' | 'productivity' | 'wellbeing' | 'habits';

export interface VisualizationData {
  // Overview data
  overview?: Array<{ date: string; tasksCompleted: number; mood?: number }>;

  // Productivity data
  productivity?: Array<{ date: string; completed: number; created: number }>;

  // Well-being data
  wellbeing?: Array<{ date: string; mood: number; entryId?: string; hasEntry?: boolean }>;

  // Habits data
  habits?: Array<{ date: string; completionRate: number; count: number }>;
}

export interface VisualizationTabsProps {
  data: VisualizationData;
  activeTab?: VisualizationTab;
  onTabChange?: (tab: VisualizationTab) => void;
  timeRange?: { start: Date; end: Date; label: string };
  onTimeRangeChange?: (range: { start: Date; end: Date; label: string }) => void;
  isLoading?: boolean;
  isDarkMode?: boolean;
}

const tabs = [
  {
    id: 'overview' as VisualizationTab,
    label: 'Overview',
    icon: BarChart3,
    description: 'Tasks completed and mood trends',
  },
  {
    id: 'productivity' as VisualizationTab,
    label: 'Productivity',
    icon: TrendingUp,
    description: 'Task velocity and completion patterns',
  },
  {
    id: 'wellbeing' as VisualizationTab,
    label: 'Well-being',
    icon: Heart,
    description: 'Mood trends from journal entries',
  },
  {
    id: 'habits' as VisualizationTab,
    label: 'Habits',
    icon: Calendar,
    description: 'Recurring task completion heatmap',
  },
];

export const VisualizationTabs: React.FC<VisualizationTabsProps> = ({
  data,
  activeTab = 'overview',
  onTabChange,
  timeRange,
  isLoading = false,
  isDarkMode = false,
}) => {
  const [currentTab, setCurrentTab] = useState<VisualizationTab>(activeTab);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleTabChange = (tab: VisualizationTab) => {
    setCurrentTab(tab);
    onTabChange?.(tab);
  };

  const handleExport = () => {
    // TODO: Implement chart export functionality
    console.log('Export chart as image');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${
      isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : ''
    }`}>
      {/* Header with Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Visualizations
          </h3>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Export chart"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Description */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          {tabs.find(t => t.id === currentTab)?.description}
        </p>
      </div>

      {/* Chart Content Area */}
      <div className={`p-6 ${isFullscreen ? 'h-[calc(100%-120px)] overflow-auto' : ''}`}>
        {isLoading ? (
          <div className="flex items-center justify-center h-80">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading visualization...</p>
            </div>
          </div>
        ) : (
          <div className="min-h-80">
            {currentTab === 'overview' && (
              <OverviewChart
                data={data.overview || []}
                isDarkMode={isDarkMode}
                height={400}
              />
            )}
            {currentTab === 'productivity' && (
              <ProductivityChart
                data={data.productivity || []}
                isDarkMode={isDarkMode}
                height={400}
                showVelocity={true}
              />
            )}
            {currentTab === 'wellbeing' && (
              <WellbeingChart
                data={data.wellbeing || []}
                isDarkMode={isDarkMode}
                height={400}
              />
            )}
            {currentTab === 'habits' && (
              <HabitsHeatmap
                data={data.habits || []}
                isDarkMode={isDarkMode}
              />
            )}
          </div>
        )}
      </div>

      {/* Time Range Info */}
      {timeRange && !isLoading && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              Showing: {timeRange.label}
            </span>
            <span>
              {timeRange.start.toLocaleDateString()} - {timeRange.end.toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
