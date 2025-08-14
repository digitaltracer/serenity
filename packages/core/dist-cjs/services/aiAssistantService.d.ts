/**
 * AI Assistant Service
 * Handles AI provider integration, data preprocessing, and analysis coordination
 */
import { Task, JournalEntry } from '../types';
import { AIInsight, AIRecap } from '../store/slices/aiAssistantSlice';
export interface AIApiResponse {
    success: boolean;
    data?: any;
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
export declare class AIAssistantService {
    /**
     * Preprocess tasks for AI analysis
     * Removes sensitive information and structures data
     */
    static preprocessTasks(tasks: Task[]): any[];
    /**
     * Preprocess journal entries for AI analysis
     * Removes sensitive information and structures data
     */
    static preprocessJournalEntries(entries: JournalEntry[]): any[];
    /**
     * Generate prompts for behavioral analysis
     */
    static generateInsightPrompts(data: {
        tasks: any[];
        journalEntries: any[];
        dataTypes: string[];
    }): {
        [key: string]: string;
    };
    /**
     * Generate prompts for recap generation
     */
    static generateRecapPrompts(data: {
        type: 'weekly' | 'monthly';
        period: {
            start: string;
            end: string;
        };
        tasks: any[];
        journalEntries: any[];
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
}
export default AIAssistantService;
//# sourceMappingURL=aiAssistantService.d.ts.map