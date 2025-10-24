/**
 * Feedback Service
 * Handles user feedback on insights and updates user preferences for future personalization
 */
export interface UserFeedback {
    rating?: number;
    helpful?: boolean;
    dismissed?: boolean;
    note?: string;
}
export interface FeedbackStats {
    totalInsights: number;
    helpfulCount: number;
    dismissedCount: number;
    avgRating: number;
    ratedCount: number;
    preferredCategories: string[];
    preferredTypes: string[];
}
export interface InsightPreferences {
    preferredCategories: string[];
    dismissedTypes: string[];
    helpfulTypes: string[];
    avgRatingByType: Record<string, number>;
    avgRatingByCategory: Record<string, number>;
}
/**
 * Interface for insights with feedback tracking
 */
export interface InsightWithFeedback {
    id: string;
    type: 'productivity' | 'behavior' | 'recommendation' | 'warning';
    category: 'tasks' | 'journal' | 'habits' | 'goals';
    userRating?: number;
    dismissed?: boolean;
    markedHelpful?: boolean;
    userNotes?: string;
}
export declare class FeedbackService {
    /**
     * Process user feedback on an insight
     * This integrates with IPC to update the database
     */
    static processFeedback(insightId: string, feedback: UserFeedback): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Update user preferences based on feedback patterns
     * This learns from user behavior to improve future insights
     */
    static updateUserPreferences(insights: InsightWithFeedback[]): InsightPreferences;
    /**
     * Get feedback statistics for monitoring and display
     */
    static getFeedbackStats(insights: InsightWithFeedback[]): FeedbackStats;
    /**
     * Determine if an insight type should be deprioritized based on feedback
     */
    static shouldDeprioritizeType(type: string, insights: InsightWithFeedback[]): boolean;
    /**
     * Determine if an insight category should be prioritized based on feedback
     */
    static shouldPrioritizeCategory(category: string, insights: InsightWithFeedback[]): boolean;
    /**
     * Get recommendations for insight generation based on feedback
     */
    static getGenerationRecommendations(insights: InsightWithFeedback[]): {
        prioritizeCategories: string[];
        deprioritizeTypes: string[];
        suggestedFocus: string[];
    };
}
