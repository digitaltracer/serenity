"use strict";
/**
 * Theme Tracking Service
 *
 * Extracts themes from AI insights and tracks recurring patterns over time.
 * Uses regex-based pattern matching to identify 12 predefined themes from insight text.
 *
 * @module ThemeTrackingService
 * @category AI Services
 *
 * @example
 * ```typescript
 * import { ThemeTrackingService } from '@serenity/core';
 *
 * // Extract theme from an insight
 * const theme = ThemeTrackingService.extractTheme(insight);
 * if (theme) {
 *   console.log(`Theme: ${theme.themeName}, Confidence: ${theme.confidence}`);
 * }
 *
 * // Extract themes from multiple insights
 * const themeMap = ThemeTrackingService.extractThemes(insights);
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeTrackingService = void 0;
const logger_1 = require("../utils/logger");
/**
 * Service for extracting and tracking themes from AI insights.
 *
 * Provides static methods for theme extraction using predefined patterns.
 * Supports 12 common productivity/wellness themes with regex matching.
 */
class ThemeTrackingService {
    /**
     * Extract theme from a single insight using pattern matching.
     *
     * Searches the insight's title and description against predefined theme patterns.
     * Returns the first matching theme or a generic fallback theme.
     *
     * @param insight - The AI insight to extract theme from
     * @returns Theme extraction result with name and confidence, or null if no theme found
     *
     * @example
     * ```typescript
     * const insight = {
     *   title: 'Procrastination Pattern Detected',
     *   description: 'You have been delaying tasks...',
     *   confidence: 0.85
     * };
     *
     * const theme = ThemeTrackingService.extractTheme(insight);
     * // Returns: { themeName: 'procrastination', confidence: 0.85 }
     * ```
     */
    static extractTheme(insight) {
        const searchText = `${insight.title} ${insight.description}`;
        // Try to match against known patterns
        for (const [themeName, pattern] of Object.entries(this.THEME_PATTERNS)) {
            if (pattern.test(searchText)) {
                logger_1.logger.debug(`🏷️  Extracted theme: ${themeName} from insight: ${insight.title}`, {
                    component: 'themeTrackingService',
                    operation: 'extractedTheme'
                });
                return {
                    themeName,
                    confidence: insight.confidence
                };
            }
        }
        // Fallback: use category + type as generic theme
        const genericTheme = `${insight.category}_${insight.type}`;
        logger_1.logger.debug(`🏷️  Using generic theme: ${genericTheme} for insight: ${insight.title}`, {
            component: 'themeTrackingService',
            operation: 'genericTheme'
        });
        return {
            themeName: genericTheme,
            confidence: insight.confidence
        };
    }
    /**
     * Extract themes from multiple insights and group by theme name.
     *
     * Processes an array of insights and returns a map of theme names to their extraction results.
     * Useful for analyzing theme frequency and patterns across multiple insights.
     *
     * @param insights - Array of AI insights to process
     * @returns Map of theme names to arrays of extraction results
     *
     * @example
     * ```typescript
     * const insights = [
     *   { title: 'Procrastination detected', confidence: 0.8 },
     *   { title: 'Burnout warning', confidence: 0.9 },
     *   { title: 'Delaying tasks again', confidence: 0.75 }
     * ];
     *
     * const themeMap = ThemeTrackingService.extractThemes(insights);
     * // Returns:
     * // Map {
     * //   'procrastination' => [
     * //     { themeName: 'procrastination', confidence: 0.8 },
     * //     { themeName: 'procrastination', confidence: 0.75 }
     * //   ],
     * //   'burnout' => [
     * //     { themeName: 'burnout', confidence: 0.9 }
     * //   ]
     * // }
     * ```
     */
    static extractThemes(insights) {
        const themeMap = new Map();
        for (const insight of insights) {
            const theme = this.extractTheme(insight);
            if (theme) {
                const existing = themeMap.get(theme.themeName) || [];
                existing.push(theme);
                themeMap.set(theme.themeName, existing);
            }
        }
        logger_1.logger.info(`✅ Extracted ${themeMap.size} unique themes from ${insights.length} insights`, {
            component: 'themeTrackingService',
            operation: 'extractedMultipleThemes',
            metadata: {
                uniqueThemes: themeMap.size,
                totalInsights: insights.length
            }
        });
        return themeMap;
    }
}
exports.ThemeTrackingService = ThemeTrackingService;
/**
 * Theme patterns for keyword-based extraction
 * Maps theme names to regex patterns
 */
ThemeTrackingService.THEME_PATTERNS = {
    procrastination: /procrastinat|delay|putting\s+off|avoid.*task/i,
    context_switching: /context.?switch|multitask|distract|interrupt/i,
    burnout: /burnout|overwhelm|exhaust|stress.*high/i,
    focus_issues: /focus|concentrat|attention.*span/i,
    time_management: /time.*manag|deadline|schedule|late/i,
    overload: /overload|too\s+much|capacity|many.*tasks/i,
    progress: /progress|achiev|complet.*goal/i,
    productivity_drop: /productiv.*decreas|slow.*down|fewer.*task/i,
    mood_issues: /mood|anxious|depress|sad/i,
    work_life_balance: /balance|work.*life|personal.*time/i,
    goal_alignment: /goal|align|purpose|direction/i,
    habit_formation: /habit|routine|consistent/i,
};
