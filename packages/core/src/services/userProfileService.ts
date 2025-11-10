/**
 * User Profile Service
 * Builds and maintains user profiles over time to enable personalized AI insights
 */

import { Task, JournalEntry, Goal } from '../types';
import { AIInsight } from '../store/slices/aiAssistantSlice';
import { logger } from '../utils/logger';

export interface UserProfile {
  // Work Patterns
  productivityPeakHours: number[];
  averageTasksPerWeek: number;
  averageDailyTasks: number;
  completionRateHistory: Array<{ date: string; rate: number }>;
  currentCompletionRate: number;

  // Preferences & Style
  workStyle: 'sprinter' | 'marathon' | 'balanced';
  focusAreas: string[]; // Current priorities
  communicationPreference: 'detailed' | 'concise';

  // Goals & Objectives
  activeGoals: Goal[];
  goalCompletionRate: number;
  recentAchievements: Array<{ goal: string; completedAt: string }>;

  // Behavioral Patterns
  commonTags: Array<{ tag: string; frequency: number }>;
  topProjects: Array<{ project: string; taskCount: number }>;
  journalingFrequency: 'daily' | 'weekly' | 'sporadic' | 'none';
  journalingDays: number[]; // Days of week when user journals (0-6)
  journalingHours: number[]; // Hours of day when user journals

  // Emotional & Well-being Patterns
  moodDistribution: Record<string, number>;
  sentimentTrend: 'improving' | 'stable' | 'declining';
  stressIndicators: string[];

  // Insight Interaction
  insightPreferences: {
    preferredCategories: string[];
    preferredTypes: string[];
    actedOnInsights: string[]; // IDs
    dismissedInsights: string[]; // IDs
    avgEngagementTime: number; // seconds
  };

  // Temporal Information
  profileCreatedAt: string;
  lastUpdated: string;
  dataPointsAnalyzed: number;
}

export interface ProfileUpdateContext {
  tasks: Task[];
  journalEntries: JournalEntry[];
  goals: Goal[];
  insights?: AIInsight[];
  insightInteractions?: Array<{
    insightId: string;
    action: 'viewed' | 'actioned' | 'dismissed';
    timestamp: string;
  }>;
}

export class UserProfileService {
  /**
   * Detect work style based on task completion patterns
   */
  private static detectWorkStyle(tasks: Task[]): 'sprinter' | 'marathon' | 'balanced' {
    const completedTasks = tasks.filter(t => t.completed && t.createdAt && t.completedAt);

    if (completedTasks.length < 10) return 'balanced'; // Not enough data

    // Calculate completion times
    const completionTimes = completedTasks
      .map(t => {
        const created = new Date(t.createdAt).getTime();
        const completed = new Date(t.completedAt!).getTime();
        return (completed - created) / (1000 * 60 * 60 * 24); // days
      })
      .filter(time => time >= 0 && time < 365); // Filter outliers

    if (completionTimes.length === 0) return 'balanced';

    const avgCompletionTime = completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length;
    const variance = completionTimes.length > 0
      ? completionTimes.reduce((sum, t) => sum + Math.pow(t - avgCompletionTime, 2), 0) /
        completionTimes.length
      : 0;
    const stdDev = Math.sqrt(variance);

    // Sprinters: Quick completions with high variance (bursts of activity)
    if (avgCompletionTime < 2 && stdDev > avgCompletionTime * 0.8) {
      return 'sprinter';
    }

    // Marathon: Consistent, steady progress
    if (stdDev < avgCompletionTime * 0.5) {
      return 'marathon';
    }

    return 'balanced';
  }

  /**
   * Identify productivity peak hours
   */
  private static identifyPeakHours(tasks: Task[]): number[] {
    const completedTasks = tasks.filter(t => t.completed && t.completedAt);

    if (completedTasks.length < 5) return [];

    // Count completions by hour
    const hourCounts = new Array(24).fill(0);
    completedTasks.forEach(task => {
      const hour = new Date(task.completedAt!).getHours();
      hourCounts[hour]++;
    });

    // Find hours with above-average completions
    const avgCompletions = hourCounts.reduce((sum, count) => sum + count, 0) / 24;
    const threshold = avgCompletions * 1.5; // 50% above average

    const peakHours: number[] = [];
    hourCounts.forEach((count, hour) => {
      if (count >= threshold) {
        peakHours.push(hour);
      }
    });

    return peakHours;
  }

  /**
   * Calculate completion rate trend
   */
  private static calculateCompletionRateHistory(tasks: Task[]): Array<{ date: string; rate: number }> {
    const history: Array<{ date: string; rate: number }> = [];

    // Group tasks by week
    const weekGroups = new Map<string, { total: number; completed: number }>();

    tasks.forEach(task => {
      const created = new Date(task.createdAt);
      const weekStart = new Date(created);
      weekStart.setDate(created.getDate() - created.getDay()); // Start of week
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekGroups.has(weekKey)) {
        weekGroups.set(weekKey, { total: 0, completed: 0 });
      }

      const group = weekGroups.get(weekKey)!;
      group.total++;
      if (task.completed) group.completed++;
    });

    // Convert to array and calculate rates
    weekGroups.forEach((stats, date) => {
      history.push({
        date,
        rate: stats.total > 0 ? stats.completed / stats.total : 0,
      });
    });

    return history.sort((a, b) => a.date.localeCompare(b.date)).slice(-12); // Last 12 weeks
  }

  /**
   * Analyze common tags
   */
  private static analyzeCommonTags(
    tasks: Task[],
    journalEntries: JournalEntry[]
  ): Array<{ tag: string; frequency: number }> {
    const tagCounts = new Map<string, number>();

    // Count task tags
    tasks.forEach(task => {
      (task.tags || []).forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    // Count journal tags
    journalEntries.forEach(entry => {
      (entry.tags || []).forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    // Convert to array and sort
    return Array.from(tagCounts.entries())
      .map(([tag, frequency]) => ({ tag, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  /**
   * Determine journaling frequency
   */
  private static determineJournalingFrequency(
    entries: JournalEntry[]
  ): 'daily' | 'weekly' | 'sporadic' | 'none' {
    if (entries.length === 0) return 'none';

    // Calculate days since first entry
    const sorted = [...entries].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const firstEntry = new Date(sorted[0].createdAt);
    const now = new Date();
    let daysSinceFirst = (now.getTime() - firstEntry.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceFirst < 1) daysSinceFirst = 1; // Avoid division by zero

    const entriesPerDay = entries.length / daysSinceFirst;

    if (entriesPerDay >= 0.7) return 'daily'; // ~5+ entries per week
    if (entriesPerDay >= 0.2) return 'weekly'; // ~1-4 entries per week
    return 'sporadic';
  }

  /**
   * Analyze journaling patterns
   */
  private static analyzeJournalingPatterns(entries: JournalEntry[]): {
    days: number[];
    hours: number[];
  } {
    const dayCounts = new Array(7).fill(0);
    const hourCounts = new Array(24).fill(0);

    entries.forEach(entry => {
      const date = new Date(entry.createdAt);
      dayCounts[date.getDay()]++;
      hourCounts[date.getHours()]++;
    });

    // Find days/hours with above-average activity
    const avgDayCount = dayCounts.reduce((sum, c) => sum + c, 0) / 7;
    const avgHourCount = hourCounts.reduce((sum, c) => sum + c, 0) / 24;

    const preferredDays = dayCounts
      .map((count, day) => ({ day, count }))
      .filter(d => d.count >= avgDayCount * 0.5)
      .map(d => d.day);

    const preferredHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(h => h.count >= avgHourCount * 0.5)
      .map(h => h.hour);

    return {
      days: preferredDays,
      hours: preferredHours,
    };
  }

  /**
   * Analyze mood distribution
   */
  private static analyzeMoodDistribution(entries: JournalEntry[]): Record<string, number> {
    const moodCounts: Record<string, number> = {};

    entries.forEach(entry => {
      if (entry.mood) {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      }
    });

    return moodCounts;
  }

  /**
   * Detect sentiment trend
   */
  private static detectSentimentTrend(entries: JournalEntry[]): 'improving' | 'stable' | 'declining' {
    if (entries.length < 5) return 'stable';

    // Simple sentiment analysis based on keywords
    const getSentiment = (content: string): number => {
      const positive = ['happy', 'great', 'good', 'excellent', 'achieved', 'success', 'progress'];
      const negative = ['bad', 'difficult', 'hard', 'struggle', 'failed', 'frustrated', 'overwhelmed'];

      const lower = content.toLowerCase();
      let score = 0;

      positive.forEach(word => {
        if (lower.includes(word)) score++;
      });
      negative.forEach(word => {
        if (lower.includes(word)) score--;
      });

      return score;
    };

    // Sort by date and split into first/second half
    const sorted = [...entries].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);

    const firstAvg = firstHalf.reduce((sum, e) => sum + getSentiment(e.content), 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, e) => sum + getSentiment(e.content), 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;

    if (diff > 0.5) return 'improving';
    if (diff < -0.5) return 'declining';
    return 'stable';
  }

  /**
   * Identify stress indicators from journal
   */
  private static identifyStressIndicators(entries: JournalEntry[]): string[] {
    const stressKeywords = {
      'High workload': ['overwhelmed', 'too much', 'overloaded', 'swamped'],
      'Time pressure': ['deadline', 'urgent', 'running out of time', 'behind schedule'],
      'Difficulty focusing': ["can't focus", 'distracted', 'scattered', 'unfocused'],
      'Exhaustion': ['tired', 'exhausted', 'drained', 'burned out', 'burnout'],
      'Anxiety': ['anxious', 'worried', 'stressed', 'nervous', 'pressure'],
    };

    const indicators: Set<string> = new Set();

    entries.forEach(entry => {
      const lower = entry.content.toLowerCase();
      Object.entries(stressKeywords).forEach(([indicator, keywords]) => {
        if (keywords.some(kw => lower.includes(kw))) {
          indicators.add(indicator);
        }
      });
    });

    return Array.from(indicators);
  }

  /**
   * Analyze insight interactions
   */
  private static analyzeInsightPreferences(
    insights: AIInsight[],
    interactions?: Array<{
      insightId: string;
      action: 'viewed' | 'actioned' | 'dismissed';
      timestamp: string;
    }>
  ): {
    preferredCategories: string[];
    preferredTypes: string[];
    actedOnInsights: string[];
    dismissedInsights: string[];
    avgEngagementTime: number;
  } {
    const categoryCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    const actedOn: string[] = [];
    const dismissed: string[] = [];

    if (interactions) {
      interactions.forEach(interaction => {
        const insight = insights.find(i => i.id === interaction.insightId);
        if (!insight) return;

        if (interaction.action === 'actioned') {
          actedOn.push(interaction.insightId);
          categoryCounts[insight.category] = (categoryCounts[insight.category] || 0) + 2; // Weight actioned higher
          typeCounts[insight.type] = (typeCounts[insight.type] || 0) + 2;
        } else if (interaction.action === 'viewed') {
          categoryCounts[insight.category] = (categoryCounts[insight.category] || 0) + 1;
          typeCounts[insight.type] = (typeCounts[insight.type] || 0) + 1;
        } else if (interaction.action === 'dismissed') {
          dismissed.push(interaction.insightId);
        }
      });
    }

    const preferredCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    const preferredTypes = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);

    return {
      preferredCategories,
      preferredTypes,
      actedOnInsights: actedOn,
      dismissedInsights: dismissed,
      avgEngagementTime: 30, // TODO: Calculate from actual engagement data
    };
  }

  /**
   * Build or update user profile
   */
  static buildProfile(context: ProfileUpdateContext, existingProfile?: UserProfile): UserProfile {
    logger.info('🧠 Building user profile from data', {
      component: 'userProfileService',
      operation: 'buildProfile',
      metadata: {
        tasks: context.tasks.length,
        journals: context.journalEntries.length,
        goals: context.goals.length,
      },
    });

    const completedTasks = context.tasks.filter(t => t.completed);
    const currentCompletionRate =
      context.tasks.length > 0 ? completedTasks.length / context.tasks.length : 0;

    // Calculate average tasks per week
    const oldestTask = context.tasks.length > 0
      ? new Date(Math.min(...context.tasks.map(t => new Date(t.createdAt).getTime())))
      : new Date();
    let weeksSinceFirst = Math.max(1, (Date.now() - oldestTask.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const averageTasksPerWeek = context.tasks.length / weeksSinceFirst;
    const averageDailyTasks = averageTasksPerWeek / 7;

    // Goal analysis
    const completedGoals = context.goals.filter(g => g.progress?.isCompleted || false);
    const goalCompletionRate = context.goals.length > 0 ? completedGoals.length / context.goals.length : 0;

    const journalingPatterns = this.analyzeJournalingPatterns(context.journalEntries);
    const insightPrefs = this.analyzeInsightPreferences(context.insights || [], context.insightInteractions);

    const profile: UserProfile = {
      productivityPeakHours: this.identifyPeakHours(context.tasks),
      averageTasksPerWeek,
      averageDailyTasks,
      completionRateHistory: this.calculateCompletionRateHistory(context.tasks),
      currentCompletionRate,

      workStyle: this.detectWorkStyle(context.tasks),
      focusAreas: this.analyzeCommonTags(context.tasks, context.journalEntries)
        .slice(0, 5)
        .map(t => t.tag),
      communicationPreference: existingProfile?.communicationPreference || 'detailed',

      activeGoals: context.goals.filter(g => !g.progress?.isCompleted),
      goalCompletionRate,
      recentAchievements: completedGoals
        .map(g => ({
          goal: g.title,
          completedAt: g.updatedAt.toISOString(),
        }))
        .slice(-5),

      commonTags: this.analyzeCommonTags(context.tasks, context.journalEntries),
      topProjects: [], // TODO: Implement project analysis
      journalingFrequency: this.determineJournalingFrequency(context.journalEntries),
      journalingDays: journalingPatterns.days,
      journalingHours: journalingPatterns.hours,

      moodDistribution: this.analyzeMoodDistribution(context.journalEntries),
      sentimentTrend: this.detectSentimentTrend(context.journalEntries),
      stressIndicators: this.identifyStressIndicators(context.journalEntries),

      insightPreferences: insightPrefs,

      profileCreatedAt: existingProfile?.profileCreatedAt || new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      dataPointsAnalyzed: context.tasks.length + context.journalEntries.length,
    };

    logger.info('✅ User profile built successfully', {
      component: 'userProfileService',
      operation: 'buildProfile',
      metadata: {
        workStyle: profile.workStyle,
        completionRate: (profile.currentCompletionRate * 100).toFixed(0) + '%',
        journalingFrequency: profile.journalingFrequency,
        focusAreas: profile.focusAreas.slice(0, 3).join(', '),
      },
    });

    return profile;
  }

  /**
   * Get focus areas summary for AI context
   */
  static getFocusAreasSummary(profile: UserProfile): string {
    const parts: string[] = [];

    if (profile.focusAreas.length > 0) {
      parts.push(`Current focus: ${profile.focusAreas.slice(0, 3).join(', ')}`);
    }

    if (profile.activeGoals.length > 0) {
      parts.push(`Active goals: ${profile.activeGoals.length}`);
    }

    parts.push(`Work style: ${profile.workStyle}`);
    parts.push(`Completion rate: ${(profile.currentCompletionRate * 100).toFixed(0)}%`);

    if (profile.stressIndicators.length > 0) {
      parts.push(`Stress indicators: ${profile.stressIndicators.join(', ')}`);
    }

    return parts.join(' | ');
  }
}

export default UserProfileService;

