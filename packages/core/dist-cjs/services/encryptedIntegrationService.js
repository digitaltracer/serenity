"use strict";
/**
 * Encrypted Integration Service
 * Handles encryption and database storage of integration tokens
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptedIntegrationService = void 0;
const encryption_1 = require("../utils/encryption");
const logger_1 = require("../utils/logger");
/**
 * Service for managing encrypted integration data storage
 */
class EncryptedIntegrationService {
    /**
     * Encrypt and store integration tokens in database
     */
    static async saveEncryptedIntegrations(integrationsState, masterPassword) {
        try {
            logger_1.logger.info('🔐 Starting integration token encryption process...', { component: 'encryptedIntegrationService', operation: 'startingIntegrationToken' });
            logger_1.logger.info('📊 Integration state received', {
                component: 'encryptedIntegrationService',
                operation: 'integrationStateReceived',
                metadata: {
                    googleCalendarConnected: integrationsState.googleCalendar.connected,
                    githubConnected: integrationsState.github.connected,
                    hasGoogleToken: !!integrationsState.googleCalendar.accessToken,
                    hasGithubTokens: integrationsState.github.tokens?.length || 0,
                    masterPasswordLength: masterPassword?.length || 0
                }
            });
            const encryptedData = [];
            // Encrypt Google Calendar tokens if connected
            if (integrationsState.googleCalendar.connected && integrationsState.googleCalendar.accessToken) {
                logger_1.logger.info('📅 Processing Google Calendar integration for encryption...', { component: 'encryptedIntegrationService', operation: 'processingGoogleCalendar' });
                const googleData = {
                    accessToken: integrationsState.googleCalendar.accessToken,
                    refreshToken: integrationsState.googleCalendar.refreshToken,
                    expiresAt: integrationsState.googleCalendar.expiresAt,
                    userEmail: integrationsState.googleCalendar.userEmail,
                    clientId: integrationsState.googleCalendar.clientId,
                    clientSecret: integrationsState.googleCalendar.clientSecret,
                    syncEnabled: integrationsState.googleCalendar.syncEnabled,
                    lastSync: integrationsState.googleCalendar.lastSync,
                };
                logger_1.logger.info('🔒 Encrypting Google Calendar data...', { component: 'encryptedIntegrationService', operation: 'encryptingGoogleCalendar' });
                const encryptedGoogleData = await encryption_1.EncryptionService.encrypt(JSON.stringify(googleData), masterPassword, 'restricted' // Highest security level for integration tokens
                );
                encryptedData.push({
                    id: 'google_calendar',
                    type: 'google_calendar',
                    encrypted_data: JSON.stringify(encryptedGoogleData),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });
                logger_1.logger.info('✅ Google Calendar data encrypted successfully', { component: 'encryptedIntegrationService', operation: 'googleCalendarData' });
            }
            else {
                logger_1.logger.info('ℹ️ Skipping Google Calendar - not connected or no access token', { component: 'encryptedIntegrationService', operation: 'skippingGoogleCalendar' });
            }
            // Encrypt GitHub tokens if connected
            if (integrationsState.github.connected && integrationsState.github.tokens && integrationsState.github.tokens.length > 0) {
                logger_1.logger.info('🐙 Processing GitHub integration for encryption...', { component: 'encryptedIntegrationService', operation: 'processingGithubIntegration' });
                const githubData = {
                    tokens: integrationsState.github.tokens,
                    syncEnabled: integrationsState.github.syncEnabled,
                    lastSync: integrationsState.github.lastSync,
                    totalRepositories: integrationsState.github.totalRepositories,
                };
                logger_1.logger.info('🔒 Encrypting GitHub data...', { component: 'encryptedIntegrationService', operation: 'encryptingGithubData...' });
                const encryptedGithubData = await encryption_1.EncryptionService.encrypt(JSON.stringify(githubData), masterPassword, 'restricted' // Highest security level for integration tokens
                );
                encryptedData.push({
                    id: 'github',
                    type: 'github',
                    encrypted_data: JSON.stringify(encryptedGithubData),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });
                logger_1.logger.info('✅ GitHub data encrypted successfully', { component: 'encryptedIntegrationService', operation: 'githubDataEncrypted' });
            }
            else {
                logger_1.logger.info('ℹ️ Skipping GitHub - not connected or no tokens', { component: 'encryptedIntegrationService', operation: 'skippingGithubNot' });
            }
            // Store encrypted data in database
            if (window.electronAPI?.sqlite) {
                logger_1.logger.info(`💾 Storing ${encryptedData.length} encrypted integrations in database...`, { component: 'encryptedIntegrationService', operation: 'storing${encrypteddata.length}Encrypted' });
                // Initialize table first
                logger_1.logger.info('🔧 Initializing database table...', { component: 'encryptedIntegrationService', operation: 'initializingDatabaseTable...' });
                await this.initializeDatabase();
                // Clear existing integration data
                logger_1.logger.info('🧹 Clearing existing integration data...', { component: 'encryptedIntegrationService', operation: 'clearingExistingIntegration' });
                await this.clearStoredIntegrations();
                // Store each encrypted integration in database
                for (const integration of encryptedData) {
                    logger_1.logger.info(`💾 Storing ${integration.type} integration...`, { component: 'encryptedIntegrationService', operation: 'storing${integration.type}Integration...' });
                    const result = await window.electronAPI.integrations.saveEncrypted({
                        id: integration.id,
                        type: integration.type,
                        encrypted_data: integration.encrypted_data,
                        created_at: integration.created_at,
                        updated_at: integration.updated_at
                    });
                    if (!result.success) {
                        logger_1.logger.error(`❌ Failed to store ${integration.type} integration:`, { component: 'encryptedIntegrationService', operation: 'failedStore${integration.type}' }, new Error(result.error));
                        throw new Error(`Failed to store ${integration.type} integration: ${result.error}`);
                    }
                    logger_1.logger.info(`✅ Successfully stored ${integration.type} integration`, { component: 'encryptedIntegrationService', operation: 'successfullyStored${integration.type}' });
                }
                // Verify data was stored
                const verificationResult = await window.electronAPI.integrations.getVerification();
                if (verificationResult.success && verificationResult.data) {
                    logger_1.logger.info(`✅ Verification: ${verificationResult.data.length} integrations found in database`, { component: 'encryptedIntegrationService', operation: 'verificationIntegrations', metadata: { count: verificationResult.data.length, types: verificationResult.data.map((row) => row.type) } });
                }
                else {
                    logger_1.logger.warn('⚠️ Could not verify stored integrations', { component: 'encryptedIntegrationService', operation: 'couldNotVerify', metadata: { error: verificationResult.error } });
                }
                logger_1.logger.info(`✅ Stored ${encryptedData.length} encrypted integrations in database`, { component: 'encryptedIntegrationService', operation: 'stored${encrypteddata.length}Encrypted' });
            }
            else {
                logger_1.logger.warn('⚠️ SQLite not available, falling back to localStorage', { component: 'encryptedIntegrationService', operation: 'operation' });
                // Fallback to localStorage if SQLite is not available
                const encryptedJson = JSON.stringify(encryptedData);
                localStorage.setItem(this.STORAGE_KEY, encryptedJson);
                logger_1.logger.info(`✅ Stored ${encryptedData.length} encrypted integrations in localStorage (fallback)`, { component: 'encryptedIntegrationService', operation: 'stored${encrypteddata.length}Encrypted' });
            }
            // Clear the old unencrypted localStorage data
            localStorage.removeItem('serenity_integrations');
            logger_1.logger.info('🧹 Cleared unencrypted integration data from localStorage', { component: 'encryptedIntegrationService', operation: 'clearedUnencryptedIntegration' });
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to encrypt and store integrations:', { component: 'encryptedIntegrationService', operation: 'failedEncryptAnd' }, error);
            throw new Error(`Failed to encrypt integrations: ${error}`);
        }
    }
    /**
     * Load and decrypt integration tokens from database
     */
    static async loadEncryptedIntegrations(masterPassword) {
        try {
            logger_1.logger.info('🔓 Loading encrypted integration data...', { component: 'encryptedIntegrationService', operation: 'loadingEncryptedIntegration' });
            let encryptedData = [];
            // Try to load from database first
            if (window.electronAPI?.integrations) {
                const result = await window.electronAPI.integrations.loadEncrypted();
                if (result.success && result.data) {
                    encryptedData = result.data;
                    logger_1.logger.info(`📂 Loaded ${encryptedData.length} encrypted integrations from database`, { component: 'encryptedIntegrationService', operation: 'loaded${encrypteddata.length}Encrypted' });
                }
            }
            // Fallback to localStorage if no database data
            if (encryptedData.length === 0) {
                const storedData = localStorage.getItem(this.STORAGE_KEY);
                if (storedData) {
                    encryptedData = JSON.parse(storedData);
                    logger_1.logger.info(`📂 Loaded ${encryptedData.length} encrypted integrations from localStorage (fallback)`, { component: 'encryptedIntegrationService', operation: 'loaded${encrypteddata.length}Encrypted' });
                }
            }
            if (encryptedData.length === 0) {
                logger_1.logger.info('ℹ️ No encrypted integration data found', { component: 'encryptedIntegrationService', operation: 'encryptedIntegrationData' });
                return null;
            }
            // Decrypt the integration data
            const integrationsState = {
                googleCalendar: {
                    connected: false,
                    syncEnabled: false,
                },
                github: {
                    connected: false,
                    syncEnabled: false,
                    tokens: [],
                },
                syncing: false,
            };
            for (const integration of encryptedData) {
                try {
                    const encryptedDataObj = JSON.parse(integration.encrypted_data);
                    const decryptedJson = await encryption_1.EncryptionService.decrypt(encryptedDataObj, masterPassword, 'restricted');
                    const decryptedData = JSON.parse(decryptedJson);
                    if (integration.type === 'google_calendar') {
                        integrationsState.googleCalendar = {
                            connected: true,
                            ...decryptedData,
                        };
                        logger_1.logger.info('🔓 Decrypted Google Calendar integration', { component: 'encryptedIntegrationService', operation: 'decryptedGoogleCalendar', metadata: { userEmail: decryptedData.userEmail } });
                    }
                    else if (integration.type === 'github') {
                        integrationsState.github = {
                            connected: true,
                            ...decryptedData,
                        };
                        const tokenCount = decryptedData.tokens?.length || 0;
                        logger_1.logger.info(`🔓 Decrypted GitHub integration with ${tokenCount} token${tokenCount !== 1 ? 's' : ''}`, { component: 'encryptedIntegrationService', operation: 'decryptedGithubIntegration' });
                        if (tokenCount > 0) {
                            logger_1.logger.info('   Tokens', { component: 'encryptedIntegrationService', operation: 'tokens', metadata: { tokens: decryptedData.tokens.map((t) => `${t.username} (${t.displayName || 'no name'})`).join(', ') } });
                        }
                    }
                }
                catch (decryptError) {
                    logger_1.logger.error(`❌ Failed to decrypt ${integration.type} integration:`, { component: 'encryptedIntegrationService', operation: 'failedDecrypt${integration.type}' }, decryptError);
                    // Continue with other integrations even if one fails
                }
            }
            logger_1.logger.info('✅ Successfully loaded encrypted integrations', { component: 'encryptedIntegrationService', operation: 'successfullyLoadedEncrypted' });
            return integrationsState;
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to load encrypted integrations:', { component: 'encryptedIntegrationService', operation: 'failedLoadEncrypted' }, error);
            throw new Error(`Failed to load integrations: ${error}`);
        }
    }
    /**
     * Clear all stored integration data
     */
    static async clearStoredIntegrations() {
        try {
            // Clear from database
            if (window.electronAPI?.integrations) {
                const result = await window.electronAPI.integrations.clearEncrypted();
                if (result.success) {
                    logger_1.logger.info('🧹 Cleared encrypted integrations from database', { component: 'encryptedIntegrationService', operation: 'clearedEncryptedIntegrations' });
                }
                else {
                    logger_1.logger.warn('⚠️ Failed to clear integrations from database', { component: 'encryptedIntegrationService', operation: 'failedClearIntegrations', metadata: { error: result.error } });
                }
            }
            // Clear from localStorage (fallback and legacy data)
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem('serenity_integrations');
            logger_1.logger.info('🧹 Cleared all integration data', { component: 'encryptedIntegrationService', operation: 'clearedAllIntegration' });
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to clear integration data:', { component: 'encryptedIntegrationService', operation: 'failedClearIntegration' }, error);
        }
    }
    /**
     * Initialize database table for encrypted integrations
     * Creates the table if it doesn't exist for compatibility
     */
    static async initializeDatabase() {
        try {
            if (!window.electronAPI?.sqlite) {
                logger_1.logger.info('ℹ️ SQLite not available, skipping integration table initialization', { component: 'encryptedIntegrationService', operation: 'operation' });
                return;
            }
            logger_1.logger.info('🔧 Initializing encrypted_integrations table...', { component: 'encryptedIntegrationService', operation: 'initializingEncrypted_integrationsTable...' });
            // Create the table if it doesn't exist (for compatibility with older databases)
            const createTableResult = await window.electronAPI.integrations.initializeTable();
            if (!createTableResult.success) {
                throw new Error(`Failed to create encrypted_integrations table: ${createTableResult.error}`);
            }
            // Verify table exists by checking structure
            const tableCheckResult = await window.electronAPI.integrations.verifyTable();
            if (!tableCheckResult.success || !tableCheckResult.data?.exists) {
                throw new Error('encrypted_integrations table was not created successfully');
            }
            logger_1.logger.info('✅ Encrypted integrations table initialized successfully', { component: 'encryptedIntegrationService', operation: 'encryptedIntegrationsTable' });
        }
        catch (error) {
            logger_1.logger.error('❌ Database initialization failed:', { component: 'encryptedIntegrationService', operation: 'databaseInitializationFailed:' }, error);
            throw error;
        }
    }
    /**
     * Check if encrypted integration data exists
     */
    static async hasEncryptedIntegrations() {
        try {
            // Check database first
            if (window.electronAPI?.integrations) {
                const result = await window.electronAPI.integrations.hasEncrypted();
                if (result.success && result.data?.hasEncrypted) {
                    return true;
                }
            }
            // Check localStorage fallback
            const storedData = localStorage.getItem(this.STORAGE_KEY);
            return storedData !== null && JSON.parse(storedData).length > 0;
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to check for encrypted integrations:', { component: 'encryptedIntegrationService', operation: 'failedCheckFor' }, error);
            return false;
        }
    }
    /**
     * Migrate unencrypted data to encrypted storage
     */
    static async migrateToEncryptedStorage(masterPassword) {
        try {
            logger_1.logger.info('🔄 Migrating unencrypted integration data...', { component: 'encryptedIntegrationService', operation: 'migratingUnencryptedIntegration' });
            const unencryptedData = localStorage.getItem('serenity_integrations');
            if (!unencryptedData) {
                logger_1.logger.info('ℹ️ No unencrypted data to migrate', { component: 'encryptedIntegrationService', operation: 'unencryptedDataMigrate' });
                return;
            }
            const integrationsState = JSON.parse(unencryptedData);
            // Encrypt and store the data
            await this.saveEncryptedIntegrations(integrationsState, masterPassword);
            logger_1.logger.info('✅ Successfully migrated integrations to encrypted storage', { component: 'encryptedIntegrationService', operation: 'successfullyMigratedIntegrations' });
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to migrate integration data:', { component: 'encryptedIntegrationService', operation: 'failedMigrateIntegration' }, error);
            throw error;
        }
    }
}
exports.EncryptedIntegrationService = EncryptedIntegrationService;
EncryptedIntegrationService.STORAGE_KEY = 'encrypted_integrations';
