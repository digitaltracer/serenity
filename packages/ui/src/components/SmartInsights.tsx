/**
 * Smart Insights Component
 * AI-powered recommendations and insights based on user data and analytics
 */

import React, { useMemo, useState } from 'react';
import {
  Brain,
  TrendingUp,
  Target,
  Clock,
  Calendar,
  Lightbulb,
  ChevronRight,
  Star,
  AlertTriangle,
  CheckCircle,
  Zap
} from 'lucide-react';
import { logger } from '@serenity/core';
import {
  AnalyticsUtils,
  Task,
  JournalEntry,
  ProductivityMetrics,
  VelocityAnalytics,
  HabitAnalytics,
  Insight
} from '../utils/analyticsUtils';

interface SmartInsightsProps {
  tasks: Task[];
  journalEntries: JournalEntry[];
  className?: string;
  timeRange?: number; // days
  maxInsights?: number;
  showRecommendations?: boolean;
  showMetrics?: boolean;
  onInsightClick?: (insight: Insight) => void;
}

export const SmartInsights: React.FC<SmartInsightsProps> = ({
  tasks,
  journalEntries,
  className = '',
  timeRange = 30,
  maxInsights = 6,
  showRecommendations = true,
  showMetrics = true,
  onInsightClick,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Calculate analytics
  const analytics = useMemo(() => {
    const range = AnalyticsUtils.Time.getTimeRange(timeRange);
    const productivity = AnalyticsUtils.Productivity.calculateMetrics(tasks, range);
    const velocity = AnalyticsUtils.Velocity.calculateVelocity(tasks, range);
    const habits = AnalyticsUtils.Habit.analyzeHabits(tasks, journalEntries);

    return { productivity, velocity, habits, range };
  }, [tasks, journalEntries, timeRange]);

  // Generate intelligent insights
  const insights = useMemo(() => {
    const allInsights: Insight[] = [];

    // Productivity insights
    allInsights.push(...generateProductivityInsights(analytics.productivity, tasks));
    
    // Velocity insights
    allInsights.push(...generateVelocityInsights(analytics.velocity, tasks));
    
    // Habit insights
    allInsights.push(...generateHabitInsights(analytics.habits, tasks, journalEntries));
    
    // Pattern insights
    allInsights.push(...generatePatternInsights(tasks, journalEntries, analytics.range));
    
    // Goal insights
    allInsights.push(...generateGoalInsights(tasks, analytics.range));

    // Sort by priority and confidence
    return allInsights
      .sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      })
      .slice(0, maxInsights);
  }, [analytics, tasks, journalEntries, maxInsights]);

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'achievement': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'recommendation': return <Lightbulb className="w-4 h-4 text-blue-500" />;
      case 'pattern': return <TrendingUp className="w-4 h-4 text-green-500" />;
      default: return <Brain className="w-4 h-4 text-purple-500" />;
    }
  };

  const getInsightColor = (type: Insight['type']) => {
    switch (type) {
      case 'achievement': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'warning': return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20';
      case 'recommendation': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      case 'pattern': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      default: return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800';
    }
  };

  const getPriorityIndicator = (priority: Insight['priority']) => {
    switch (priority) {
      case 'high': return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      case 'medium': return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      case 'low': return <div className="w-2 h-2 bg-green-500 rounded-full" />;
    }
  };

  const filteredInsights = selectedCategory 
    ? insights.filter(insight => insight.category === selectedCategory)
    : insights;

  const categories = [...new Set(insights.map(insight => insight.category))];

  return (
    <div className={`smart-insights ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="font-medium text-gray-900 dark:text-white">Smart Insights</h3>
          <div className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-xs">
            AI-Powered
          </div>
        </div>
        
        {showMetrics && (
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>{analytics.productivity.completionRate.toFixed(1)}% completion</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap className="w-4 h-4 text-blue-500" />
              <span>{analytics.productivity.averageTasksPerDay.toFixed(1)} tasks/day</span>
            </div>
          </div>
        )}
      </div>

      {/* Category filters */}
      {categories.length > 1 && (
        <div className="flex items-center space-x-2 mb-4 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
              selectedCategory === null
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            All Insights
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors capitalize ${
                selectedCategory === category
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Insights grid */}
      {filteredInsights.length > 0 ? (
        <div className="space-y-3">
          {filteredInsights.map(insight => (
            <div
              key={insight.id}
              onClick={() => onInsightClick?.(insight)}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {insight.title}
                      </h4>
                      {getPriorityIndicator(insight.priority)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {insight.description}
                    </p>
                    
                    {/* Confidence indicator */}
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 transition-all duration-300"
                            style={{ width: `${insight.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.round(insight.confidence * 100)}% confidence
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                        {insight.category}
                      </div>
                    </div>

                    {/* Action button */}
                    {insight.action && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          insight.action!.callback();
                        }}
                        className="mt-3 flex items-center space-x-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                      >
                        <span>{insight.action.label}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <div className="text-sm">No insights available</div>
          <div className="text-xs mt-1">Complete more tasks and journal entries to get personalized insights</div>
        </div>
      )}
    </div>
  );
};

// Insight generators
function generateProductivityInsights(metrics: ProductivityMetrics, tasks: Task[]): Insight[] {
  const insights: Insight[] = [];

  // Completion rate insights
  if (metrics.completionRate >= 90) {
    insights.push({
      id: 'productivity-excellent',
      type: 'achievement',
      title: 'Exceptional Performance',
      description: `Outstanding ${metrics.completionRate.toFixed(1)}% completion rate! You're consistently achieving your goals.`,
      confidence: 0.95,
      priority: 'high',
      category: 'productivity',
    });
  } else if (metrics.completionRate < 50) {
    insights.push({
      id: 'productivity-low',
      type: 'warning',
      title: 'Low Completion Rate',
      description: `Your ${metrics.completionRate.toFixed(1)}% completion rate suggests tasks might be too ambitious. Consider breaking them down.`,
      confidence: 0.85,
      priority: 'high',
      category: 'productivity',
      action: {
        label: 'Learn about task breakdown',
        callback: () => logger.info('Open task breakdown guide', { component: 'SmartInsights', operation: 'openTaskBreakdown' }),
      },
    });
  }

  // Streak insights
  if (metrics.streakDays >= 7) {
    insights.push({
      id: 'productivity-streak',
      type: 'achievement',
      title: 'Impressive Streak',
      description: `${metrics.streakDays} days of consistent productivity! This momentum is building great habits.`,
      confidence: 0.9,
      priority: 'medium',
      category: 'habits',
    });
  }

  // Trend insights
  if (metrics.trend === 'up') {
    insights.push({
      id: 'productivity-trending-up',
      type: 'pattern',
      title: 'Positive Momentum',
      description: `Productivity trending up ${metrics.trendPercentage}%. Keep up the excellent work!`,
      confidence: 0.8,
      priority: 'medium',
      category: 'productivity',
    });
  } else if (metrics.trend === 'down') {
    insights.push({
      id: 'productivity-trending-down',
      type: 'warning',
      title: 'Declining Trend',
      description: `Productivity down ${metrics.trendPercentage}%. Consider adjusting your approach or taking a break.`,
      confidence: 0.75,
      priority: 'high',
      category: 'productivity',
    });
  }

  return insights;
}

function generateVelocityInsights(velocity: VelocityAnalytics, tasks: Task[]): Insight[] {
  const insights: Insight[] = [];

  // Velocity trend
  if (velocity.trend === 'accelerating') {
    insights.push({
      id: 'velocity-accelerating',
      type: 'achievement',
      title: 'Accelerating Velocity',
      description: 'Your task completion rate is accelerating! This suggests improved efficiency and focus.',
      confidence: 0.85,
      priority: 'medium',
      category: 'velocity',
    });
  } else if (velocity.trend === 'decelerating') {
    insights.push({
      id: 'velocity-decelerating',
      type: 'warning',
      title: 'Slowing Velocity',
      description: 'Task completion is slowing down. Consider reviewing your workload and priorities.',
      confidence: 0.8,
      priority: 'medium',
      category: 'velocity',
    });
  }

  // Consistency insights
  if (velocity.consistency >= 0.8) {
    insights.push({
      id: 'velocity-consistent',
      type: 'achievement',
      title: 'Highly Consistent',
      description: `${Math.round(velocity.consistency * 100)}% consistency in your work pattern. Excellent steady progress!`,
      confidence: 0.9,
      priority: 'low',
      category: 'velocity',
    });
  } else if (velocity.consistency < 0.4) {
    insights.push({
      id: 'velocity-inconsistent',
      type: 'recommendation',
      title: 'Inconsistent Velocity',
      description: 'Your work pattern varies significantly. Try establishing a more regular routine.',
      confidence: 0.7,
      priority: 'medium',
      category: 'velocity',
    });
  }

  return insights;
}

function generateHabitInsights(habits: HabitAnalytics, tasks: Task[], journalEntries: JournalEntry[]): Insight[] {
  const insights: Insight[] = [];

  // Streak insights
  if (habits.streakCurrent >= 10) {
    insights.push({
      id: 'habits-long-streak',
      type: 'achievement',
      title: 'Amazing Habit Streak',
      description: `${habits.streakCurrent} days of consistent activity! You've built a strong routine.`,
      confidence: 0.95,
      priority: 'high',
      category: 'habits',
    });
  }

  // Best day patterns
  if (habits.patterns.bestDayOfWeek) {
    insights.push({
      id: 'habits-best-day',
      type: 'pattern',
      title: 'Weekly Pattern Detected',
      description: `You're most productive on ${habits.patterns.bestDayOfWeek}s. Consider scheduling important tasks then.`,
      confidence: 0.7,
      priority: 'low',
      category: 'habits',
    });
  }

  // Consistency insights
  if (habits.consistency >= 0.8) {
    insights.push({
      id: 'habits-consistent',
      type: 'achievement',
      title: 'Excellent Consistency',
      description: `${Math.round(habits.consistency * 100)}% of days active. Your dedication is paying off!`,
      confidence: 0.85,
      priority: 'medium',
      category: 'habits',
    });
  }

  return insights;
}

function generatePatternInsights(tasks: Task[], journalEntries: JournalEntry[], range: any): Insight[] {
  const insights: Insight[] = [];

  // Priority pattern analysis
  const highPriorityTasks = tasks.filter(t => t.priority === 'high');
  const completedHighPriority = highPriorityTasks.filter(t => t.completed);
  
  if (highPriorityTasks.length > 0) {
    const highPriorityRate = (completedHighPriority.length / highPriorityTasks.length) * 100;
    
    if (highPriorityRate >= 90) {
      insights.push({
        id: 'pattern-high-priority-success',
        type: 'achievement',
        title: 'High-Priority Focus',
        description: `${highPriorityRate.toFixed(1)}% of high-priority tasks completed. Excellent prioritization!`,
        confidence: 0.8,
        priority: 'medium',
        category: 'productivity',
      });
    } else if (highPriorityRate < 60) {
      insights.push({
        id: 'pattern-high-priority-struggle',
        type: 'recommendation',
        title: 'High-Priority Challenge',
        description: 'Consider focusing on fewer high-priority tasks to improve completion rates.',
        confidence: 0.75,
        priority: 'high',
        category: 'productivity',
      });
    }
  }

  return insights;
}

function generateGoalInsights(tasks: Task[], range: any): Insight[] {
  const insights: Insight[] = [];

  // Overdue task analysis
  const overdueTasks = tasks.filter(task => 
    task.dueDate && !task.completed && new Date(task.dueDate) < new Date()
  );

  if (overdueTasks.length > 0) {
    insights.push({
      id: 'goals-overdue-tasks',
      type: 'warning',
      title: 'Overdue Tasks',
      description: `${overdueTasks.length} task${overdueTasks.length > 1 ? 's are' : ' is'} overdue. Consider reviewing deadlines and priorities.`,
      confidence: 1.0,
      priority: 'high',
      category: 'goals',
    });
  }

  return insights;
}