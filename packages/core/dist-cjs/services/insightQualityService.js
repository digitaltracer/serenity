"use strict";
/**
 * Insight Quality Service
 * Validates, scores, deduplicates, and ranks AI insights to ensure only high-value
 * recommendations reach the user
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsightQualityService = void 0;
const logger_1 = require("../utils/logger");
class InsightQualityService {
    /**
     * Calculate relevance score based on insight category and type
     */
    static calculateRelevanceScore(insight, context) {
        let score = 0.5; // Base relevance
        // Higher relevance for warnings and recommendations
        if (insight.type === 'warning')
            score += 0.2;
        if (insight.type === 'recommendation')
            score += 0.15;
        // Category relevance
        if (context?.focusAreas) {
            const categoryMatch = context.focusAreas.some(area => insight.category.toLowerCase().includes(area.toLowerCase()) ||
                insight.title.toLowerCase().includes(area.toLowerCase()));
            if (categoryMatch)
                score += 0.2;
        }
        // Recent category preference
        if (context?.recentCategories) {
            if (context.recentCategories.includes(insight.category)) {
                score += 0.15;
            }
        }
        return Math.min(1.0, score);
    }
    /**
     * Calculate actionability score based on insight content
     */
    static calculateActionabilityScore(insight) {
        let score = 0.3; // Base score
        // Check if insight is marked as actionable
        if (insight.actionable) {
            score += 0.2;
        }
        const description = insight.description.toLowerCase();
        // Check for specific action indicators
        const actionVerbs = [
            'consider', 'try', 'focus on', 'review', 'create', 'set', 'allocate',
            'schedule', 'prioritize', 'delegate', 'block', 'limit', 'increase', 'reduce'
        ];
        const hasActionVerbs = actionVerbs.some(verb => description.includes(verb));
        if (hasActionVerbs)
            score += 0.2;
        // Check for numbered steps or lists
        const hasNumberedSteps = /\d+[).:]/.test(description);
        if (hasNumberedSteps)
            score += 0.15;
        // Check for specific metrics or numbers
        const hasMetrics = /\d+%|\d+\s+(?:tasks?|hours?|days?|minutes?)/.test(description);
        if (hasMetrics)
            score += 0.1;
        // Check for metadata with nextSteps
        if (insight.metadata?.nextSteps && Array.isArray(insight.metadata.nextSteps)) {
            score += 0.15;
        }
        // Penalty for vague language
        const vagueTerms = ['maybe', 'perhaps', 'might want to', 'could consider'];
        const hasVagueTerms = vagueTerms.some(term => description.includes(term));
        if (hasVagueTerms)
            score -= 0.1;
        return Math.max(0, Math.min(1.0, score));
    }
    /**
     * Calculate novelty score by comparing to previous insights
     */
    static calculateNoveltyScore(insight, previousInsights = []) {
        if (previousInsights.length === 0)
            return 1.0;
        // Compare title and description similarity
        const similarities = previousInsights.map(prev => this.calculateTextSimilarity(insight.title + ' ' + insight.description, prev.title + ' ' + prev.description));
        const maxSimilarity = Math.max(...similarities, 0);
        // Novel insights have low similarity to previous ones
        return 1.0 - maxSimilarity;
    }
    /**
     * Calculate impact score based on insight type and metadata
     */
    static calculateImpactScore(insight) {
        let score = 0.5; // Base impact
        // Type-based impact
        if (insight.type === 'warning')
            score += 0.3; // Warnings often high impact
        if (insight.type === 'recommendation')
            score += 0.2;
        if (insight.type === 'productivity')
            score += 0.15;
        // Category-based impact
        if (insight.category === 'goals')
            score += 0.15;
        if (insight.category === 'tasks')
            score += 0.1;
        // Metadata-based impact
        if (insight.metadata?.impact) {
            const impactValue = {
                high: 0.3,
                medium: 0.15,
                low: 0.0,
            }[insight.metadata.impact] || 0;
            score += impactValue;
        }
        // Check for urgency indicators
        const urgentTerms = ['overdue', 'urgent', 'critical', 'immediately', 'now'];
        const hasUrgency = urgentTerms.some(term => insight.title.toLowerCase().includes(term) ||
            insight.description.toLowerCase().includes(term));
        if (hasUrgency)
            score += 0.2;
        return Math.min(1.0, score);
    }
    /**
     * Calculate overall quality score with weighted components
     */
    static calculateOverallScore(scores) {
        const weights = {
            relevance: 0.25,
            actionability: 0.30,
            novelty: 0.20,
            impact: 0.15,
            confidence: 0.10,
        };
        return (scores.relevance * weights.relevance +
            scores.actionability * weights.actionability +
            scores.novelty * weights.novelty +
            scores.impact * weights.impact +
            scores.confidence * weights.confidence);
    }
    /**
     * Score a single insight
     */
    static scoreInsight(insight, context) {
        const relevance = this.calculateRelevanceScore(insight, context);
        const actionability = this.calculateActionabilityScore(insight);
        const novelty = this.calculateNoveltyScore(insight, context?.previousInsights);
        const impact = this.calculateImpactScore(insight);
        const confidence = insight.confidence || 0.5;
        const qualityScore = {
            relevance,
            actionability,
            novelty,
            impact,
            confidence,
            overall: 0,
        };
        qualityScore.overall = this.calculateOverallScore(qualityScore);
        return {
            ...insight,
            qualityScore,
        };
    }
    /**
     * Score multiple insights
     */
    static scoreInsights(insights, context) {
        return insights.map(insight => this.scoreInsight(insight, context));
    }
    /**
     * Validate that an insight meets minimum quality standards
     */
    static validateInsight(insight) {
        const reasons = [];
        // Title validation
        if (!insight.title || insight.title.trim().length === 0) {
            reasons.push('Missing title');
        }
        if (insight.title && insight.title.length > 100) {
            reasons.push('Title too long (max 100 characters)');
        }
        // Description validation
        if (!insight.description || insight.description.trim().length === 0) {
            reasons.push('Missing description');
        }
        if (insight.description && insight.description.length < 20) {
            reasons.push('Description too short (min 20 characters)');
        }
        // Type validation
        const validTypes = ['productivity', 'behavior', 'recommendation', 'warning'];
        if (!validTypes.includes(insight.type)) {
            reasons.push(`Invalid type: ${insight.type}`);
        }
        // Category validation
        const validCategories = ['tasks', 'journal', 'habits', 'goals'];
        if (!validCategories.includes(insight.category)) {
            reasons.push(`Invalid category: ${insight.category}`);
        }
        // Confidence validation
        if (insight.confidence < 0 || insight.confidence > 1) {
            reasons.push('Confidence must be between 0 and 1');
        }
        return {
            valid: reasons.length === 0,
            reasons,
        };
    }
    /**
     * Filter insights by quality threshold
     */
    static filterByQuality(scoredInsights, minimumScore = this.QUALITY_THRESHOLDS.minimum) {
        return scoredInsights.filter(insight => insight.qualityScore.overall >= minimumScore);
    }
    /**
     * Calculate text similarity using simple word overlap (Jaccard similarity)
     */
    static calculateTextSimilarity(text1, text2) {
        const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
        const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
        if (words1.size === 0 || words2.size === 0)
            return 0;
        const intersection = new Set([...words1].filter(w => words2.has(w)));
        const union = new Set([...words1, ...words2]);
        return intersection.size / union.size;
    }
    /**
     * Check if two insights are semantically similar
     */
    static areSimilar(insight1, insight2) {
        // Same category and type is a strong similarity indicator
        if (insight1.category === insight2.category && insight1.type === insight2.type) {
            const textSimilarity = this.calculateTextSimilarity(insight1.title + ' ' + insight1.description, insight2.title + ' ' + insight2.description);
            if (textSimilarity >= this.SIMILARITY_THRESHOLD) {
                return true;
            }
        }
        // Check for very similar titles (often indicates duplicate insights)
        const titleSimilarity = this.calculateTextSimilarity(insight1.title, insight2.title);
        if (titleSimilarity >= 0.8) {
            return true;
        }
        return false;
    }
    /**
     * Deduplicate insights, keeping the highest quality version
     */
    static deduplicateInsights(scoredInsights) {
        const duplicateGroups = [];
        const processed = new Set();
        const uniqueInsights = [];
        for (const insight of scoredInsights) {
            if (processed.has(insight.id))
                continue;
            // Find all similar insights
            const similarInsights = scoredInsights.filter(other => other.id !== insight.id && !processed.has(other.id) && this.areSimilar(insight, other));
            if (similarInsights.length > 0) {
                // Group includes current insight + similar ones
                const group = [insight, ...similarInsights];
                // Sort by quality score to find the best version
                group.sort((a, b) => b.qualityScore.overall - a.qualityScore.overall);
                const primary = group[0];
                const duplicates = group.slice(1);
                // Mark primary with similar IDs
                primary.similarTo = duplicates.map(d => d.id);
                duplicateGroups.push({ primary, duplicates });
                uniqueInsights.push(primary);
                // Mark all in group as processed
                group.forEach(i => processed.add(i.id));
            }
            else {
                // No duplicates, add as unique
                uniqueInsights.push(insight);
                processed.add(insight.id);
            }
        }
        logger_1.logger.info(`✨ Deduplication: ${scoredInsights.length} insights → ${uniqueInsights.length} unique (removed ${scoredInsights.length - uniqueInsights.length} duplicates)`, { component: 'insightQualityService', operation: 'deduplicateInsights' });
        return { uniqueInsights, duplicateGroups };
    }
    /**
     * Rank insights by overall quality score
     */
    static rankInsights(scoredInsights) {
        return [...scoredInsights].sort((a, b) => {
            // Primary sort by overall score
            const scoreDiff = b.qualityScore.overall - a.qualityScore.overall;
            if (Math.abs(scoreDiff) > 0.05)
                return scoreDiff;
            // Secondary sort by impact
            const impactDiff = b.qualityScore.impact - a.qualityScore.impact;
            if (Math.abs(impactDiff) > 0.05)
                return impactDiff;
            // Tertiary sort by actionability
            return b.qualityScore.actionability - a.qualityScore.actionability;
        });
    }
    /**
     * Full quality pipeline: validate → score → filter → deduplicate → rank
     */
    static processInsights(insights, context) {
        logger_1.logger.info(`🔍 Processing ${insights.length} raw insights through quality pipeline`, {
            component: 'insightQualityService',
            operation: 'processInsights',
        });
        // Step 1: Validate
        const validatedInsights = insights.filter(insight => {
            const validation = this.validateInsight(insight);
            if (!validation.valid) {
                logger_1.logger.warn(`⚠️ Invalid insight rejected: ${validation.reasons.join(', ')}`, {
                    component: 'insightQualityService',
                    operation: 'validate',
                    metadata: { insight: insight.title },
                });
            }
            return validation.valid;
        });
        logger_1.logger.info(`✅ Validation: ${validatedInsights.length}/${insights.length} valid`, {
            component: 'insightQualityService',
            operation: 'validate',
        });
        // Step 2: Score
        const scoredInsights = this.scoreInsights(validatedInsights, context);
        // Step 3: Filter by quality
        const minimumQuality = context?.minimumQuality || this.QUALITY_THRESHOLDS.minimum;
        const qualityInsights = this.filterByQuality(scoredInsights, minimumQuality);
        logger_1.logger.info(`✅ Quality filter: ${qualityInsights.length}/${scoredInsights.length} meet threshold (${minimumQuality})`, { component: 'insightQualityService', operation: 'filter' });
        // Step 4: Deduplicate
        const { uniqueInsights } = this.deduplicateInsights(qualityInsights);
        // Step 5: Rank
        const rankedInsights = this.rankInsights(uniqueInsights);
        logger_1.logger.info(`✨ Final output: ${rankedInsights.length} high-quality, unique insights`, {
            component: 'insightQualityService',
            operation: 'complete',
            metadata: {
                avgScore: (rankedInsights.reduce((sum, i) => sum + i.qualityScore.overall, 0) /
                    rankedInsights.length).toFixed(2),
            },
        });
        return rankedInsights;
    }
    /**
     * Get quality tier label for UI
     */
    static getQualityTier(score) {
        if (score >= this.QUALITY_THRESHOLDS.excellent)
            return 'excellent';
        if (score >= this.QUALITY_THRESHOLDS.good)
            return 'good';
        if (score >= this.QUALITY_THRESHOLDS.minimum)
            return 'fair';
        return 'poor';
    }
    /**
     * Generate quality report for debugging/monitoring
     */
    static generateQualityReport(scoredInsights) {
        const tierCounts = { excellent: 0, good: 0, fair: 0, poor: 0 };
        scoredInsights.forEach(insight => {
            const tier = this.getQualityTier(insight.qualityScore.overall);
            tierCounts[tier]++;
        });
        const avgScores = {
            relevance: 0,
            actionability: 0,
            novelty: 0,
            impact: 0,
            confidence: 0,
            overall: 0,
        };
        if (scoredInsights.length > 0) {
            scoredInsights.forEach(insight => {
                avgScores.relevance += insight.qualityScore.relevance;
                avgScores.actionability += insight.qualityScore.actionability;
                avgScores.novelty += insight.qualityScore.novelty;
                avgScores.impact += insight.qualityScore.impact;
                avgScores.confidence += insight.qualityScore.confidence;
                avgScores.overall += insight.qualityScore.overall;
            });
            Object.keys(avgScores).forEach(key => {
                avgScores[key] /= scoredInsights.length;
            });
        }
        const sorted = this.rankInsights(scoredInsights);
        return {
            total: scoredInsights.length,
            byTier: tierCounts,
            avgScores,
            topInsights: sorted.slice(0, 5),
            lowQualityInsights: sorted.slice(-3),
        };
    }
}
exports.InsightQualityService = InsightQualityService;
InsightQualityService.QUALITY_THRESHOLDS = {
    minimum: 0.4, // Below this, insight is filtered out
    good: 0.6,
    excellent: 0.8,
};
InsightQualityService.SIMILARITY_THRESHOLD = 0.75; // For deduplication
exports.default = InsightQualityService;
