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
import { AIInsight } from '../types';
/**
 * Result of theme extraction from an insight
 */
export interface ThemeExtractionResult {
    /** Name of the identified theme (e.g., 'procrastination', 'burnout') */
    themeName: string;
    /** Confidence score (0-1) from the original insight */
    confidence: number;
}
/**
 * Service for extracting and tracking themes from AI insights.
 *
 * Provides static methods for theme extraction using predefined patterns.
 * Supports 12 common productivity/wellness themes with regex matching.
 */
export declare class ThemeTrackingService {
    /**
     * Theme patterns for keyword-based extraction
     * Maps theme names to regex patterns
     */
    private static readonly THEME_PATTERNS;
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
    static extractTheme(insight: AIInsight): ThemeExtractionResult | null;
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
    static extractThemes(insights: AIInsight[]): Map<string, ThemeExtractionResult[]>;
}
