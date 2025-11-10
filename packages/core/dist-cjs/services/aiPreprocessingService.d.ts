/**
 * AI Preprocessing Service
 * Intelligent data preprocessing for AI analysis with smart summarization,
 * quality scoring, and temporal weighting
 */
import { Task, JournalEntry } from '../types';
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
    qualityScore: number;
    temporalWeight: number;
    summary: string;
    keyEntities: string[];
    urgencyScore: number;
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
    qualityScore: number;
    temporalWeight: number;
    summary: string;
    keyThemes: string[];
    emotionalTone: string;
    sentiment: 'positive' | 'neutral' | 'negative';
}
export interface PreprocessingConfig {
    maxTaskDescriptionTokens: number;
    maxJournalContentTokens: number;
    temporalDecayDays: number;
    minQualityScore: number;
    prioritizeRecent: boolean;
}
export declare class AIPreprocessingService {
    private static readonly DEFAULT_CONFIG;
    /**
     * Extract key entities from text (dates, numbers, proper nouns, tags)
     */
    private static extractKeyEntities;
    /**
     * Calculate temporal weight (recent items get higher weight)
     */
    private static calculateTemporalWeight;
    /**
     * Calculate data quality score based on completeness and richness
     */
    private static calculateTaskQualityScore;
    /**
     * Calculate journal entry quality score
     */
    private static calculateJournalQualityScore;
    /**
     * Calculate urgency score for tasks
     */
    private static calculateUrgencyScore;
    /**
     * Detect sentiment in journal entry
     */
    private static detectSentiment;
    /**
     * Extract key themes from journal entry
     */
    private static extractKeyThemes;
    /**
     * Create smart summary using extractive method
     */
    private static smartSummarize;
    /**
     * Preprocess tasks with enhanced intelligence
     */
    static preprocessTasks(tasks: Task[], config?: Partial<PreprocessingConfig>): PreprocessedTask[];
    /**
     * Preprocess journal entries with enhanced intelligence
     */
    static preprocessJournalEntries(entries: JournalEntry[], config?: Partial<PreprocessingConfig>): PreprocessedJournalEntry[];
    /**
     * Prepare data summary for prompt context
     */
    static prepareDataSummary(preprocessedTasks: PreprocessedTask[], preprocessedEntries: PreprocessedJournalEntry[]): string;
    /**
     * Helper to get top N items by frequency
     */
    private static getTopItems;
}
export default AIPreprocessingService;
