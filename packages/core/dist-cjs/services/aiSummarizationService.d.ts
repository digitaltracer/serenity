/**
 * AI Summarization Service
 * Generates date-range based summaries of tasks and journal entries
 */
import { Task, JournalEntry } from '../types';
export interface SummaryRequest {
    provider: 'openai' | 'gemini' | 'anthropic' | 'local';
    startDate: string;
    endDate: string;
    types: ('tasks' | 'journal')[];
    tasks: Task[];
    journalEntries: JournalEntry[];
}
export interface SummaryResult {
    title: string;
    content: string;
    summaryType: 'tasks' | 'journal' | 'combined';
    wordCount: number;
    metadata: {
        tags?: string[];
        moodAnalysis?: {
            averageMood: number;
            dominantMood: string;
            moodTrend: 'improving' | 'stable' | 'declining';
        };
        taskStats?: {
            totalTasks: number;
            completedTasks: number;
            byPriority: Record<string, number>;
            byCategory: Record<string, number>;
        };
    };
}
export declare class AISummarizationService {
    /**
     * Generate a summary based on tasks and journal entries
     */
    static generateSummary(request: SummaryRequest): Promise<SummaryResult>;
    /**
     * Filter tasks by date range
     */
    private static filterTasksByDateRange;
    /**
     * Filter journal entries by date range
     */
    private static filterJournalsByDateRange;
    /**
     * Determine summary type based on requested types
     */
    private static determineSummaryType;
    /**
     * Generate a local summary without AI (fallback)
     */
    private static generateLocalSummary;
    /**
     * Build a prompt for AI provider
     */
    static buildSummaryPrompt(tasks: Task[], journals: JournalEntry[], types: ('tasks' | 'journal')[], startDate: string, endDate: string): string;
    /**
     * Count words in text
     */
    static countWords(text: string): number;
}
