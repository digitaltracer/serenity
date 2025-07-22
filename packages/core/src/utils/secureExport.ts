/**
 * Secure data export/import utilities with encryption
 */

import { EncryptionService, EncryptedData, DataClassification } from './encryption';
// Define the interface locally to avoid circular dependency
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
export class SecureExportManager {
  private password: string;
  private settings: EnhancedPrivacySecuritySettings;

  constructor(password: string, settings: EnhancedPrivacySecuritySettings) {
    this.password = password;
    this.settings = settings;
  }

  /**
   * Export data securely with encryption
   */
  async exportData(data: {
    tasks: any[];
    journalEntries: any[];
    projects: any[];
    appSettings: any;
  }): Promise<string> {
    try {
      // Process tasks
      const secureTasks = await this.processTasksForExport(data.tasks);
      
      // Process journal entries
      const secureJournal = await this.processJournalForExport(data.journalEntries);
      
      // Process projects
      const secureProjects = await this.processProjectsForExport(data.projects);
      
      // Process settings (exclude sensitive data)
      const secureSettings = this.processSettingsForExport(data.appSettings);

      const exportData: SecureExportData = {
        version: '2.0.0',
        exportDate: new Date().toISOString(),
        encryption: {
          enabled: true,
          level: this.settings.encryptionLevel,
          algorithm: 'AES-GCM',
        },
        metadata: {
          totalItems: secureTasks.length + secureJournal.length + secureProjects.length,
          encryptedItems: this.countEncryptedItems(secureTasks, secureJournal, secureProjects),
          checksumHash: '', // Will be calculated
        },
        data: {
          tasks: secureTasks,
          journalEntries: secureJournal,
          projects: secureProjects,
          settings: secureSettings,
        },
      };

      // Calculate checksum
      const dataString = JSON.stringify(exportData.data);
      exportData.metadata.checksumHash = await this.calculateChecksum(dataString);

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export data securely');
    }
  }

  /**
   * Import and decrypt data
   */
  async importData(exportString: string): Promise<{
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
  }> {
    try {
      const exportData: SecureExportData = JSON.parse(exportString);
      
      // Verify checksum
      const dataString = JSON.stringify(exportData.data);
      const calculatedChecksum = await this.calculateChecksum(dataString);
      const checksumValid = calculatedChecksum === exportData.metadata.checksumHash;

      if (!checksumValid) {
        console.warn('Checksum validation failed - data may be corrupted');
      }

      // Decrypt tasks
      const tasks = await this.processTasksFromImport(exportData.data.tasks);
      
      // Decrypt journal entries
      const journalEntries = await this.processJournalFromImport(exportData.data.journalEntries);
      
      // Decrypt projects
      const projects = await this.processProjectsFromImport(exportData.data.projects);

      return {
        tasks,
        journalEntries,
        projects,
        settings: exportData.data.settings,
        metadata: {
          importDate: new Date().toISOString(),
          originalExportDate: exportData.exportDate,
          itemsDecrypted: this.countEncryptedItems(exportData.data.tasks, exportData.data.journalEntries, exportData.data.projects),
          checksumValid,
        },
      };
    } catch (error) {
      console.error('Import failed:', error);
      throw new Error('Failed to import data - invalid format or incorrect password');
    }
  }

  /**
   * Process tasks for secure export
   */
  private async processTasksForExport(tasks: any[]): Promise<SecureTaskExport[]> {
    const processed = await Promise.all(
      tasks.map(async (task) => {
        const classification = this.settings.dataClassification;
        
        const secureTask: SecureTaskExport = {
          id: task.id,
          title: await this.encryptField(task.title, classification.taskTitles),
          description: await this.encryptField(task.description || '', classification.taskDescriptions),
          completed: task.completed,
          priority: task.priority,
          dueDate: task.dueDate,
          projectId: task.projectId,
          tags: await Promise.all(
            (task.tags || []).map((tag: string) => this.encryptField(tag, classification.tags))
          ),
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          classification: {
            title: classification.taskTitles,
            description: classification.taskDescriptions,
            tags: classification.tags,
          },
        };

        return secureTask;
      })
    );

    return processed;
  }

  /**
   * Process journal entries for secure export
   */
  private async processJournalForExport(entries: any[]): Promise<SecureJournalExport[]> {
    const processed = await Promise.all(
      entries.map(async (entry) => {
        const classification = this.settings.dataClassification;
        
        const secureEntry: SecureJournalExport = {
          id: entry.id,
          title: await this.encryptField(entry.title, classification.userNotes),
          content: await this.encryptField(entry.content, classification.journalEntries),
          mood: entry.mood,
          pinned: entry.pinned,
          tags: await Promise.all(
            (entry.tags || []).map((tag: string) => this.encryptField(tag, classification.tags))
          ),
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
          classification: {
            title: classification.userNotes,
            content: classification.journalEntries,
            tags: classification.tags,
          },
        };

        return secureEntry;
      })
    );

    return processed;
  }

  /**
   * Process projects for secure export
   */
  private async processProjectsForExport(projects: any[]): Promise<SecureProjectExport[]> {
    const processed = await Promise.all(
      projects.map(async (project) => {
        const classification = this.settings.dataClassification;
        
        const secureProject: SecureProjectExport = {
          id: project.id,
          name: await this.encryptField(project.name, classification.projectNames),
          description: await this.encryptField(project.description || '', classification.userNotes),
          color: project.color,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          classification: {
            name: classification.projectNames,
            description: classification.userNotes,
          },
        };

        return secureProject;
      })
    );

    return processed;
  }

  /**
   * Process settings for export (exclude sensitive data)
   */
  private processSettingsForExport(settings: any): SecureSettingsExport {
    const { masterPasswordEnabled, ...privacySettings } = this.settings;
    return {
      theme: settings.theme,
      compactMode: settings.compactMode,
      privacy: privacySettings,
    };
  }

  /**
   * Process imported tasks
   */
  private async processTasksFromImport(tasks: SecureTaskExport[]): Promise<any[]> {
    const processed = await Promise.all(
      tasks.map(async (task) => {
        return {
          id: task.id,
          title: await this.decryptField(task.title, task.classification.title),
          description: await this.decryptField(task.description, task.classification.description),
          completed: task.completed,
          priority: task.priority,
          dueDate: task.dueDate,
          projectId: task.projectId,
          tags: await Promise.all(
            task.tags.map((tag) => this.decryptField(tag, task.classification.tags))
          ),
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        };
      })
    );

    return processed;
  }

  /**
   * Process imported journal entries
   */
  private async processJournalFromImport(entries: SecureJournalExport[]): Promise<any[]> {
    const processed = await Promise.all(
      entries.map(async (entry) => {
        return {
          id: entry.id,
          title: await this.decryptField(entry.title, entry.classification.title),
          content: await this.decryptField(entry.content, entry.classification.content),
          mood: entry.mood,
          pinned: entry.pinned,
          tags: await Promise.all(
            entry.tags.map((tag) => this.decryptField(tag, entry.classification.tags))
          ),
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        };
      })
    );

    return processed;
  }

  /**
   * Process imported projects
   */
  private async processProjectsFromImport(projects: SecureProjectExport[]): Promise<any[]> {
    const processed = await Promise.all(
      projects.map(async (project) => {
        return {
          id: project.id,
          name: await this.decryptField(project.name, project.classification.name),
          description: await this.decryptField(project.description, project.classification.description),
          color: project.color,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        };
      })
    );

    return processed;
  }

  /**
   * Encrypt a field based on its classification
   */
  private async encryptField(
    value: string, 
    classification: DataClassification
  ): Promise<string | EncryptedData> {
    if (classification === 'public') {
      return value;
    }

    return await EncryptionService.encrypt(value, this.password, classification);
  }

  /**
   * Decrypt a field based on its classification
   */
  private async decryptField(
    value: string | EncryptedData,
    classification: DataClassification
  ): Promise<string> {
    if (typeof value === 'string' && classification === 'public') {
      return value;
    }

    if (typeof value === 'object') {
      return await EncryptionService.decrypt(value, this.password, classification);
    }

    return value as string;
  }

  /**
   * Count encrypted items in export data
   */
  private countEncryptedItems(
    tasks: SecureTaskExport[], 
    entries: SecureJournalExport[], 
    projects: SecureProjectExport[]
  ): number {
    let count = 0;

    tasks.forEach(task => {
      if (typeof task.title === 'object') count++;
      if (typeof task.description === 'object') count++;
      task.tags.forEach(tag => { if (typeof tag === 'object') count++; });
    });

    entries.forEach(entry => {
      if (typeof entry.title === 'object') count++;
      if (typeof entry.content === 'object') count++;
      entry.tags.forEach(tag => { if (typeof tag === 'object') count++; });
    });

    projects.forEach(project => {
      if (typeof project.name === 'object') count++;
      if (typeof project.description === 'object') count++;
    });

    return count;
  }

  /**
   * Calculate SHA-256 checksum for data integrity
   */
  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

/**
 * Export data securely to file
 */
export const exportDataSecurely = async (
  data: { tasks: any[]; journalEntries: any[]; projects: any[]; appSettings: any },
  password: string,
  settings: EnhancedPrivacySecuritySettings,
  filename?: string
): Promise<void> => {
  try {
    const exportManager = new SecureExportManager(password, settings);
    const exportString = await exportManager.exportData(data);
    
    const blob = new Blob([exportString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename || `serenity-secure-export-${new Date().toISOString().split('T')[0]}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Secure export failed:', error);
    throw error;
  }
};

/**
 * Import data securely from file
 */
export const importDataSecurely = async (
  file: File,
  password: string,
  settings: EnhancedPrivacySecuritySettings
): Promise<{
  tasks: any[];
  journalEntries: any[];
  projects: any[];
  settings: any;
  metadata: any;
}> => {
  try {
    const fileContent = await file.text();
    const exportManager = new SecureExportManager(password, settings);
    
    return await exportManager.importData(fileContent);
  } catch (error) {
    console.error('Secure import failed:', error);
    throw error;
  }
};