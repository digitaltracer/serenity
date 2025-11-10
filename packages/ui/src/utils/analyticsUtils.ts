/**
 * Advanced Analytics Utilities
 * Statistical and mathematical functions for comprehensive data analysis
 */

// Import types from core package to avoid duplication and circular dependencies
import type { Task, JournalEntry, Project } from '@serenity/core';

// Re-export for backward compatibility
export type { Task, JournalEntry, Project } from '@serenity/core';

export interface AnalyticsTimeRange {
  start: Date;
  end: Date;
}

export interface ProductivityMetrics {
  completionRate: number;
  averageTasksPerDay: number;
  streakDays: number;
  bestStreak: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  averageCompletionTime: number; // hours
  productivity: 'high' | 'medium' | 'low';
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface VelocityAnalytics {
  daily: number[];
  weekly: number[];
  monthly: number[];
  trend: 'accelerating' | 'decelerating' | 'stable';
  predictedNext: number;
  consistency: number; // 0-1, higher is more consistent
  volatility: number; // 0-1, higher is more volatile
}

export interface HabitAnalytics {
  streakCurrent: number;
  streakLongest: number;
  activeDays: number;
  totalDays: number;
  consistency: number;
  patterns: {
    bestDayOfWeek: string;
    bestTimeOfDay: string;
    averageSessionLength: number;
  };
}

export interface Insight {
  id: string;
  type: 'achievement' | 'warning' | 'recommendation' | 'pattern';
  title: string;
  description: string;
  confidence: number; // 0-1
  priority: 'high' | 'medium' | 'low';
  category: 'productivity' | 'habits' | 'velocity' | 'goals' | 'time';
  action?: {
    label: string;
    callback: () => void;
  };
  metadata?: any;
}

export interface TimeAnalytics {
  mostProductiveHour: number;
  mostProductiveDay: string;
  averageSessionLength: number;
  totalActiveTime: number;
  breakdownByHour: { [hour: number]: number };
  breakdownByDay: { [day: string]: number };
}

// Statistical Utilities
export class StatisticsUtils {
  static mean(values: number[]): number {
    return values.length === 0 ? 0 : values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  static median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  static standardDeviation(values: number[]): number {
    if (values.length <= 1) return 0;
    const mean = this.mean(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = this.mean(squaredDiffs);
    return Math.sqrt(variance);
  }

  static correlation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  static linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
    if (x.length !== y.length || x.length < 2) {
      return { slope: 0, intercept: 0, r2: 0 };
    }

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const correlation = this.correlation(x, y);
    const r2 = correlation * correlation;

    return { slope, intercept, r2 };
  }

  static percentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sorted[lower];
    }
    
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }
}

// Time-based Analysis
export class TimeAnalyzer {
  static getTimeRange(days: number): AnalyticsTimeRange {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return { start, end };
  }

  static filterByTimeRange<T extends { createdAt?: Date; updatedAt?: Date; date?: Date }>(
    items: T[],
    range: AnalyticsTimeRange,
    dateField: keyof T = 'createdAt'
  ): T[] {
    return items.filter(item => {
      const date = item[dateField] as Date;
      return date && date >= range.start && date <= range.end;
    });
  }

  static groupByDay<T extends { createdAt?: Date; updatedAt?: Date; date?: Date }>(
    items: T[],
    dateField: keyof T = 'createdAt'
  ): Map<string, T[]> {
    const groups = new Map<string, T[]>();
    
    items.forEach(item => {
      const date = item[dateField] as Date;
      if (!date) return;
      
      const dayKey = date.toISOString().split('T')[0];
      if (!groups.has(dayKey)) {
        groups.set(dayKey, []);
      }
      groups.get(dayKey)!.push(item);
    });

    return groups;
  }

  static groupByWeek<T extends { createdAt?: Date; updatedAt?: Date; date?: Date }>(
    items: T[],
    dateField: keyof T = 'createdAt'
  ): Map<string, T[]> {
    const groups = new Map<string, T[]>();
    
    items.forEach(item => {
      const date = item[dateField] as Date;
      if (!date) return;
      
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!groups.has(weekKey)) {
        groups.set(weekKey, []);
      }
      groups.get(weekKey)!.push(item);
    });

    return groups;
  }

  static groupByMonth<T extends { createdAt?: Date; updatedAt?: Date; date?: Date }>(
    items: T[],
    dateField: keyof T = 'createdAt'
  ): Map<string, T[]> {
    const groups = new Map<string, T[]>();
    
    items.forEach(item => {
      const date = item[dateField] as Date;
      if (!date) return;
      
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!groups.has(monthKey)) {
        groups.set(monthKey, []);
      }
      groups.get(monthKey)!.push(item);
    });

    return groups;
  }
}

// Productivity Analysis
export class ProductivityAnalyzer {
  static calculateMetrics(tasks: Task[], timeRange: AnalyticsTimeRange): ProductivityMetrics {
    const filteredTasks = TimeAnalyzer.filterByTimeRange(tasks, timeRange, 'updatedAt');
    const completedTasks = filteredTasks.filter(task => task.completed);
    const totalTasks = filteredTasks.length;
    
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
    const daysDiff = Math.max(1, (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const averageTasksPerDay = completedTasks.length / daysDiff;

    // Calculate streaks
    const { current: streakDays, longest: bestStreak } = this.calculateCompletionStreaks(tasks);

    // Calculate average completion time
    const completionTimes = completedTasks
      .filter(task => task.createdAt && task.updatedAt)
      .map(task => (task.updatedAt!.getTime() - task.createdAt!.getTime()) / (1000 * 60 * 60));
    const averageCompletionTime = StatisticsUtils.mean(completionTimes);

    // Determine productivity level
    let productivity: 'high' | 'medium' | 'low' = 'low';
    if (completionRate >= 80 && averageTasksPerDay >= 3) productivity = 'high';
    else if (completionRate >= 60 && averageTasksPerDay >= 1.5) productivity = 'medium';

    // Calculate trend
    const { trend, trendPercentage } = this.calculateTrend(tasks, timeRange);

    return {
      completionRate: Math.round(completionRate * 10) / 10,
      averageTasksPerDay: Math.round(averageTasksPerDay * 10) / 10,
      streakDays,
      bestStreak,
      totalTasks,
      completedTasks: completedTasks.length,
      pendingTasks: totalTasks - completedTasks.length,
      averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
      productivity,
      trend,
      trendPercentage,
    };
  }

  static calculateCompletionStreaks(tasks: Task[]): { current: number; longest: number } {
    // Use completedAt for completed tasks, falling back to updatedAt
    const completedTasks = tasks
      .filter(task => task.completed && (task.completedAt || task.updatedAt))
      .map(task => ({
        ...task,
        completionDate: task.completedAt || task.updatedAt!
      }));

    const completedByDay = TimeAnalyzer.groupByDay(completedTasks, 'completionDate');

    const today = new Date();
    let current = 0;
    let longest = 0;
    let tempStreak = 0;

    // Calculate current streak (from today backwards)
    const currentDate = new Date(today);
    while (true) {
      const dayKey = currentDate.toISOString().split('T')[0];
      if (completedByDay.has(dayKey) && completedByDay.get(dayKey)!.length > 0) {
        current++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak
    const sortedDays = Array.from(completedByDay.keys()).sort();
    let lastDate: Date | null = null;

    for (const dayKey of sortedDays) {
      const currentDay = new Date(dayKey);
      
      if (lastDate && (currentDay.getTime() - lastDate.getTime()) === 24 * 60 * 60 * 1000) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
      
      longest = Math.max(longest, tempStreak);
      lastDate = currentDay;
    }

    return { current, longest };
  }

  static calculateTrend(tasks: Task[], timeRange: AnalyticsTimeRange): { trend: 'up' | 'down' | 'stable'; trendPercentage: number } {
    const midPoint = new Date((timeRange.start.getTime() + timeRange.end.getTime()) / 2);

    const firstHalf = tasks.filter(task => {
      const date = task.completedAt || task.updatedAt || task.createdAt;
      return date && task.completed && date >= timeRange.start && date < midPoint;
    });

    const secondHalf = tasks.filter(task => {
      const date = task.completedAt || task.updatedAt || task.createdAt;
      return date && task.completed && date >= midPoint && date <= timeRange.end;
    });

    const firstHalfRate = firstHalf.length;
    const secondHalfRate = secondHalf.length;

    if (firstHalfRate === 0 && secondHalfRate === 0) {
      return { trend: 'stable', trendPercentage: 0 };
    }

    if (firstHalfRate === 0) {
      return { trend: 'up', trendPercentage: 100 };
    }

    const changePercent = ((secondHalfRate - firstHalfRate) / firstHalfRate) * 100;
    
    if (changePercent > 10) return { trend: 'up', trendPercentage: Math.round(changePercent) };
    if (changePercent < -10) return { trend: 'down', trendPercentage: Math.round(Math.abs(changePercent)) };
    return { trend: 'stable', trendPercentage: Math.round(Math.abs(changePercent)) };
  }

  static getProductivityInsights(metrics: ProductivityMetrics): string[] {
    const insights: string[] = [];

    if (metrics.completionRate >= 90) {
      insights.push("🎯 Excellent completion rate! You're crushing your goals.");
    } else if (metrics.completionRate >= 70) {
      insights.push("👍 Good completion rate. Consider breaking down larger tasks.");
    } else if (metrics.completionRate < 50) {
      insights.push("💡 Low completion rate. Try setting smaller, achievable tasks.");
    }

    if (metrics.streakDays >= 7) {
      insights.push(`🔥 Amazing ${metrics.streakDays}-day streak! Keep the momentum going.`);
    } else if (metrics.streakDays >= 3) {
      insights.push(`💪 ${metrics.streakDays}-day streak building. You're on a roll!`);
    }

    if (metrics.trend === 'up') {
      insights.push(`📈 Productivity trending up ${metrics.trendPercentage}%. Great progress!`);
    } else if (metrics.trend === 'down') {
      insights.push(`📉 Productivity down ${metrics.trendPercentage}%. Consider adjusting your approach.`);
    }

    if (metrics.averageCompletionTime > 168) { // More than a week
      insights.push("⏰ Tasks are taking a while to complete. Try breaking them down.");
    } else if (metrics.averageCompletionTime < 1) {
      insights.push("⚡ Quick task completion! Consider taking on bigger challenges.");
    }

    return insights;
  }
}

// Velocity Analysis
export class VelocityAnalyzer {
  static calculateVelocity(tasks: Task[], timeRange: AnalyticsTimeRange): VelocityAnalytics {
    // Use completedAt for completed tasks, falling back to updatedAt
    const completedTasks = tasks
      .filter(task => task.completed && (task.completedAt || task.updatedAt))
      .map(task => ({
        ...task,
        completionDate: task.completedAt || task.updatedAt!
      }));

    // Group by different time periods
    const dailyGroups = TimeAnalyzer.groupByDay(completedTasks, 'completionDate');
    const weeklyGroups = TimeAnalyzer.groupByWeek(completedTasks, 'completionDate');
    const monthlyGroups = TimeAnalyzer.groupByMonth(completedTasks, 'completionDate');

    const daily = Array.from(dailyGroups.values()).map(group => group.length);
    const weekly = Array.from(weeklyGroups.values()).map(group => group.length);
    const monthly = Array.from(monthlyGroups.values()).map(group => group.length);

    // Calculate trend
    const trend = this.calculateVelocityTrend(daily);
    
    // Predict next period
    const predictedNext = this.predictNextVelocity(daily);

    // Calculate consistency (inverse of coefficient of variation)
    const dailyMean = StatisticsUtils.mean(daily);
    const dailyStdDev = StatisticsUtils.standardDeviation(daily);
    const consistency = dailyMean > 0 ? Math.max(0, 1 - (dailyStdDev / dailyMean)) : 0;

    // Calculate volatility
    const volatility = dailyMean > 0 ? Math.min(1, dailyStdDev / dailyMean) : 0;

    return {
      daily,
      weekly,
      monthly,
      trend,
      predictedNext,
      consistency: Math.round(consistency * 100) / 100,
      volatility: Math.round(volatility * 100) / 100,
    };
  }

  private static calculateVelocityTrend(daily: number[]): 'accelerating' | 'decelerating' | 'stable' {
    if (daily.length < 5) return 'stable';

    const recent = daily.slice(-5);
    const earlier = daily.slice(-10, -5);
    
    if (earlier.length === 0) return 'stable';

    const recentAvg = StatisticsUtils.mean(recent);
    const earlierAvg = StatisticsUtils.mean(earlier);

    const changePercent = earlierAvg > 0 ? ((recentAvg - earlierAvg) / earlierAvg) * 100 : 0;

    if (changePercent > 15) return 'accelerating';
    if (changePercent < -15) return 'decelerating';
    return 'stable';
  }

  private static predictNextVelocity(daily: number[]): number {
    if (daily.length < 3) return StatisticsUtils.mean(daily);

    // Use weighted average of recent days with more weight on recent data
    const weights = daily.map((_, index) => Math.pow(1.2, index));
    const weightedSum = daily.reduce((sum, val, index) => sum + val * weights[index], 0);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    return Math.round(weightedSum / totalWeight);
  }
}

// Habit Analysis
export class HabitAnalyzer {
  static analyzeHabits(tasks: Task[], journalEntries: JournalEntry[]): HabitAnalytics {
    // Combine task and journal activities for habit analysis
    const activities = [
      ...tasks.filter(t => t.completed && (t.completedAt || t.updatedAt)).map(t => ({
        date: t.completedAt || t.updatedAt!,
        type: 'task'
      })),
      ...journalEntries.map(e => ({ date: e.date, type: 'journal' }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    const activityByDay = TimeAnalyzer.groupByDay(activities);
    const activeDays = activityByDay.size;
    
    // Calculate date range
    const dates = Array.from(activityByDay.keys()).map(key => new Date(key)).sort((a, b) => a.getTime() - b.getTime());
    const totalDays = dates.length > 0 
      ? Math.ceil((dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 0;

    // Calculate streaks
    const { current: streakCurrent, longest: streakLongest } = this.calculateActivityStreaks(activityByDay);

    // Calculate consistency
    const consistency = totalDays > 0 ? activeDays / totalDays : 0;

    // Analyze patterns
    const patterns = this.analyzeActivityPatterns(activities);

    return {
      streakCurrent,
      streakLongest,
      activeDays,
      totalDays,
      consistency: Math.round(consistency * 100) / 100,
      patterns,
    };
  }

  private static calculateActivityStreaks(activityByDay: Map<string, any[]>): { current: number; longest: number } {
    const sortedDays = Array.from(activityByDay.keys()).sort();
    const today = new Date().toISOString().split('T')[0];
    
    let current = 0;
    let longest = 0;
    let tempStreak = 0;

    // Calculate current streak (from today backwards)
    let checkDate = new Date();
    while (true) {
      const dayKey = checkDate.toISOString().split('T')[0];
      if (activityByDay.has(dayKey)) {
        current++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak
    let lastDate: Date | null = null;
    for (const dayKey of sortedDays) {
      const currentDay = new Date(dayKey);
      
      if (lastDate && (currentDay.getTime() - lastDate.getTime()) === 24 * 60 * 60 * 1000) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
      
      longest = Math.max(longest, tempStreak);
      lastDate = currentDay;
    }

    return { current, longest };
  }

  private static analyzeActivityPatterns(activities: { date: Date; type: string }[]): HabitAnalytics['patterns'] {
    const dayOfWeekCounts: { [key: string]: number } = {};
    const hourCounts: { [key: number]: number } = {};
    const sessionLengths: number[] = [];

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    activities.forEach(activity => {
      const dayName = dayNames[activity.date.getDay()];
      const hour = activity.date.getHours();

      dayOfWeekCounts[dayName] = (dayOfWeekCounts[dayName] || 0) + 1;
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Find best day of week
    const bestDayOfWeek = Object.entries(dayOfWeekCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Monday';

    // Find best time of day
    const bestHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '9';
    const bestTimeOfDay = `${bestHour}:00`;

    // Calculate average session length (simplified)
    const averageSessionLength = StatisticsUtils.mean(sessionLengths) || 30; // Default 30 minutes

    return {
      bestDayOfWeek,
      bestTimeOfDay,
      averageSessionLength,
    };
  }
}

// Export utilities
export const AnalyticsUtils = {
  Statistics: StatisticsUtils,
  Time: TimeAnalyzer,
  Productivity: ProductivityAnalyzer,
  Velocity: VelocityAnalyzer,
  Habit: HabitAnalyzer,
};

export default AnalyticsUtils;