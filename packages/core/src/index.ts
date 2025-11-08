/// <reference path="./types/electron.d.ts" />

export * from './types';
export * from './utils';
export * from './validation';
export * from './database/DatabaseManager';
// Export secure session manager for secure password handling
export { secureSessionManager } from './utils/secureSessionManager';
export * from './hooks/useKeyboardShortcuts';
export * from './hooks/useDragDrop';
export * from './services/googleCalendarService';
export * from './services/githubService';
export * from './services/integrationSyncService';
// Export only the service class, not the EncryptedIntegrationData type
// (EncryptedIntegrationData is exported from ./types/ipc)
export { EncryptedIntegrationService } from './services/encryptedIntegrationService';
// biometricAuthService is only used dynamically to avoid bundle conflicts
export * from './services/aiAssistantService';
export { AICredentialService, type AIProviderCredential, type AIProviderCredentialInput } from './services/aiCredentialService';
// Re-export preprocessing service but avoid duplicate exports
export { AIPreprocessingService, PreprocessingConfig } from './services/aiPreprocessingService';
export * from './services/promptEngineeringService';
export * from './services/insightQualityService';
export * from './services/userProfileService';
// Export visualizationService but avoid duplicating KPIMetrics and TimeRange from insightsSlice
export { VisualizationService } from './services/visualizationService';
export * from './services/actionabilityService';
export * from './services/feedbackService';
export { ThemeTrackingService } from './services/themeTrackingService';
export { AISummarizationService } from './services/aiSummarizationService';
// Export secure storage functions
export { 
  savePostgreSQLConfigSecure,
  getPostgreSQLConfigSecure,
  removePostgreSQLConfigSecure
} from './utils/secureStorage';
// Export password migration functions
export { 
  needsPasswordMigration,
  migratePasswordHash 
} from './utils/privacy';
// Use enhanced store with proper persistence but also export all slice functionality
export { store, initializeStoreData, getDatabaseStats, checkSQLiteAvailability } from './store/enhancedStore';
export type { RootState, AppDispatch } from './store/enhancedStore';
// Export all store functionality
export * from './store';
// Persistence DI for server-centric web apps
export * from './persistence/PersistenceClient';
export { WebApiPersistenceClient } from './persistence/WebApiPersistenceClient';
// Explicit selector re-exports used by UI package
export { selectCompactMode } from './store/slices/uiSlice';
// Export journal templates
export * from './journal/templates';
