/**
 * Task Analytics Utilities
 * Provides calculation functions for task-related metrics and analytics
 */

import type { Task } from '@serenity/core';

export interface PriorityDistribution {
  high: { count: number; percentage: number };
  medium: { count: number; percentage: number };
  low: { count: number; percentage: number };
}

export interface CompletionRate {
  completedCount: number;
  totalCount: number;
  rate: number; // 0-100
  change: number; // vs previous period
}

export interface AverageCompletionTime {
  averageHours: number;
  averageDays: number;
  median: number; // in hours
  fastest: number; // in hours
  slowest: number; // in hours
  totalCompleted: number;
}

/**
 * Calculate priority distribution across tasks
 * @param tasks - Array of tasks to analyze
 * @returns Distribution of tasks by priority level
 */
export function calculatePriorityDistribution(tasks: Task[]): PriorityDistribution {
  if (!tasks || tasks.length === 0) {
    return {
      high: { count: 0, percentage: 0 },
      medium: { count: 0, percentage: 0 },
      low: { count: 0, percentage: 0 },
    };
  }

  const high = tasks.filter(t => t.priority === 'high').length;
  const medium = tasks.filter(t => t.priority === 'medium').length;
  const low = tasks.filter(t => t.priority === 'low').length;
  const total = tasks.length;

  return {
    high: {
      count: high,
      percentage: total > 0 ? (high / total) * 100 : 0,
    },
    medium: {
      count: medium,
      percentage: total > 0 ? (medium / total) * 100 : 0,
    },
    low: {
      count: low,
      percentage: total > 0 ? (low / total) * 100 : 0,
    },
  };
}

/**
 * Calculate task completion rate
 * @param tasks - Array of tasks to analyze
 * @param timeRange - Optional time range to filter tasks
 * @returns Completion rate with trend comparison
 */
export function calculateCompletionRate(
  tasks: Task[],
  timeRange?: { start: Date; end: Date }
): CompletionRate {
  let filteredTasks = tasks;

  // Filter by time range if provided
  if (timeRange) {
    filteredTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      return taskDate >= timeRange.start && taskDate <= timeRange.end;
    });
  }

  const totalCount = filteredTasks.length;
  const completedCount = filteredTasks.filter(t => t.completed).length;
  const rate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Calculate previous period for comparison
  let change = 0;
  if (timeRange) {
    const periodDuration = timeRange.end.getTime() - timeRange.start.getTime();
    const previousStart = new Date(timeRange.start.getTime() - periodDuration);
    const previousEnd = new Date(timeRange.start);

    const previousTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      return taskDate >= previousStart && taskDate < previousEnd;
    });

    const previousTotal = previousTasks.length;
    const previousCompleted = previousTasks.filter(t => t.completed).length;
    const previousRate = previousTotal > 0 ? (previousCompleted / previousTotal) * 100 : 0;

    change = rate - previousRate;
  }

  return {
    completedCount,
    totalCount,
    rate,
    change,
  };
}

/**
 * Calculate average completion time for tasks
 * @param tasks - Array of tasks to analyze
 * @returns Average completion time statistics
 */
export function calculateAverageCompletionTime(tasks: Task[]): AverageCompletionTime {
  // Filter only completed tasks that have both createdAt and completedAt
  const completedTasks = tasks.filter(
    task => task.completed && task.completedAt && task.createdAt
  );

  if (completedTasks.length === 0) {
    return {
      averageHours: 0,
      averageDays: 0,
      median: 0,
      fastest: 0,
      slowest: 0,
      totalCompleted: 0,
    };
  }

  // Calculate time differences in hours
  const completionTimes = completedTasks.map(task => {
    const created = new Date(task.createdAt).getTime();
    const completed = new Date(task.completedAt!).getTime();
    return (completed - created) / (1000 * 60 * 60); // Convert to hours
  });

  // Sort for median calculation
  const sortedTimes = [...completionTimes].sort((a, b) => a - b);

  // Calculate average
  const sum = completionTimes.reduce((acc, time) => acc + time, 0);
  const averageHours = sum / completionTimes.length;

  // Calculate median
  const midIndex = Math.floor(sortedTimes.length / 2);
  const median =
    sortedTimes.length % 2 === 0
      ? (sortedTimes[midIndex - 1] + sortedTimes[midIndex]) / 2
      : sortedTimes[midIndex];

  return {
    averageHours,
    averageDays: averageHours / 24,
    median,
    fastest: sortedTimes[0],
    slowest: sortedTimes[sortedTimes.length - 1],
    totalCompleted: completedTasks.length,
  };
}
