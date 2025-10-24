/**
 * Feedback Service
 * Handles user feedback on insights and updates user preferences for future personalization
 */

import { logger } from '../utils/logger';

export interface UserFeedback {
  rating?: number; // 1-5
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
  preferredCategories: string[]; // ['productivity', 'habits']
  dismissedTypes: string[]; // Types user frequently dismisses
  helpfulTypes: string[]; // Types user finds helpful
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

export class FeedbackService {
  /**
   * Process user feedback on an insight
   * This integrates with IPC to update the database
   */
  static async processFeedback(
    insightId: string,
    feedback: UserFeedback
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Processing insight feedback', {
        component: 'FeedbackService',
        operation: 'processFeedback',
        metadata: { insightId, feedback }
      });

      // Call IPC to update feedback in database
      if (typeof window !== 'undefined' && (window.electronAPI as any)?.insights?.updateFeedback) {
        const result = await (window.electronAPI as any).insights.updateFeedback(insightId, {
          userRating: feedback.rating,
          dismissed: feedback.dismissed,
          markedHelpful: feedback.helpful,
          userNotes: feedback.note,
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to update feedback');
        }

        logger.info('Feedback processed successfully', {
          component: 'FeedbackService',
          operation: 'processFeedback'
        });

        return { success: true };
      }

      throw new Error('Insights API not available');
    } catch (error) {
      logger.error('Failed to process feedback', {
        component: 'FeedbackService',
        operation: 'processFeedback'
      }, error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Update user preferences based on feedback patterns
   * This learns from user behavior to improve future insights
   */
  static updateUserPreferences(
    insights: InsightWithFeedback[]
  ): InsightPreferences {
    logger.info('Updating user preferences from feedback', {
      component: 'FeedbackService',
      operation: 'updateUserPreferences',
      metadata: { insightCount: insights.length }
    });

    const preferences: InsightPreferences = {
      preferredCategories: [],
      dismissedTypes: [],
      helpfulTypes: [],
      avgRatingByType: {},
      avgRatingByCategory: {},
    };

    // Track ratings by type and category
    const typeRatings: Record<string, number[]> = {};
    const categoryRatings: Record<string, number[]> = {};
    const typeDismissals: Record<string, number> = {};
    const typeHelpful: Record<string, number> = {};
    const categoryHelpful: Record<string, number> = {};

    insights.forEach(insight => {
      // Track ratings
      if (insight.userRating) {
        if (!typeRatings[insight.type]) typeRatings[insight.type] = [];
        if (!categoryRatings[insight.category]) categoryRatings[insight.category] = [];

        typeRatings[insight.type].push(insight.userRating);
        categoryRatings[insight.category].push(insight.userRating);
      }

      // Track dismissals
      if (insight.dismissed) {
        typeDismissals[insight.type] = (typeDismissals[insight.type] || 0) + 1;
      }

      // Track helpful marks
      if (insight.markedHelpful) {
        typeHelpful[insight.type] = (typeHelpful[insight.type] || 0) + 1;
        categoryHelpful[insight.category] = (categoryHelpful[insight.category] || 0) + 1;
      }
    });

    // Calculate average ratings by type
    Object.keys(typeRatings).forEach(type => {
      const ratings = typeRatings[type];
      const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      preferences.avgRatingByType[type] = avg;
    });

    // Calculate average ratings by category
    Object.keys(categoryRatings).forEach(category => {
      const ratings = categoryRatings[category];
      const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      preferences.avgRatingByCategory[category] = avg;
    });

    // Identify dismissed types (dismissed > 50% of the time)
    const typeTotal: Record<string, number> = {};
    insights.forEach(i => {
      typeTotal[i.type] = (typeTotal[i.type] || 0) + 1;
    });

    Object.keys(typeDismissals).forEach(type => {
      const dismissRate = typeDismissals[type] / typeTotal[type];
      if (dismissRate > 0.5) {
        preferences.dismissedTypes.push(type);
      }
    });

    // Identify helpful types (marked helpful > 30% of the time OR avg rating >= 4)
    Object.keys(typeHelpful).forEach(type => {
      const helpfulRate = typeHelpful[type] / typeTotal[type];
      const avgRating = preferences.avgRatingByType[type];

      if (helpfulRate > 0.3 || (avgRating && avgRating >= 4)) {
        preferences.helpfulTypes.push(type);
      }
    });

    // Identify preferred categories (marked helpful most or highest avg rating)
    const categoriesByHelpful = Object.entries(categoryHelpful)
      .sort(([, a], [, b]) => b - a)
      .map(([category]) => category);

    const categoriesByRating = Object.entries(preferences.avgRatingByCategory)
      .sort(([, a], [, b]) => b - a)
      .map(([category]) => category);

    // Combine both signals
    const categoryScores: Record<string, number> = {};
    categoriesByHelpful.forEach((cat, idx) => {
      categoryScores[cat] = (categoryScores[cat] || 0) + (categoriesByHelpful.length - idx);
    });
    categoriesByRating.forEach((cat, idx) => {
      categoryScores[cat] = (categoryScores[cat] || 0) + (categoriesByRating.length - idx);
    });

    preferences.preferredCategories = Object.entries(categoryScores)
      .sort(([, a], [, b]) => b - a)
      .map(([category]) => category);

    logger.info('User preferences updated', {
      component: 'FeedbackService',
      operation: 'updateUserPreferences',
      metadata: {
        preferredCategories: preferences.preferredCategories,
        helpfulTypes: preferences.helpfulTypes,
        dismissedTypes: preferences.dismissedTypes
      }
    });

    return preferences;
  }

  /**
   * Get feedback statistics for monitoring and display
   */
  static getFeedbackStats(insights: InsightWithFeedback[]): FeedbackStats {
    logger.info('Calculating feedback statistics', {
      component: 'FeedbackService',
      operation: 'getFeedbackStats',
      metadata: { insightCount: insights.length }
    });

    const stats: FeedbackStats = {
      totalInsights: insights.length,
      helpfulCount: 0,
      dismissedCount: 0,
      avgRating: 0,
      ratedCount: 0,
      preferredCategories: [],
      preferredTypes: [],
    };

    if (insights.length === 0) {
      return stats;
    }

    let totalRating = 0;

    insights.forEach(insight => {
      if (insight.markedHelpful) {
        stats.helpfulCount++;
      }
      if (insight.dismissed) {
        stats.dismissedCount++;
      }
      if (insight.userRating) {
        stats.ratedCount++;
        totalRating += insight.userRating;
      }
    });

    if (stats.ratedCount > 0) {
      stats.avgRating = totalRating / stats.ratedCount;
    }

    // Get preferences to populate preferred categories and types
    const preferences = this.updateUserPreferences(insights);
    stats.preferredCategories = preferences.preferredCategories;
    stats.preferredTypes = preferences.helpfulTypes;

    logger.info('Feedback statistics calculated', {
      component: 'FeedbackService',
      operation: 'getFeedbackStats',
      metadata: {
        helpfulCount: stats.helpfulCount,
        dismissedCount: stats.dismissedCount,
        avgRating: stats.avgRating.toFixed(2)
      }
    });

    return stats;
  }

  /**
   * Determine if an insight type should be deprioritized based on feedback
   */
  static shouldDeprioritizeType(
    type: string,
    insights: InsightWithFeedback[]
  ): boolean {
    const typeInsights = insights.filter(i => i.type === type);

    if (typeInsights.length < 5) {
      return false; // Not enough data
    }

    const dismissedCount = typeInsights.filter(i => i.dismissed).length;
    const helpfulCount = typeInsights.filter(i => i.markedHelpful).length;
    const dismissRate = dismissedCount / typeInsights.length;
    const helpfulRate = helpfulCount / typeInsights.length;

    // Deprioritize if dismissed >60% of the time and helpful <20% of the time
    return dismissRate > 0.6 && helpfulRate < 0.2;
  }

  /**
   * Determine if an insight category should be prioritized based on feedback
   */
  static shouldPrioritizeCategory(
    category: string,
    insights: InsightWithFeedback[]
  ): boolean {
    const categoryInsights = insights.filter(i => i.category === category);

    if (categoryInsights.length < 3) {
      return false; // Not enough data
    }

    const helpfulCount = categoryInsights.filter(i => i.markedHelpful).length;
    const ratedInsights = categoryInsights.filter(i => i.userRating);
    const avgRating = ratedInsights.length > 0
      ? ratedInsights.reduce((sum, i) => sum + (i.userRating || 0), 0) / ratedInsights.length
      : 0;

    const helpfulRate = helpfulCount / categoryInsights.length;

    // Prioritize if helpful >40% of the time or average rating >=4
    return helpfulRate > 0.4 || avgRating >= 4;
  }

  /**
   * Get recommendations for insight generation based on feedback
   */
  static getGenerationRecommendations(
    insights: InsightWithFeedback[]
  ): {
    prioritizeCategories: string[];
    deprioritizeTypes: string[];
    suggestedFocus: string[];
  } {
    const preferences = this.updateUserPreferences(insights);

    const allTypes = ['productivity', 'behavior', 'recommendation', 'warning'];
    const allCategories = ['tasks', 'journal', 'habits', 'goals'];

    const deprioritizeTypes = allTypes.filter(type =>
      this.shouldDeprioritizeType(type, insights)
    );

    const prioritizeCategories = allCategories.filter(category =>
      this.shouldPrioritizeCategory(category, insights)
    );

    // Suggest focus areas based on what user engages with
    const suggestedFocus: string[] = [];
    if (preferences.preferredCategories.length > 0) {
      suggestedFocus.push(`Focus on ${preferences.preferredCategories[0]} insights`);
    }
    if (preferences.helpfulTypes.length > 0) {
      suggestedFocus.push(`More ${preferences.helpfulTypes[0]} type insights`);
    }
    if (deprioritizeTypes.length > 0) {
      suggestedFocus.push(`Reduce ${deprioritizeTypes[0]} insights`);
    }

    logger.info('Generation recommendations calculated', {
      component: 'FeedbackService',
      operation: 'getGenerationRecommendations',
      metadata: {
        prioritizeCategories,
        deprioritizeTypes,
        suggestedFocus
      }
    });

    return {
      prioritizeCategories,
      deprioritizeTypes,
      suggestedFocus,
    };
  }
}
