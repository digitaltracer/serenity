/**
 * Secure data export/import utilities with encryption
 */
import { EncryptedData, DataClassification } from './encryption';
export interface EnhancedPrivacySecuritySettings {
    masterPasswordEnabled: boolean;
    autoLockTimeout: number;
    screenPrivacy: boolean;
    encryptJournalContent: boolean;
    encryptTaskContent: boolean;
    hideFromTaskbar: boolean;
    dataRetentionDays: number;
    localOnlyMode: boolean;
    encryptionLevel: 'basic' | 'enhanced' | 'maximum';
    secureDelete: boolean;
    biometricAuth: boolean;
    dataClassification: {
        journalEntries: 'public' | 'internal' | 'confidential' | 'restricted';
        taskDescriptions: 'public' | 'internal' | 'confidential' | 'restricted';
        taskTitles: 'public' | 'internal' | 'confidential' | 'restricted';
        projectNames: 'public' | 'internal' | 'confidential' | 'restricted';
        tags: 'public' | 'internal' | 'confidential' | 'restricted';
        userNotes: 'public' | 'internal' | 'confidential' | 'restricted';
    };
}
export interface SecureExportData {
    version: string;
    exportDate: string;
    encryption: {
        enabled: boolean;
        level: 'basic' | 'enhanced' | 'maximum';
        algorithm: string;
    };
    metadata: {
        totalItems: number;
        encryptedItems: number;
        checksumHash: string;
    };
    data: {
        tasks: Array<SecureTaskExport>;
        journalEntries: Array<SecureJournalExport>;
        projects: Array<SecureProjectExport>;
        settings: SecureSettingsExport;
    };
}
export interface SecureTaskExport {
    id: string;
    title: string | EncryptedData;
    description: string | EncryptedData;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    projectId?: string;
    tags: Array<string | EncryptedData>;
    createdAt: string;
    updatedAt: string;
    classification: {
        title: DataClassification;
        description: DataClassification;
        tags: DataClassification;
    };
}
export interface SecureJournalExport {
    id: string;
    title: string | EncryptedData;
    content: string | EncryptedData;
    mood?: 'happy' | 'neutral' | 'sad' | 'excited' | 'stressed';
    pinned: boolean;
    tags: Array<string | EncryptedData>;
    createdAt: string;
    updatedAt: string;
    classification: {
        title: DataClassification;
        content: DataClassification;
        tags: DataClassification;
    };
}
export interface SecureProjectExport {
    id: string;
    name: string | EncryptedData;
    description: string | EncryptedData;
    color: string;
    createdAt: string;
    updatedAt: string;
    classification: {
        name: DataClassification;
        description: DataClassification;
    };
}
export interface SecureSettingsExport {
    theme: string;
    compactMode: boolean;
    privacy: Omit<EnhancedPrivacySecuritySettings, 'masterPasswordEnabled'>;
}
/**
 * Secure export manager
 */
export declare class SecureExportManager {
    private password;
    private settings;
    constructor(password: string, settings: EnhancedPrivacySecuritySettings);
    /**
     * Export data securely with encryption
     */
    exportData(data: {
        tasks: any[];
        journalEntries: any[];
        projects: any[];
        appSettings: any;
    }): Promise<string>;
    /**
     * Import and decrypt data
     */
    importData(exportString: string): Promise<{
        tasks: any[];
        journalEntries: any[];
        projects: any[];
        settings: any;
        metadata: {
            importDate: string;
            originalExportDate: string;
            itemsDecrypted: number;
            checksumValid: boolean;
        };
    }>;
    /**
     * Process tasks for secure export
     */
    private processTasksForExport;
    /**
     * Process journal entries for secure export
     */
    private processJournalForExport;
    /**
     * Process projects for secure export
     */
    private processProjectsForExport;
    /**
     * Process settings for export (exclude sensitive data)
     */
    private processSettingsForExport;
    /**
     * Process imported tasks
     */
    private processTasksFromImport;
    /**
     * Process imported journal entries
     */
    private processJournalFromImport;
    /**
     * Process imported projects
     */
    private processProjectsFromImport;
    /**
     * Encrypt a field based on its classification
     */
    private encryptField;
    /**
     * Decrypt a field based on its classification
     */
    private decryptField;
    /**
     * Count encrypted items in export data
     */
    private countEncryptedItems;
    /**
     * Calculate SHA-256 checksum for data integrity
     */
    private calculateChecksum;
}
/**
 * Export data securely to file
 */
export declare const exportDataSecurely: (data: {
    tasks: any[];
    journalEntries: any[];
    projects: any[];
    appSettings: any;
}, password: string, settings: EnhancedPrivacySecuritySettings, filename?: string) => Promise<void>;
/**
 * Import data securely from file
 */
export declare const importDataSecurely: (file: File, password: string, settings: EnhancedPrivacySecuritySettings) => Promise<{
    tasks: any[];
    journalEntries: any[];
    projects: any[];
    settings: any;
    metadata: any;
}>;
//# sourceMappingURL=secureExport.d.ts.map