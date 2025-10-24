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
export declare class VisualizationService {
    /**
     * Generate KPI metrics from tasks and journal entries
     */
    static generateKPIMetrics(data: {
        tasks: Task[];
        journalEntries: JournalEntry[];
        timeRange: TimeRange;
    }): KPIMetrics;
    /**
     * Calculate weekly tasks completed with comparison to previous week
     */
    private static calculateWeeklyTasksCompleted;
    /**
     * Calculate average mood from journal entries
     */
    private static calculateAverageMood;
    /**
     * Calculate productivity score (0-100) based on task completion and consistency
     */
    private static calculateProductivityScoreMetric;
    /**
     * Calculate productivity score for a given time range
     */
    static calculateProductivityScore(tasks: Task[], timeRange: TimeRange): number;
    /**
     * Calculate active streak (consecutive days with activity)
     */
    private static calculateActiveStreakMetric;
    /**
     * Calculate active streak
     */
    static calculateActiveStreak(tasks: Task[], journalEntries: JournalEntry[]): number;
    /**
     * Generate time-series data for trend charts
     */
    static generateTrendData(tasks: Task[], journalEntries: JournalEntry[], metric: 'completion' | 'mood' | 'productivity' | 'velocity', granularity: 'day' | 'week' | 'month', timeRange: TimeRange): TrendDataPoint[];
    /**
     * Generate task completion trend
     */
    private static generateCompletionTrend;
    /**
     * Generate mood trend
     */
    private static generateMoodTrend;
    /**
     * Generate productivity trend
     */
    private static generateProductivityTrend;
    /**
     * Generate velocity trend (tasks completed per period)
     */
    private static generateVelocityTrend;
    /**
     * Generate time periods based on granularity
     */
    private static generateTimePeriods;
    /**
     * Format period label for display
     */
    private static formatPeriodLabel;
    /**
     * Extract mood trend from journal entries
     */
    static extractMoodTrend(journalEntries: JournalEntry[], timeRange: TimeRange): Array<{
        date: string;
        mood: number;
    }>;
    /**
     * Generate dual-axis chart data (e.g., tasks vs mood)
     */
    static generateDualAxisData(tasks: Task[], journalEntries: JournalEntry[], timeRange: TimeRange, granularity?: 'day' | 'week' | 'month'): Array<{
        timestamp: string;
        tasks: number;
        mood: number;
        label: string;
    }>;
}
