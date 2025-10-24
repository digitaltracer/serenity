/**
 * Prompt Engineering Service
 * Advanced prompt generation with context injection, few-shot examples,
 * and chain-of-thought reasoning for better AI insights
 */
import { PreprocessedTask, PreprocessedJournalEntry } from './aiPreprocessingService';
import { Goal } from '../types';
export interface PromptContext {
    userGoals?: Goal[];
    focusAreas?: string[];
    workStyle?: 'sprinter' | 'marathon' | 'balanced';
    previousInsights?: Array<{
        type: string;
        title: string;
    }>;
    currentPriorities?: string[];
    timeframe?: string;
    userPreferences?: {
        communicationStyle: 'detailed' | 'concise';
        preferredCategories: string[];
    };
}
export interface FewShotExample {
    input: string;
    output: string;
}
export declare class PromptEngineeringService {
    /**
     * High-quality few-shot examples for insights
     */
    private static readonly INSIGHT_EXAMPLES;
    /**
     * Generate system prompt with rich context
     */
    private static generateSystemPrompt;
    /**
     * Generate few-shot examples section
     */
    private static generateFewShotPrompt;
    /**
     * Generate JSON schema specification
     */
    private static generateSchemaPrompt;
    /**
     * Generate chain-of-thought prompt for deeper analysis
     */
    private static generateChainOfThoughtPrompt;
    /**
     * Generate comprehensive analysis prompt for tasks and journal
     */
    static generateInsightPrompt(data: {
        tasks: PreprocessedTask[];
        journalEntries: PreprocessedJournalEntry[];
        dataTypes: string[];
        context?: PromptContext;
        dataSummary?: string;
    }): string;
    /**
     * Generate recap prompt with enhanced context
     */
    static generateRecapPrompt(data: {
        type: 'weekly' | 'monthly';
        period: {
            start: string;
            end: string;
        };
        tasks: PreprocessedTask[];
        journalEntries: PreprocessedJournalEntry[];
        context?: PromptContext;
        dataSummary?: string;
    }): string;
    /**
     * Optimize prompt for token efficiency
     */
    static optimizePromptTokens(prompt: string, maxTokens: number): string;
    /**
     * Generate targeted prompt for specific insight type
     */
    static generateTargetedPrompt(type: 'productivity' | 'habits' | 'wellbeing' | 'goals', data: {
        tasks: PreprocessedTask[];
        journalEntries: PreprocessedJournalEntry[];
        context?: PromptContext;
    }): string;
}
export default PromptEngineeringService;
