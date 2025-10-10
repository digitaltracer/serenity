/**
 * Encrypted Integration Service
 * Handles encryption and database storage of integration tokens
 */
import { IntegrationsState } from '../store/slices/integrationsSlice';
export interface EncryptedIntegrationData {
    id: string;
    type: 'google_calendar' | 'github';
    encrypted_data: string;
    created_at: string;
    updated_at: string;
}
/**
 * Service for managing encrypted integration data storage
 */
export declare class EncryptedIntegrationService {
    private static readonly STORAGE_KEY;
    /**
     * Encrypt and store integration tokens in database
     */
    static saveEncryptedIntegrations(integrationsState: IntegrationsState, masterPassword: string): Promise<void>;
    /**
     * Load and decrypt integration tokens from database
     */
    static loadEncryptedIntegrations(masterPassword: string): Promise<IntegrationsState | null>;
    /**
     * Clear all stored integration data
     */
    static clearStoredIntegrations(): Promise<void>;
    /**
     * Initialize database table for encrypted integrations
     * Creates the table if it doesn't exist for compatibility
     */
    static initializeDatabase(): Promise<void>;
    /**
     * Check if encrypted integration data exists
     */
    static hasEncryptedIntegrations(): Promise<boolean>;
    /**
     * Migrate unencrypted data to encrypted storage
     */
    static migrateToEncryptedStorage(masterPassword: string): Promise<void>;
}
