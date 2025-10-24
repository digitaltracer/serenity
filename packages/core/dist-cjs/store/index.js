"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addInsightNote = exports.markInsightHelpful = exports.rateInsight = exports.dismissInsight = exports.fetchInsights = exports.fetchDashboardData = exports.aiAssistantReducer = exports.selectAIUsage = exports.selectLastAIError = exports.selectAIErrors = exports.selectAIConfiguration = exports.selectAnalysisTracker = exports.selectAIRecaps = exports.selectAIInsights = exports.selectLastAnalysis = exports.selectAnalysisStatus = exports.selectAnalysisProgress = exports.selectIsAnalyzing = exports.selectActiveProvider = exports.selectAIProviders = exports.restoreUsage = exports.clearUsage = exports.recordUsage = exports.clearProviderModelInfo = exports.updateProvidersWithApiKeys = exports.updateProvidersWithModelInfo = exports.clearAllErrors = exports.clearAIError = exports.updateAnalysisTracker = exports.restoreRecaps = exports.removeRecap = exports.addRecap = exports.restoreInsights = exports.clearInsights = exports.removeInsight = exports.addInsight = exports.setDataTypes = exports.setAnalysisFrequency = exports.setAutoAnalyze = exports.clearActiveProvider = exports.setActiveProvider = exports.generateRecap = exports.analyzeUserData = exports.testApiKey = exports.setApiKey = exports.initializeIntegrations = exports.initializeDatabaseConfig = exports.initializeSQLitePersistence = exports.initializeStoreData = exports.store = void 0;
exports.insightsReducer = exports.selectRecapsByType = exports.selectFavoritedRecaps = exports.selectInsightsByCategory = exports.selectNonDismissedInsights = exports.selectLastInsightsError = exports.selectInsightsErrors = exports.selectLastRefresh = exports.selectIsLoadingKPIs = exports.selectIsLoadingRecaps = exports.selectIsLoadingInsights = exports.selectIsLoadingDashboard = exports.selectRecapsFilters = exports.selectInsightsFilters = exports.selectTimeRange = exports.selectRecaps = exports.selectInsights = exports.selectKPIs = exports.restoreKPIs = exports.clearKPIs = exports.setRecapsFilters = exports.setInsightsFilters = exports.setTimeRangePreset = exports.setTimeRange = exports.fetchKPIMetrics = exports.markRecapViewed = exports.toggleRecapFavorite = exports.fetchRecaps = void 0;
// Use enhanced store with proper persistence - export through store.ts for consistency
var store_1 = require("./store");
Object.defineProperty(exports, "store", { enumerable: true, get: function () { return store_1.store; } });
Object.defineProperty(exports, "initializeStoreData", { enumerable: true, get: function () { return store_1.initializeStoreData; } });
var simplifiedPersistenceMiddleware_1 = require("./middleware/simplifiedPersistenceMiddleware");
Object.defineProperty(exports, "initializeSQLitePersistence", { enumerable: true, get: function () { return simplifiedPersistenceMiddleware_1.initializeSQLitePersistence; } });
__exportStar(require("./slices/tasksSlice"), exports);
__exportStar(require("./slices/projectsSlice"), exports);
__exportStar(require("./slices/journalSlice"), exports);
__exportStar(require("./slices/userSlice"), exports);
__exportStar(require("./slices/uiSlice"), exports);
__exportStar(require("./slices/tagsSlice"), exports);
__exportStar(require("./slices/authSlice"), exports);
__exportStar(require("./slices/databaseSlice"), exports);
var databaseSlice_1 = require("./slices/databaseSlice");
Object.defineProperty(exports, "initializeDatabaseConfig", { enumerable: true, get: function () { return databaseSlice_1.initializeDatabaseConfig; } });
__exportStar(require("./slices/shortcutsSlice"), exports);
__exportStar(require("./slices/searchSlice"), exports);
__exportStar(require("./slices/dragDropSlice"), exports);
__exportStar(require("./slices/integrationsSlice"), exports);
var integrationsSlice_1 = require("./slices/integrationsSlice");
Object.defineProperty(exports, "initializeIntegrations", { enumerable: true, get: function () { return integrationsSlice_1.initializeIntegrations; } });
var aiAssistantSlice_1 = require("./slices/aiAssistantSlice");
// Async thunks
Object.defineProperty(exports, "setApiKey", { enumerable: true, get: function () { return aiAssistantSlice_1.setApiKey; } });
Object.defineProperty(exports, "testApiKey", { enumerable: true, get: function () { return aiAssistantSlice_1.testApiKey; } });
Object.defineProperty(exports, "analyzeUserData", { enumerable: true, get: function () { return aiAssistantSlice_1.analyzeUserData; } });
Object.defineProperty(exports, "generateRecap", { enumerable: true, get: function () { return aiAssistantSlice_1.generateRecap; } });
// Actions
Object.defineProperty(exports, "setActiveProvider", { enumerable: true, get: function () { return aiAssistantSlice_1.setActiveProvider; } });
Object.defineProperty(exports, "clearActiveProvider", { enumerable: true, get: function () { return aiAssistantSlice_1.clearActiveProvider; } });
Object.defineProperty(exports, "setAutoAnalyze", { enumerable: true, get: function () { return aiAssistantSlice_1.setAutoAnalyze; } });
Object.defineProperty(exports, "setAnalysisFrequency", { enumerable: true, get: function () { return aiAssistantSlice_1.setAnalysisFrequency; } });
Object.defineProperty(exports, "setDataTypes", { enumerable: true, get: function () { return aiAssistantSlice_1.setDataTypes; } });
Object.defineProperty(exports, "addInsight", { enumerable: true, get: function () { return aiAssistantSlice_1.addInsight; } });
Object.defineProperty(exports, "removeInsight", { enumerable: true, get: function () { return aiAssistantSlice_1.removeInsight; } });
Object.defineProperty(exports, "clearInsights", { enumerable: true, get: function () { return aiAssistantSlice_1.clearInsights; } });
Object.defineProperty(exports, "restoreInsights", { enumerable: true, get: function () { return aiAssistantSlice_1.restoreInsights; } });
Object.defineProperty(exports, "addRecap", { enumerable: true, get: function () { return aiAssistantSlice_1.addRecap; } });
Object.defineProperty(exports, "removeRecap", { enumerable: true, get: function () { return aiAssistantSlice_1.removeRecap; } });
Object.defineProperty(exports, "restoreRecaps", { enumerable: true, get: function () { return aiAssistantSlice_1.restoreRecaps; } });
Object.defineProperty(exports, "updateAnalysisTracker", { enumerable: true, get: function () { return aiAssistantSlice_1.updateAnalysisTracker; } });
Object.defineProperty(exports, "clearAIError", { enumerable: true, get: function () { return aiAssistantSlice_1.clearAIError; } });
Object.defineProperty(exports, "clearAllErrors", { enumerable: true, get: function () { return aiAssistantSlice_1.clearAllErrors; } });
Object.defineProperty(exports, "updateProvidersWithModelInfo", { enumerable: true, get: function () { return aiAssistantSlice_1.updateProvidersWithModelInfo; } });
Object.defineProperty(exports, "updateProvidersWithApiKeys", { enumerable: true, get: function () { return aiAssistantSlice_1.updateProvidersWithApiKeys; } });
Object.defineProperty(exports, "clearProviderModelInfo", { enumerable: true, get: function () { return aiAssistantSlice_1.clearProviderModelInfo; } });
Object.defineProperty(exports, "recordUsage", { enumerable: true, get: function () { return aiAssistantSlice_1.recordUsage; } });
Object.defineProperty(exports, "clearUsage", { enumerable: true, get: function () { return aiAssistantSlice_1.clearUsage; } });
Object.defineProperty(exports, "restoreUsage", { enumerable: true, get: function () { return aiAssistantSlice_1.restoreUsage; } });
// Selectors
Object.defineProperty(exports, "selectAIProviders", { enumerable: true, get: function () { return aiAssistantSlice_1.selectAIProviders; } });
Object.defineProperty(exports, "selectActiveProvider", { enumerable: true, get: function () { return aiAssistantSlice_1.selectActiveProvider; } });
Object.defineProperty(exports, "selectIsAnalyzing", { enumerable: true, get: function () { return aiAssistantSlice_1.selectIsAnalyzing; } });
Object.defineProperty(exports, "selectAnalysisProgress", { enumerable: true, get: function () { return aiAssistantSlice_1.selectAnalysisProgress; } });
Object.defineProperty(exports, "selectAnalysisStatus", { enumerable: true, get: function () { return aiAssistantSlice_1.selectAnalysisStatus; } });
Object.defineProperty(exports, "selectLastAnalysis", { enumerable: true, get: function () { return aiAssistantSlice_1.selectLastAnalysis; } });
Object.defineProperty(exports, "selectAIInsights", { enumerable: true, get: function () { return aiAssistantSlice_1.selectAIInsights; } });
Object.defineProperty(exports, "selectAIRecaps", { enumerable: true, get: function () { return aiAssistantSlice_1.selectAIRecaps; } });
Object.defineProperty(exports, "selectAnalysisTracker", { enumerable: true, get: function () { return aiAssistantSlice_1.selectAnalysisTracker; } });
Object.defineProperty(exports, "selectAIConfiguration", { enumerable: true, get: function () { return aiAssistantSlice_1.selectAIConfiguration; } });
Object.defineProperty(exports, "selectAIErrors", { enumerable: true, get: function () { return aiAssistantSlice_1.selectAIErrors; } });
Object.defineProperty(exports, "selectLastAIError", { enumerable: true, get: function () { return aiAssistantSlice_1.selectLastAIError; } });
Object.defineProperty(exports, "selectAIUsage", { enumerable: true, get: function () { return aiAssistantSlice_1.selectAIUsage; } });
var aiAssistantSlice_2 = require("./slices/aiAssistantSlice");
Object.defineProperty(exports, "aiAssistantReducer", { enumerable: true, get: function () { return __importDefault(aiAssistantSlice_2).default; } });
var insightsSlice_1 = require("./slices/insightsSlice");
// Async thunks
Object.defineProperty(exports, "fetchDashboardData", { enumerable: true, get: function () { return insightsSlice_1.fetchDashboardData; } });
Object.defineProperty(exports, "fetchInsights", { enumerable: true, get: function () { return insightsSlice_1.fetchInsights; } });
Object.defineProperty(exports, "dismissInsight", { enumerable: true, get: function () { return insightsSlice_1.dismissInsight; } });
Object.defineProperty(exports, "rateInsight", { enumerable: true, get: function () { return insightsSlice_1.rateInsight; } });
Object.defineProperty(exports, "markInsightHelpful", { enumerable: true, get: function () { return insightsSlice_1.markInsightHelpful; } });
Object.defineProperty(exports, "addInsightNote", { enumerable: true, get: function () { return insightsSlice_1.addInsightNote; } });
Object.defineProperty(exports, "fetchRecaps", { enumerable: true, get: function () { return insightsSlice_1.fetchRecaps; } });
Object.defineProperty(exports, "toggleRecapFavorite", { enumerable: true, get: function () { return insightsSlice_1.toggleRecapFavorite; } });
Object.defineProperty(exports, "markRecapViewed", { enumerable: true, get: function () { return insightsSlice_1.markRecapViewed; } });
Object.defineProperty(exports, "fetchKPIMetrics", { enumerable: true, get: function () { return insightsSlice_1.fetchKPIMetrics; } });
// Actions
Object.defineProperty(exports, "setTimeRange", { enumerable: true, get: function () { return insightsSlice_1.setTimeRange; } });
Object.defineProperty(exports, "setTimeRangePreset", { enumerable: true, get: function () { return insightsSlice_1.setTimeRangePreset; } });
Object.defineProperty(exports, "setInsightsFilters", { enumerable: true, get: function () { return insightsSlice_1.setInsightsFilters; } });
Object.defineProperty(exports, "setRecapsFilters", { enumerable: true, get: function () { return insightsSlice_1.setRecapsFilters; } });
Object.defineProperty(exports, "clearKPIs", { enumerable: true, get: function () { return insightsSlice_1.clearKPIs; } });
Object.defineProperty(exports, "restoreKPIs", { enumerable: true, get: function () { return insightsSlice_1.restoreKPIs; } });
// Selectors
Object.defineProperty(exports, "selectKPIs", { enumerable: true, get: function () { return insightsSlice_1.selectKPIs; } });
Object.defineProperty(exports, "selectInsights", { enumerable: true, get: function () { return insightsSlice_1.selectInsights; } });
Object.defineProperty(exports, "selectRecaps", { enumerable: true, get: function () { return insightsSlice_1.selectRecaps; } });
Object.defineProperty(exports, "selectTimeRange", { enumerable: true, get: function () { return insightsSlice_1.selectTimeRange; } });
Object.defineProperty(exports, "selectInsightsFilters", { enumerable: true, get: function () { return insightsSlice_1.selectInsightsFilters; } });
Object.defineProperty(exports, "selectRecapsFilters", { enumerable: true, get: function () { return insightsSlice_1.selectRecapsFilters; } });
Object.defineProperty(exports, "selectIsLoadingDashboard", { enumerable: true, get: function () { return insightsSlice_1.selectIsLoadingDashboard; } });
Object.defineProperty(exports, "selectIsLoadingInsights", { enumerable: true, get: function () { return insightsSlice_1.selectIsLoadingInsights; } });
Object.defineProperty(exports, "selectIsLoadingRecaps", { enumerable: true, get: function () { return insightsSlice_1.selectIsLoadingRecaps; } });
Object.defineProperty(exports, "selectIsLoadingKPIs", { enumerable: true, get: function () { return insightsSlice_1.selectIsLoadingKPIs; } });
Object.defineProperty(exports, "selectLastRefresh", { enumerable: true, get: function () { return insightsSlice_1.selectLastRefresh; } });
Object.defineProperty(exports, "selectInsightsErrors", { enumerable: true, get: function () { return insightsSlice_1.selectInsightsErrors; } });
Object.defineProperty(exports, "selectLastInsightsError", { enumerable: true, get: function () { return insightsSlice_1.selectLastInsightsError; } });
Object.defineProperty(exports, "selectNonDismissedInsights", { enumerable: true, get: function () { return insightsSlice_1.selectNonDismissedInsights; } });
Object.defineProperty(exports, "selectInsightsByCategory", { enumerable: true, get: function () { return insightsSlice_1.selectInsightsByCategory; } });
Object.defineProperty(exports, "selectFavoritedRecaps", { enumerable: true, get: function () { return insightsSlice_1.selectFavoritedRecaps; } });
Object.defineProperty(exports, "selectRecapsByType", { enumerable: true, get: function () { return insightsSlice_1.selectRecapsByType; } });
var insightsSlice_2 = require("./slices/insightsSlice");
Object.defineProperty(exports, "insightsReducer", { enumerable: true, get: function () { return __importDefault(insightsSlice_2).default; } });
__exportStar(require("./slices/goalsSlice"), exports);
__exportStar(require("./slices/sampleData"), exports);
