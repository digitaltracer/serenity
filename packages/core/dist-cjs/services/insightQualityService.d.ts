/**
 * Insight Quality Service
 * Validates, scores, deduplicates, and ranks AI insights to ensure only high-value
 * recommendations reach the user
 */
import { AIInsight } from '../store/slices/aiAssistantSlice';
export interface InsightQualityScore {
    relevance: number;
    actionability: number;
    novelty: number;
    impact: number;
    confidence: number;
    overall: number;
}
export interface ScoredInsight extends AIInsight {
    qualityScore: InsightQualityScore;
    similarTo?: string[];
    supersedes?: string;
}
export interface DeduplicationResult {
    uniqueInsights: ScoredInsight[];
    duplicateGroups: Array<{
        primary: ScoredInsight;
        duplicates: ScoredInsight[];
    }>;
}
export declare class InsightQualityService {
    private static readonly QUALITY_THRESHOLDS;
    private static readonly SIMILARITY_THRESHOLD;
    /**
     * Calculate relevance score based on insight category and type
     */
    private static calculateRelevanceScore;
    /**
     * Calculate actionability score based on insight content
     */
    private static calculateActionabilityScore;
    /**
     * Calculate novelty score by comparing to previous insights
     */
    private static calculateNoveltyScore;
    /**
     * Calculate impact score based on insight type and metadata
     */
    private static calculateImpactScore;
    /**
     * Calculate overall quality score with weighted components
     */
    private static calculateOverallScore;
    /**
     * Score a single insight
     */
    static scoreInsight(insight: AIInsight, context?: {
        previousInsights?: AIInsight[];
        focusAreas?: string[];
        recentCategories?: string[];
    }): ScoredInsight;
    /**
     * Score multiple insights
     */
    static scoreInsights(insights: AIInsight[], context?: {
        previousInsights?: AIInsight[];
        focusAreas?: string[];
        recentCategories?: string[];
    }): ScoredInsight[];
    /**
     * Validate that an insight meets minimum quality standards
     */
    static validateInsight(insight: AIInsight): {
        valid: boolean;
        reasons: string[];
    };
    /**
     * Filter insights by quality threshold
     */
    static filterByQuality(scoredInsights: ScoredInsight[], minimumScore?: number): ScoredInsight[];
    /**
     * Calculate text similarity using simple word overlap (Jaccard similarity)
     */
    private static calculateTextSimilarity;
    /**
     * Check if two insights are semantically similar
     */
    private static areSimilar;
    /**
     * Deduplicate insights, keeping the highest quality version
     */
    static deduplicateInsights(scoredInsights: ScoredInsight[]): DeduplicationResult;
    /**
     * Rank insights by overall quality score
     */
    static rankInsights(scoredInsights: ScoredInsight[]): ScoredInsight[];
    /**
     * Full quality pipeline: validate → score → filter → deduplicate → rank
     */
    static processInsights(insights: AIInsight[], context?: {
        previousInsights?: AIInsight[];
        focusAreas?: string[];
        recentCategories?: string[];
        minimumQuality?: number;
    }): ScoredInsight[];
    /**
     * Get quality tier label for UI
     */
    static getQualityTier(score: number): 'excellent' | 'good' | 'fair' | 'poor';
    /**
     * Generate quality report for debugging/monitoring
     */
    static generateQualityReport(scoredInsights: ScoredInsight[]): {
        total: number;
        byTier: Record<string, number>;
        avgScores: InsightQualityScore;
        topInsights: ScoredInsight[];
        lowQualityInsights: ScoredInsight[];
    };
}
export default InsightQualityService;
