/**
 * Insights Module
 * Exports all insight-related components
 */

export { InsightCard, type AIInsight, type InsightCardProps } from './InsightCard';
export { InsightCategoryBadge, type InsightCategoryBadgeProps } from './InsightCategoryBadge';
export { InsightActionsMenu, type InsightActionsMenuProps } from './InsightActionsMenu';
export { ActionabilitySuggestions, type ActionabilitySuggestionsProps, type ActionabilitySuggestion } from './ActionabilitySuggestions';
export { InsightCategoryHeader, type InsightCategoryHeaderProps, type SortOption } from './InsightCategoryHeader';
export { InsightsEmptyState, type InsightsEmptyStateProps, type EmptyStateType, type ProgressItem } from './InsightsEmptyState';
export { VisualizationTabs, type VisualizationTabsProps, type VisualizationData, type VisualizationTab } from './VisualizationTabs';
// Individual chart components
export { OverviewChart, type OverviewChartProps, type OverviewDataPoint } from './charts/OverviewChart';
export { ProductivityChart, type ProductivityChartProps, type ProductivityDataPoint } from './charts/ProductivityChart';
export { WellbeingChart, type WellbeingChartProps, type WellbeingDataPoint } from './charts/WellbeingChart';
export { HabitsHeatmap, type HabitsHeatmapProps, type HabitsDataPoint } from './charts/HabitsHeatmap';
// Re-export InsightCategory from InsightCategoryHeader as the canonical source
export type { InsightCategory } from './InsightCategoryHeader';
