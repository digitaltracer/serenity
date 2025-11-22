// Use enhanced store with proper persistence - export through store.ts for consistency
export { store, type RootState, type AppDispatch, initializeStoreData } from './store';
export { initializeSQLitePersistence } from './middleware/simplifiedPersistenceMiddleware';
export * from './slices/tasksSlice';
export * from './slices/projectsSlice';
export * from './slices/journalSlice';
export * from './slices/userSlice';
export * from './slices/uiSlice';
export * from './slices/tagsSlice';
export * from './slices/authSlice';
export * from './slices/databaseSlice';
export { initializeDatabaseConfig } from './slices/databaseSlice';
export * from './slices/shortcutsSlice';
export * from './slices/searchSlice';
export * from './slices/dragDropSlice';
export * from './slices/integrationsSlice';
export { initializeIntegrations } from './slices/integrationsSlice';
// Export AI assistant slice items except AIInsight and AIRecap (exported from types/ipc)
export type { AIProvider, AnalysisTracker, AIUsageEntry, AIAssistantState } from './slices/aiAssistantSlice';
export {
  // Async thunks
  setApiKey,
  testApiKey,
  initializeAISettings,
  analyzeUserData,
  generateRecap,
  // Credential management thunks
  fetchCredentials,
  addCredential,
  updateCredential,
  deleteCredential,
  testCredential,
  reorderCredentials,
  // Actions
  setActiveProvider,
  clearActiveProvider,
  setAutoAnalyze,
  setAnalysisFrequency,
  setDataTypes,
  addInsight,
  removeInsight,
  clearInsights,
  restoreInsights,
  addRecap,
  removeRecap,
  restoreRecaps,
  updateAnalysisTracker,
  clearAIError,
  clearAllErrors,
  updateProvidersWithModelInfo,
  updateProvidersWithApiKeys,
  clearProviderModelInfo,
  recordUsage,
  clearUsage,
  restoreUsage,
  // Selectors
  selectAIProviders,
  selectActiveProvider,
  selectIsAnalyzing,
  selectAnalysisProgress,
  selectAnalysisStatus,
  selectLastAnalysis,
  selectAIInsights,
  selectAIRecaps,
  selectAnalysisTracker,
  selectAIConfiguration,
  selectAIErrors,
  selectLastAIError,
  selectAIUsage,
  // Credential selectors
  selectCredentials,
  selectIsLoadingCredentials,
  selectCredentialError,
  selectEnabledCredentials,
  selectCredentialsByProvider,
} from './slices/aiAssistantSlice';
export { default as aiAssistantReducer } from './slices/aiAssistantSlice';
// Export insights slice
export type {
  AIInsightEnhanced,
  AIRecapEnhanced,
  KPIMetrics,
  TimeRange,
  InsightsFilters,
  RecapsFilters,
  InsightsState
} from './slices/insightsSlice';
export {
  // Async thunks
  fetchDashboardData,
  fetchInsights,
  dismissInsight,
  rateInsight,
  markInsightHelpful,
  addInsightNote,
  fetchRecaps,
  toggleRecapFavorite,
  markRecapViewed,
  fetchKPIMetrics,
  // Actions
  setTimeRange,
  setTimeRangePreset,
  setInsightsFilters,
  setRecapsFilters,
  clearKPIs,
  restoreKPIs,
  // Selectors
  selectKPIs,
  selectInsights,
  selectRecaps,
  selectTimeRange,
  selectInsightsFilters,
  selectRecapsFilters,
  selectIsLoadingDashboard,
  selectIsLoadingInsights,
  selectIsLoadingRecaps,
  selectIsLoadingKPIs,
  selectLastRefresh,
  selectInsightsErrors,
  selectLastInsightsError,
  selectNonDismissedInsights,
  selectInsightsByCategory,
  selectFavoritedRecaps,
  selectRecapsByType,
} from './slices/insightsSlice';
export { default as insightsReducer } from './slices/insightsSlice';
export * from './slices/goalsSlice';
// Export summaries slice
export type { Summary, SummariesState } from './slices/summariesSlice';
export {
  // Async thunks
  generateSummary,
  fetchSummaries,
  deleteSummary,
  exportSummary,
  // Sync actions (for web API integration)
  setSummaries,
  addSummary,
  removeSummary,
  setSummariesLoading,
  setSummariesGenerating,
  setSummariesError,
  // Actions
  setFilter,
  setGenerationProgress,
  clearError,
  // Selectors
  selectSummaries,
  selectSummariesLoading,
  selectSummariesGenerating,
  selectSummariesError,
  selectSummariesFilters,
  selectGenerationProgress,
  selectFilteredSummaries,
} from './slices/summariesSlice';
export { default as summariesReducer } from './slices/summariesSlice';
export * from './slices/sampleData';