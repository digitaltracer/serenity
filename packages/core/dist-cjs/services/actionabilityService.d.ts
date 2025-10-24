/**
 * Actionability Service
 * Generates concrete, actionable suggestions from AI insights
 */
import type { AppDispatch } from '../store';
import type { Task, Goal } from '../types';
export interface ActionabilitySuggestion {
    id: string;
    action: string;
    description: string;
    type: 'task' | 'goal' | 'habit' | 'journal_prompt';
    priority: 'high' | 'medium' | 'low';
    metadata?: {
        suggestedTitle?: string;
        suggestedDescription?: string;
        suggestedTags?: string[];
        suggestedDueDate?: string;
        suggestedTargetValue?: number;
        suggestedTargetUnit?: string;
    };
}
export interface AIInsightForActionability {
    id: string;
    type: 'productivity' | 'behavior' | 'recommendation' | 'warning';
    title: string;
    description: string;
    category: 'tasks' | 'journal' | 'habits' | 'goals';
    actionable?: boolean;
    metadata?: {
        sourceIds?: string[];
        tags?: string[];
        priority?: 'high' | 'medium' | 'low';
        [key: string]: any;
    };
}
export declare class ActionabilityService {
    /**
     * Analyze an insight and generate actionable suggestions
     */
    static generateSuggestions(insight: AIInsightForActionability, userContext: {
        tasks: Task[];
        goals: Goal[];
        habits?: any[];
    }): ActionabilitySuggestion[];
    /**
     * Check if an insight is actionable based on type and content
     */
    static isActionable(insight: AIInsightForActionability): boolean;
    /**
     * Convert a suggestion into a concrete action (e.g., create task)
     */
    static executeSuggestion(suggestion: ActionabilitySuggestion, dispatch: AppDispatch): Promise<{
        success: boolean;
        actionId?: string;
        error?: string;
    }>;
    private static generateProductivitySuggestions;
    private static generateBehaviorSuggestions;
    private static generateRecommendationSuggestions;
    private static generateWarningSuggestions;
    private static deduplicateSuggestions;
    private static executeTaskSuggestion;
    private static executeGoalSuggestion;
    private static executeHabitSuggestion;
    private static executeJournalPromptSuggestion;
}
