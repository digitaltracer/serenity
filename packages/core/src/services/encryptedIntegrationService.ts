/**
 * Encrypted Integration Service
 * Handles encryption and database storage of integration tokens
 */

import { EncryptionService, EncryptedData } from '../utils/encryption';
import { IntegrationsState } from '../store/slices/integrationsSlice';

export interface EncryptedIntegrationData {
  id: string;
  type: 'google_calendar' | 'github';
  encrypted_data: string; // JSON string of EncryptedData
  created_at: string;
  updated_at: string;
}

/**
 * Service for managing encrypted integration data storage
 */
export class EncryptedIntegrationService {
  private static readonly STORAGE_KEY = 'encrypted_integrations';

  /**
   * Encrypt and store integration tokens in database
   */
  static async saveEncryptedIntegrations(
    integrationsState: IntegrationsState,
    masterPassword: string
  ): Promise<void> {
    try {
      console.log('🔐 Starting integration token encryption process...');
      console.log('📊 Integration state received:', {
        googleCalendarConnected: integrationsState.googleCalendar.connected,
        githubConnected: integrationsState.github.connected,
        hasGoogleToken: !!integrationsState.googleCalendar.accessToken,
        hasGithubTokens: integrationsState.github.tokens?.length || 0,
        masterPasswordLength: masterPassword?.length || 0
      });
      
      const encryptedData: EncryptedIntegrationData[] = [];

      // Encrypt Google Calendar tokens if connected
      if (integrationsState.googleCalendar.connected && integrationsState.googleCalendar.accessToken) {
        console.log('📅 Processing Google Calendar integration for encryption...');
        
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

        console.log('🔒 Encrypting Google Calendar data...');
        const encryptedGoogleData = await EncryptionService.encrypt(
          JSON.stringify(googleData),
          masterPassword,
          'restricted' // Highest security level for integration tokens
        );

        encryptedData.push({
          id: 'google_calendar',
          type: 'google_calendar',
          encrypted_data: JSON.stringify(encryptedGoogleData),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        console.log('✅ Google Calendar data encrypted successfully');
      } else {
        console.log('ℹ️ Skipping Google Calendar - not connected or no access token');
      }

      // Encrypt GitHub tokens if connected
      if (integrationsState.github.connected && integrationsState.github.tokens && integrationsState.github.tokens.length > 0) {
        console.log('🐙 Processing GitHub integration for encryption...');
        
        const githubData = {
          tokens: integrationsState.github.tokens,
          syncEnabled: integrationsState.github.syncEnabled,
          lastSync: integrationsState.github.lastSync,
          totalRepositories: integrationsState.github.totalRepositories,
        };

        console.log('🔒 Encrypting GitHub data...');
        const encryptedGithubData = await EncryptionService.encrypt(
          JSON.stringify(githubData),
          masterPassword,
          'restricted' // Highest security level for integration tokens
        );

        encryptedData.push({
          id: 'github',
          type: 'github',
          encrypted_data: JSON.stringify(encryptedGithubData),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        console.log('✅ GitHub data encrypted successfully');
      } else {
        console.log('ℹ️ Skipping GitHub - not connected or no tokens');
      }

      // Store encrypted data in database
      if (window.electronAPI?.sqlite) {
        console.log(`💾 Storing ${encryptedData.length} encrypted integrations in database...`);
        
        // Initialize table first
        console.log('🔧 Initializing database table...');
        await this.initializeDatabase();
        
        // Clear existing integration data
        console.log('🧹 Clearing existing integration data...');
        await this.clearStoredIntegrations();
        
        // Store each encrypted integration in database
        for (const integration of encryptedData) {
          console.log(`💾 Storing ${integration.type} integration...`);
          
          const result = await window.electronAPI.sqlite.query(
            `INSERT OR REPLACE INTO encrypted_integrations 
             (id, type, encrypted_data, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?)`,
            [
              integration.id,
              integration.type,
              integration.encrypted_data,
              integration.created_at,
              integration.updated_at,
            ]
          );
          
          if (!result.success) {
            console.error(`❌ Failed to store ${integration.type} integration:`, result.error);
            throw new Error(`Failed to store ${integration.type} integration: ${result.error}`);
          }
          
          console.log(`✅ Successfully stored ${integration.type} integration`);
        }
        
        // Verify data was stored
        const verificationResult = await window.electronAPI.sqlite.query(
          'SELECT id, type FROM encrypted_integrations'
        );
        
        if (verificationResult.success && verificationResult.data) {
          console.log(`✅ Verification: ${verificationResult.data.length} integrations found in database:`, 
            verificationResult.data.map((row: any) => row.type));
        } else {
          console.warn('⚠️ Could not verify stored integrations:', verificationResult.error);
        }
        
        console.log(`✅ Stored ${encryptedData.length} encrypted integrations in database`);
      } else {
        console.warn('⚠️ SQLite not available, falling back to localStorage');
        // Fallback to localStorage if SQLite is not available
        const encryptedJson = JSON.stringify(encryptedData);
        localStorage.setItem(this.STORAGE_KEY, encryptedJson);
        console.log(`✅ Stored ${encryptedData.length} encrypted integrations in localStorage (fallback)`);
      }

      // Clear the old unencrypted localStorage data
      localStorage.removeItem('serenity_integrations');
      console.log('🧹 Cleared unencrypted integration data from localStorage');

    } catch (error) {
      console.error('❌ Failed to encrypt and store integrations:', error);
      throw new Error(`Failed to encrypt integrations: ${error}`);
    }
  }

  /**
   * Load and decrypt integration tokens from database
   */
  static async loadEncryptedIntegrations(masterPassword: string): Promise<IntegrationsState | null> {
    try {
      console.log('🔓 Loading encrypted integration data...');
      
      let encryptedData: EncryptedIntegrationData[] = [];

      // Try to load from database first
      if (window.electronAPI?.sqlite) {
        const result = await window.electronAPI.sqlite.query(
          'SELECT id, type, encrypted_data, created_at, updated_at FROM encrypted_integrations'
        );
        
        if (result.success && result.data) {
          encryptedData = result.data;
          console.log(`📂 Loaded ${encryptedData.length} encrypted integrations from database`);
        }
      }
      
      // Fallback to localStorage if no database data
      if (encryptedData.length === 0) {
        const storedData = localStorage.getItem(this.STORAGE_KEY);
        if (storedData) {
          encryptedData = JSON.parse(storedData);
          console.log(`📂 Loaded ${encryptedData.length} encrypted integrations from localStorage (fallback)`);
        }
      }

      if (encryptedData.length === 0) {
        console.log('ℹ️ No encrypted integration data found');
        return null;
      }

      // Decrypt the integration data
      const integrationsState: IntegrationsState = {
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
          const encryptedDataObj: EncryptedData = JSON.parse(integration.encrypted_data);
          const decryptedJson = await EncryptionService.decrypt(
            encryptedDataObj,
            masterPassword,
            'restricted'
          );
          const decryptedData = JSON.parse(decryptedJson);

          if (integration.type === 'google_calendar') {
            integrationsState.googleCalendar = {
              connected: true,
              ...decryptedData,
            };
            console.log('🔓 Decrypted Google Calendar integration for:', decryptedData.userEmail);
          } else if (integration.type === 'github') {
            integrationsState.github = {
              connected: true,
              ...decryptedData,
            };
            const tokenCount = decryptedData.tokens?.length || 0;
            console.log(`🔓 Decrypted GitHub integration with ${tokenCount} token${tokenCount !== 1 ? 's' : ''}`);
            if (tokenCount > 0) {
              console.log('   Tokens:', decryptedData.tokens.map((t: any) => `${t.username} (${t.displayName || 'no name'})`).join(', '));
            }
          }
        } catch (decryptError) {
          console.error(`❌ Failed to decrypt ${integration.type} integration:`, decryptError);
          // Continue with other integrations even if one fails
        }
      }

      console.log('✅ Successfully loaded encrypted integrations');
      return integrationsState;

    } catch (error) {
      console.error('❌ Failed to load encrypted integrations:', error);
      throw new Error(`Failed to load integrations: ${error}`);
    }
  }

  /**
   * Clear all stored integration data
   */
  static async clearStoredIntegrations(): Promise<void> {
    try {
      // Clear from database
      if (window.electronAPI?.sqlite) {
        const result = await window.electronAPI.sqlite.query(
          'DELETE FROM encrypted_integrations'
        );
        
        if (result.success) {
          console.log('🧹 Cleared encrypted integrations from database');
        } else {
          console.warn('⚠️ Failed to clear integrations from database:', result.error);
        }
      }

      // Clear from localStorage (fallback and legacy data)
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem('serenity_integrations');
      
      console.log('🧹 Cleared all integration data');
    } catch (error) {
      console.error('❌ Failed to clear integration data:', error);
    }
  }

  /**
   * Initialize database table for encrypted integrations
   * Creates the table if it doesn't exist for compatibility
   */
  static async initializeDatabase(): Promise<void> {
    try {
      if (!window.electronAPI?.sqlite) {
        console.log('ℹ️ SQLite not available, skipping integration table initialization');
        return;
      }

      console.log('🔧 Initializing encrypted_integrations table...');

      // Create the table if it doesn't exist (for compatibility with older databases)
      const createTableResult = await window.electronAPI.sqlite.query(`
        CREATE TABLE IF NOT EXISTS encrypted_integrations (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL CHECK (type IN ('google_calendar', 'github')),
          encrypted_data TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      if (!createTableResult.success) {
        throw new Error(`Failed to create encrypted_integrations table: ${createTableResult.error}`);
      }

      // Verify table exists by checking structure
      const tableCheckResult = await window.electronAPI.sqlite.query(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='encrypted_integrations'
      `);

      if (!tableCheckResult.success || !tableCheckResult.data || tableCheckResult.data.length === 0) {
        throw new Error('encrypted_integrations table was not created successfully');
      }

      console.log('✅ Encrypted integrations table initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check if encrypted integration data exists
   */
  static async hasEncryptedIntegrations(): Promise<boolean> {
    try {
      // Check database first
      if (window.electronAPI?.sqlite) {
        const result = await window.electronAPI.sqlite.query(
          'SELECT COUNT(*) as count FROM encrypted_integrations'
        );
        
        if (result.success && result.data && result.data[0]?.count > 0) {
          return true;
        }
      }

      // Check localStorage fallback
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      return storedData !== null && JSON.parse(storedData).length > 0;
    } catch (error) {
      console.error('❌ Failed to check for encrypted integrations:', error);
      return false;
    }
  }

  /**
   * Migrate unencrypted data to encrypted storage
   */
  static async migrateToEncryptedStorage(masterPassword: string): Promise<void> {
    try {
      console.log('🔄 Migrating unencrypted integration data...');
      
      const unencryptedData = localStorage.getItem('serenity_integrations');
      if (!unencryptedData) {
        console.log('ℹ️ No unencrypted data to migrate');
        return;
      }

      const integrationsState: IntegrationsState = JSON.parse(unencryptedData);
      
      // Encrypt and store the data
      await this.saveEncryptedIntegrations(integrationsState, masterPassword);
      
      console.log('✅ Successfully migrated integrations to encrypted storage');
    } catch (error) {
      console.error('❌ Failed to migrate integration data:', error);
      throw error;
    }
  }
}