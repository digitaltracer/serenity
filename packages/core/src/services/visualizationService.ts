/**
 * VisualizationService
 * Transforms Redux state data into chart-ready data structures for Recharts
 */

import { Task, JournalEntry } from '../types';

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface KPIMetrics {
  weeklyTasksCompleted: {
    value: number;
    change: number;
    sparkline: number[];
  };
  averageMood: {
    value: number;
    change: number;
    sparkline: number[];
  };
  productivityScore: {
    value: number;
    change: number;
    sparkline: number[];
  };
  activeStreak: {
    value: number;
    change: number;
  };
}

export interface TrendDataPoint {
  timestamp: string;
  value: number;
  label: string;
}

export class VisualizationService {
  /**
   * Generate KPI metrics from tasks and journal entries
   */
  static generateKPIMetrics(data: {
    tasks: Task[];
    journalEntries: JournalEntry[];
    timeRange: TimeRange;
  }): KPIMetrics {
    const { tasks, journalEntries, timeRange } = data;

    // Calculate weekly tasks completed
    const weeklyTasks = this.calculateWeeklyTasksCompleted(tasks, timeRange);

    // Calculate average mood
    const averageMood = this.calculateAverageMood(journalEntries, timeRange);

    // Calculate productivity score
    const productivityScore = this.calculateProductivityScoreMetric(tasks, timeRange);

    // Calculate active streak
    const activeStreak = this.calculateActiveStreakMetric(tasks, journalEntries);

    return {
      weeklyTasksCompleted: weeklyTasks,
      averageMood,
      productivityScore,
      activeStreak,
    };
  }

  /**
   * Calculate weekly tasks completed with comparison to previous week
   */
  private static calculateWeeklyTasksCompleted(tasks: Task[], timeRange: TimeRange): {
    value: number;
    change: number;
    sparkline: number[];
  } {
    const now = timeRange.end;
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Current week
    const currentWeekTasks = tasks.filter(t =>
      t.completed &&
      t.completedAt &&
      new Date(t.completedAt) >= weekAgo &&
      new Date(t.completedAt) <= now
    );

    // Previous week
    const previousWeekTasks = tasks.filter(t =>
      t.completed &&
      t.completedAt &&
      new Date(t.completedAt) >= twoWeeksAgo &&
      new Date(t.completedAt) < weekAgo
    );

    const currentCount = currentWeekTasks.length;
    const previousCount = previousWeekTasks.length;
    const change = previousCount === 0 ? 0 : ((currentCount - previousCount) / previousCount) * 100;

    // Generate sparkline for last 7 days
    const sparkline: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayTasks = tasks.filter(t =>
        t.completed &&
        t.completedAt &&
        new Date(t.completedAt) >= dayStart &&
        new Date(t.completedAt) < dayEnd
      );
      sparkline.push(dayTasks.length);
    }

    return { value: currentCount, change, sparkline };
  }

  /**
   * Calculate average mood from journal entries
   */
  private static calculateAverageMood(journalEntries: JournalEntry[], timeRange: TimeRange): {
    value: number;
    change: number;
    sparkline: number[];
  } {
    const moodValues: { [key: string]: number } = {
      'happy': 5,
      'excited': 5,
      'neutral': 3,
      'sad': 1,
      'stressed': 2,
    };

    const now = timeRange.end;
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Current week mood
    const currentWeekEntries = journalEntries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate >= weekAgo && entryDate <= now && e.mood;
    });

    const currentAvg = currentWeekEntries.length > 0
      ? currentWeekEntries.reduce((sum, e) => sum + (moodValues[e.mood!] || 3), 0) / currentWeekEntries.length
      : 3;

    // Previous week mood
    const previousWeekEntries = journalEntries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate >= twoWeeksAgo && entryDate < weekAgo && e.mood;
    });

    const previousAvg = previousWeekEntries.length > 0
      ? previousWeekEntries.reduce((sum, e) => sum + (moodValues[e.mood!] || 3), 0) / previousWeekEntries.length
      : 3;

    const change = previousAvg === 0 ? 0 : ((currentAvg - previousAvg) / previousAvg) * 100;

    // Generate sparkline for last 7 days
    const sparkline: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayEntries = journalEntries.filter(e => {
        const entryDate = new Date(e.date);
        return entryDate >= dayStart && entryDate < dayEnd && e.mood;
      });
      const dayAvg = dayEntries.length > 0
        ? dayEntries.reduce((sum, e) => sum + (moodValues[e.mood!] || 3), 0) / dayEntries.length
        : 3;
      sparkline.push(dayAvg);
    }

    return { value: currentAvg, change, sparkline };
  }

  /**
   * Calculate productivity score (0-100) based on task completion and consistency
   */
  private static calculateProductivityScoreMetric(tasks: Task[], timeRange: TimeRange): {
    value: number;
    change: number;
    sparkline: number[];
  } {
    const now = timeRange.end;
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const currentScore = this.calculateProductivityScore(tasks, { start: weekAgo, end: now });
    const previousScore = this.calculateProductivityScore(tasks, { start: twoWeeksAgo, end: weekAgo });

    const change = previousScore === 0 ? 0 : ((currentScore - previousScore) / previousScore) * 100;

    // Generate sparkline for last 7 days
    const sparkline: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayScore = this.calculateProductivityScore(tasks, { start: dayStart, end: dayEnd });
      sparkline.push(dayScore);
    }

    return { value: currentScore, change, sparkline };
  }

  /**
   * Calculate productivity score for a given time range
   */
  static calculateProductivityScore(tasks: Task[], timeRange: TimeRange): number {
    const { start, end } = timeRange;

    // Filter tasks in range
    const tasksInRange = tasks.filter(t => {
      const createdAt = new Date(t.createdAt);
      return createdAt >= start && createdAt <= end;
    });

    if (tasksInRange.length === 0) return 0;

    const completedTasks = tasksInRange.filter(t => t.completed);
    const completionRate = completedTasks.length / tasksInRange.length;

    // Calculate consistency (how many days had activity)
    const daysInRange = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    const activeDays = new Set<string>();

    completedTasks.forEach(t => {
      if (t.completedAt) {
        const date = new Date(t.completedAt).toISOString().split('T')[0];
        activeDays.add(date);
      }
    });

    const consistency = activeDays.size / daysInRange;

    // Weighted score: 70% completion rate, 30% consistency
    const score = (completionRate * 0.7 + consistency * 0.3) * 100;

    return Math.round(score);
  }

  /**
   * Calculate active streak (consecutive days with activity)
   */
  private static calculateActiveStreakMetric(tasks: Task[], journalEntries: JournalEntry[]): {
    value: number;
    change: number;
  } {
    const currentStreak = this.calculateActiveStreak(tasks, journalEntries);

    // For simplicity, change is 0 (would need historical data to calculate properly)
    return { value: currentStreak, change: 0 };
  }

  /**
   * Calculate active streak
   */
  static calculateActiveStreak(tasks: Task[], journalEntries: JournalEntry[]): number {
    const activityDates = new Set<string>();

    // Add task completion dates
    tasks.forEach(t => {
      if (t.completed && t.completedAt) {
        const date = new Date(t.completedAt).toISOString().split('T')[0];
        activityDates.add(date);
      }
    });

    // Add journal entry dates
    journalEntries.forEach(e => {
      const date = new Date(e.date).toISOString().split('T')[0];
      activityDates.add(date);
    });

    // Sort dates
    const sortedDates = Array.from(activityDates).sort().reverse();

    if (sortedDates.length === 0) return 0;

    // Calculate streak from today backwards
    const today = new Date().toISOString().split('T')[0];
    let streak = 0;
    let currentDate = new Date(today);

    for (let i = 0; i < 365; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (activityDates.has(dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Generate time-series data for trend charts
   */
  static generateTrendData(
    tasks: Task[],
    journalEntries: JournalEntry[],
    metric: 'completion' | 'mood' | 'productivity' | 'velocity',
    granularity: 'day' | 'week' | 'month',
    timeRange: TimeRange
  ): TrendDataPoint[] {
    switch (metric) {
      case 'completion':
        return this.generateCompletionTrend(tasks, granularity, timeRange);
      case 'mood':
        return this.generateMoodTrend(journalEntries, granularity, timeRange);
      case 'productivity':
        return this.generateProductivityTrend(tasks, granularity, timeRange);
      case 'velocity':
        return this.generateVelocityTrend(tasks, granularity, timeRange);
      default:
        return [];
    }
  }

  /**
   * Generate task completion trend
   */
  private static generateCompletionTrend(
    tasks: Task[],
    granularity: 'day' | 'week' | 'month',
    timeRange: TimeRange
  ): TrendDataPoint[] {
    const periods = this.generateTimePeriods(timeRange, granularity);

    return periods.map(period => {
      const completedInPeriod = tasks.filter(t =>
        t.completed &&
        t.completedAt &&
        new Date(t.completedAt) >= period.start &&
        new Date(t.completedAt) < period.end
      );

      return {
        timestamp: period.start.toISOString(),
        value: completedInPeriod.length,
        label: this.formatPeriodLabel(period.start, granularity),
      };
    });
  }

  /**
   * Generate mood trend
   */
  private static generateMoodTrend(
    journalEntries: JournalEntry[],
    granularity: 'day' | 'week' | 'month',
    timeRange: TimeRange
  ): TrendDataPoint[] {
    const moodValues: { [key: string]: number } = {
      'happy': 5,
      'excited': 5,
      'neutral': 3,
      'sad': 1,
      'stressed': 2,
    };

    const periods = this.generateTimePeriods(timeRange, granularity);

    return periods.map(period => {
      const entriesInPeriod = journalEntries.filter(e => {
        const entryDate = new Date(e.date);
        return entryDate >= period.start && entryDate < period.end && e.mood;
      });

      const avgMood = entriesInPeriod.length > 0
        ? entriesInPeriod.reduce((sum, e) => sum + (moodValues[e.mood!] || 3), 0) / entriesInPeriod.length
        : 0;

      return {
        timestamp: period.start.toISOString(),
        value: avgMood,
        label: this.formatPeriodLabel(period.start, granularity),
      };
    });
  }

  /**
   * Generate productivity trend
   */
  private static generateProductivityTrend(
    tasks: Task[],
    granularity: 'day' | 'week' | 'month',
    timeRange: TimeRange
  ): TrendDataPoint[] {
    const periods = this.generateTimePeriods(timeRange, granularity);

    return periods.map(period => {
      const score = this.calculateProductivityScore(tasks, period);

      return {
        timestamp: period.start.toISOString(),
        value: score,
        label: this.formatPeriodLabel(period.start, granularity),
      };
    });
  }

  /**
   * Generate velocity trend (tasks completed per period)
   */
  private static generateVelocityTrend(
    tasks: Task[],
    granularity: 'day' | 'week' | 'month',
    timeRange: TimeRange
  ): TrendDataPoint[] {
    return this.generateCompletionTrend(tasks, granularity, timeRange);
  }

  /**
   * Generate time periods based on granularity
   */
  private static generateTimePeriods(timeRange: TimeRange, granularity: 'day' | 'week' | 'month'): TimeRange[] {
    const periods: TimeRange[] = [];
    let current = new Date(timeRange.start);
    const end = new Date(timeRange.end);

    while (current < end) {
      const periodEnd = new Date(current);

      switch (granularity) {
        case 'day':
          periodEnd.setDate(periodEnd.getDate() + 1);
          break;
        case 'week':
          periodEnd.setDate(periodEnd.getDate() + 7);
          break;
        case 'month':
          periodEnd.setMonth(periodEnd.getMonth() + 1);
          break;
      }

      periods.push({
        start: new Date(current),
        end: periodEnd > end ? end : periodEnd,
      });

      current = periodEnd;
    }

    return periods;
  }

  /**
   * Format period label for display
   */
  private static formatPeriodLabel(date: Date, granularity: 'day' | 'week' | 'month'): string {
    switch (granularity) {
      case 'day':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'week':
        return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  }

  /**
   * Extract mood trend from journal entries
   */
  static extractMoodTrend(
    journalEntries: JournalEntry[],
    timeRange: TimeRange
  ): Array<{ date: string; mood: number }> {
    const moodValues: { [key: string]: number } = {
      'happy': 5,
      'excited': 5,
      'neutral': 3,
      'sad': 1,
      'stressed': 2,
    };

    return journalEntries
      .filter(e => {
        const entryDate = new Date(e.date);
        return entryDate >= timeRange.start && entryDate <= timeRange.end && e.mood;
      })
      .map(e => ({
        date: typeof e.date === 'string' ? e.date : e.date.toISOString(),
        mood: moodValues[e.mood!] || 3,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Generate dual-axis chart data (e.g., tasks vs mood)
   */
  static generateDualAxisData(
    tasks: Task[],
    journalEntries: JournalEntry[],
    timeRange: TimeRange,
    granularity: 'day' | 'week' | 'month' = 'day'
  ): Array<{ timestamp: string; tasks: number; mood: number; label: string }> {
    const completionTrend = this.generateCompletionTrend(tasks, granularity, timeRange);
    const moodTrend = this.generateMoodTrend(journalEntries, granularity, timeRange);

    // Merge both trends
    const dataMap = new Map<string, { tasks: number; mood: number; label: string }>();

    completionTrend.forEach(point => {
      dataMap.set(point.timestamp, {
        tasks: point.value,
        mood: 0,
        label: point.label,
      });
    });

    moodTrend.forEach(point => {
      const existing = dataMap.get(point.timestamp);
      if (existing) {
        existing.mood = point.value;
      } else {
        dataMap.set(point.timestamp, {
          tasks: 0,
          mood: point.value,
          label: point.label,
        });
      }
    });

    return Array.from(dataMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([timestamp, data]) => ({
        timestamp,
        ...data,
      }));
  }
}
