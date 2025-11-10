/**
 * User Profile Service
 * Builds and maintains user profiles over time to enable personalized AI insights
 */
import { Task, JournalEntry, Goal } from '../types';
import { AIInsight } from '../store/slices/aiAssistantSlice';
export interface UserProfile {
    productivityPeakHours: number[];
    averageTasksPerWeek: number;
    averageDailyTasks: number;
    completionRateHistory: Array<{
        date: string;
        rate: number;
    }>;
    currentCompletionRate: number;
    workStyle: 'sprinter' | 'marathon' | 'balanced';
    focusAreas: string[];
    communicationPreference: 'detailed' | 'concise';
    activeGoals: Goal[];
    goalCompletionRate: number;
    recentAchievements: Array<{
        goal: string;
        completedAt: string;
    }>;
    commonTags: Array<{
        tag: string;
        frequency: number;
    }>;
    topProjects: Array<{
        project: string;
        taskCount: number;
    }>;
    journalingFrequency: 'daily' | 'weekly' | 'sporadic' | 'none';
    journalingDays: number[];
    journalingHours: number[];
    moodDistribution: Record<string, number>;
    sentimentTrend: 'improving' | 'stable' | 'declining';
    stressIndicators: string[];
    insightPreferences: {
        preferredCategories: string[];
        preferredTypes: string[];
        actedOnInsights: string[];
        dismissedInsights: string[];
        avgEngagementTime: number;
    };
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
export declare class UserProfileService {
    /**
     * Detect work style based on task completion patterns
     */
    private static detectWorkStyle;
    /**
     * Identify productivity peak hours
     */
    private static identifyPeakHours;
    /**
     * Calculate completion rate trend
     */
    private static calculateCompletionRateHistory;
    /**
     * Analyze common tags
     */
    private static analyzeCommonTags;
    /**
     * Determine journaling frequency
     */
    private static determineJournalingFrequency;
    /**
     * Analyze journaling patterns
     */
    private static analyzeJournalingPatterns;
    /**
     * Analyze mood distribution
     */
    private static analyzeMoodDistribution;
    /**
     * Detect sentiment trend
     */
    private static detectSentimentTrend;
    /**
     * Identify stress indicators from journal
     */
    private static identifyStressIndicators;
    /**
     * Analyze insight interactions
     */
    private static analyzeInsightPreferences;
    /**
     * Build or update user profile
     */
    static buildProfile(context: ProfileUpdateContext, existingProfile?: UserProfile): UserProfile;
    /**
     * Get focus areas summary for AI context
     */
    static getFocusAreasSummary(profile: UserProfile): string;
}
export default UserProfileService;
