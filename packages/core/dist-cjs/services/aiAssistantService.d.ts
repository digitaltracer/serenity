/**
 * AI Assistant Service
 * Handles AI provider integration, data preprocessing, and analysis coordination
 */
import { Task, JournalEntry } from '../types';
import { AIInsight, AIRecap } from '../store/slices/aiAssistantSlice';
export interface AIApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
export interface AnalysisRequest {
    provider: 'openai' | 'gemini' | 'anthropic';
    tasks: Task[];
    journalEntries: JournalEntry[];
    dataTypes: string[];
    analysisType: 'insights' | 'recap';
    timeframe?: {
        start: Date;
        end: Date;
    };
}
export interface RecapRequest {
    provider: 'openai' | 'gemini' | 'anthropic';
    type: 'weekly' | 'monthly';
    period: {
        start: string;
        end: string;
    };
    tasks: Task[];
    journalEntries: JournalEntry[];
}
export interface PreprocessedTask {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    priority: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    dueDate?: Date;
    daysSinceCreated: number;
    isOverdue: boolean;
    completionTime: number | null;
}
export interface PreprocessedJournalEntry {
    id: string;
    content: string;
    mood?: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    wordCount: number;
    dayOfWeek: number;
    hourOfDay: number;
}
export interface GoalSuggestion {
    title: string;
    description: string;
    type: 'weekly_tasks' | 'project_tasks' | 'priority_tasks' | 'daily_streak' | 'journal_weekly' | 'completion_rate';
    priority: 'low' | 'medium' | 'high';
    targetCount?: number;
    timeframe: 'daily' | 'weekly' | 'monthly';
    reasoning: string;
    confidence: number;
}
export declare class AIAssistantService {
    /**
     * Generate goal suggestions based on user activity patterns
     */
    static generateGoalSuggestions(data: {
        tasks: Task[];
        journalEntries: JournalEntry[];
        existingGoals?: any[];
    }): GoalSuggestion[];
    /**
     * Preprocess tasks for AI analysis
     * Removes sensitive information and structures data
     */
    static preprocessTasks(tasks: Task[]): PreprocessedTask[];
    /**
     * Generate basic, local insights without calling external providers.
     * Provides a sensible fallback when no provider is configured.
     */
    static generateLocalInsights(tasks: Task[], journalEntries: JournalEntry[]): {
        type: "productivity" | "behavior" | "recommendation" | "warning";
        title: string;
        description: string;
        category: "tasks" | "journal" | "habits" | "goals";
        actionable?: boolean;
        confidence: number;
        metadata?: Record<string, unknown>;
    }[];
    /**
     * Preprocess journal entries for AI analysis
     * Removes sensitive information and structures data
     */
    static preprocessJournalEntries(entries: JournalEntry[]): PreprocessedJournalEntry[];
    /**
     * Generate prompts for behavioral analysis
     */
    static generateInsightPrompts(data: {
        tasks: PreprocessedTask[];
        journalEntries: PreprocessedJournalEntry[];
        dataTypes: string[];
    }): Record<string, string>;
    /**
     * Generate prompts for recap generation
     */
    static generateRecapPrompts(data: {
        type: 'weekly' | 'monthly';
        period: {
            start: string;
            end: string;
        };
        tasks: PreprocessedTask[];
        journalEntries: PreprocessedJournalEntry[];
    }): string;
    /**
     * Filter new data that hasn't been analyzed yet
     */
    static filterUnanalyzedData(tasks: Task[], journalEntries: JournalEntry[], analysisTracker: {
        processedTaskIds: string[];
        processedJournalIds: string[];
        lastTaskAnalysis?: string;
        lastJournalAnalysis?: string;
    }): {
        newTasks: Task[];
        newJournalEntries: JournalEntry[];
    };
    /**
     * Create analysis summary for tracking
     */
    static createAnalysisSummary(analyzedTasks: Task[], analyzedJournalEntries: JournalEntry[]): {
        processedTaskIds: string[];
        processedJournalIds: string[];
        lastTaskAnalysis?: string;
        lastJournalAnalysis?: string;
        totalTasksAnalyzed: number;
        totalJournalEntriesAnalyzed: number;
    };
    /**
     * Parse AI response and extract insights
     */
    static parseInsightsResponse(response: string): AIInsight[];
    /**
     * Parse AI response and extract recap
     */
    static parseRecapResponse(response: string, type: 'weekly' | 'monthly', period: {
        start: string;
        end: string;
    }): AIRecap | null;
    /**
     * Validate API key format
     */
    static validateApiKeyFormat(provider: 'openai' | 'gemini' | 'anthropic', apiKey: string): boolean;
    /**
     * Estimate token usage for analysis
     */
    static estimateTokenUsage(tasks: Task[], journalEntries: JournalEntry[]): number;
    /**
     * Get provider-specific configuration
     */
    static getProviderConfig(provider: 'openai' | 'gemini' | 'anthropic'): {
        name: string;
        model: string;
        maxTokens: number;
        apiEndpoint: string;
        keyPrefix: string;
    } | {
        name: string;
        model: string;
        maxTokens: number;
        apiEndpoint: string;
        keyPrefix: string;
    } | {
        name: string;
        model: string;
        maxTokens: number;
        apiEndpoint: string;
        keyPrefix: string;
    };
    /**
     * Apply quality scoring, filtering, deduplication, and ranking to insights
     * This is the integration point for InsightQualityService
     */
    static applyQualityScoring(rawInsights: AIInsight[], context?: {
        previousInsights?: AIInsight[];
        focusAreas?: string[];
        recentCategories?: string[];
        minimumQuality?: number;
    }): AIInsight[];
}
export default AIAssistantService;
