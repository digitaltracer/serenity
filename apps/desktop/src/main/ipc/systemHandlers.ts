/**
 * System-related IPC handlers
 * Handles database management, analytics, and system operations
 */

import { ipcMain, app } from 'electron';
import { z } from 'zod';
import { apiService } from '../services/ApiService';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '@serenity/core';

// Log file management with rotation
const MAX_LOG_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_LOG_FILES = 5; // Keep 5 rotated log files

async function writeLogToFile(logEntry: any): Promise<void> {
  const logsDir = path.join(app.getPath('userData'), 'logs');
  const currentLogFile = path.join(logsDir, 'serenity.log');

  try {
    // Ensure logs directory exists
    await fs.mkdir(logsDir, { recursive: true });

    // Check if log rotation is needed
    try {
      const stats = await fs.stat(currentLogFile);
      if (stats.size > MAX_LOG_FILE_SIZE) {
        await rotateLogFiles(logsDir);
      }
    } catch {
      // File doesn't exist yet, will be created
    }

    // Format log entry for file
    const logLine = `[${logEntry.timestamp}] ${logEntry.level} ${logEntry.context?.component || ''}:${logEntry.context?.operation || ''} - ${logEntry.message}`;
    const errorDetails = logEntry.error ? `\n  Error: ${logEntry.error.name}: ${logEntry.error.message}\n  Stack: ${logEntry.error.stack || 'N/A'}` : '';
    const fullLogLine = logLine + errorDetails + '\n';

    // Append to log file
    await fs.appendFile(currentLogFile, fullLogLine, 'utf8');
  } catch (error) {
    // Silently fail - don't want logging to crash the app
    logger.error('Failed to write log to file:', { component: 'systemHandlers', operation: 'failedWriteLog' }, error as Error);
  }
}

async function rotateLogFiles(logsDir: string): Promise<void> {
  try {
    // Rotate existing log files
    for (let i = MAX_LOG_FILES - 1; i >= 1; i--) {
      const oldFile = path.join(logsDir, `serenity.log.${i}`);
      const newFile = path.join(logsDir, `serenity.log.${i + 1}`);

      try {
        await fs.rename(oldFile, newFile);
      } catch {
        // File doesn't exist, skip
      }
    }

    // Move current log to .1
    const currentLog = path.join(logsDir, 'serenity.log');
    const rotatedLog = path.join(logsDir, 'serenity.log.1');

    try {
      await fs.rename(currentLog, rotatedLog);
    } catch {
      // File doesn't exist, skip
    }

    // Delete oldest log if it exceeds MAX_LOG_FILES
    const oldestLog = path.join(logsDir, `serenity.log.${MAX_LOG_FILES + 1}`);
    try {
      await fs.unlink(oldestLog);
    } catch {
      // File doesn't exist, skip
    }
  } catch (error) {
    logger.error('Failed to rotate log files:', { component: 'systemHandlers', operation: 'failedRotateLog' }, error as Error);
  }
}

export function registerSystemHandlers(): void {
  logger.info('🔧 Registering system IPC handlers...', { component: 'systemHandlers', operation: 'registeringSystemIpc' });

  // Log file writing with rotation
  ipcMain.handle('system:write-log', async (_, logEntry) => {
    try {
      await writeLogToFile(logEntry);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to write log' };
    }
  });

  // Get log files for debugging
  ipcMain.handle('system:get-logs', async () => {
    try {
      const logsDir = path.join(app.getPath('userData'), 'logs');
      const currentLogFile = path.join(logsDir, 'serenity.log');

      const content = await fs.readFile(currentLogFile, 'utf8');
      return { success: true, data: content };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to read logs' };
    }
  });

  // Clear log files
  ipcMain.handle('system:clear-logs', async () => {
    try {
      const logsDir = path.join(app.getPath('userData'), 'logs');
      const files = await fs.readdir(logsDir);

      for (const file of files) {
        if (file.startsWith('serenity.log')) {
          await fs.unlink(path.join(logsDir, file));
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to clear logs' };
    }
  });

  // System management operations
  ipcMain.handle('system:initialize', async () => {
    try {
      logger.info('🔐 Initializing system through business layer...', { component: 'systemHandlers', operation: 'initializingSystemThrough' });
      return await apiService.initializeDatabase();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize system';
      return { success: false, error: errorMessage };
    }
  });

  ipcMain.handle('system:test-connection', async () => {
    try {
      logger.info('🔐 Testing connection through business layer...', { component: 'systemHandlers', operation: 'testingConnectionThrough' });
      return await apiService.testDatabaseConnection();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      return { success: false, error: errorMessage };
    }
  });

  ipcMain.handle('system:test-persistence', async () => {
    try {
      logger.info('🧪 Testing persistence through business layer...', { component: 'systemHandlers', operation: 'testingPersistenceThrough' });
      
      // Create a test task through business logic
      const testTask = {
        title: 'Business Logic Test Task',
        description: 'Testing business logic persistence',
        completed: false,
        priority: 'high' as const,
        tags: ['test'],
        dueDate: new Date()
      };

      logger.info('📝 Creating test task through business layer:', {  component: 'systemHandlers', operation: 'creatingTestTask' , metadata: { value: testTask } });
      const createResult = await apiService.createTask(testTask);
      
      if (!createResult.success) {
        return { success: false, error: createResult.error };
      }
      
      logger.info(`✅ Task created through business layer: ${createResult.data.id}`, { component: 'systemHandlers', operation: 'taskCreatedThrough' });

      // Retrieve all tasks through business logic
      logger.info('📂 Retrieving all tasks through business layer...', { component: 'systemHandlers', operation: 'retrievingAllTasks' });
      const tasksResult = await apiService.getTasks();
      
      if (!tasksResult.success) {
        return { success: false, error: tasksResult.error };
      }
      
      const allTasks = tasksResult.data || [];
      logger.info(`📊 TOTAL TASKS: ${allTasks.length}`, { component: 'systemHandlers', operation: 'totalTasks:' });
      logger.info('📋 TASKS RETRIEVED THROUGH BUSINESS LAYER:', { component: 'systemHandlers', operation: 'tasksRetrievedThrough' });
      allTasks.forEach((task: any, index: number) => {
        logger.info(`  ${index + 1}. ${task.title} (ID: ${task.id})`, { component: 'systemHandlers', operation: '${index1}.${task.title}' });
        logger.info(`     Description: ${task.description}`, { component: 'systemHandlers', operation: 'description:${task.description}' });
        logger.info(`     Priority: ${task.priority}, Completed: ${task.completed}`, { component: 'systemHandlers', operation: 'operation' });
        logger.info(`     Created: ${task.createdAt}`, { component: 'systemHandlers', operation: 'created' });
        logger.info('     ---', { component: 'systemHandlers', operation: 'separator' });
      });

      return { 
        success: true, 
        createdTask: createResult.data, 
        allTasks,
        totalTasks: allTasks.length 
      };
    } catch (error) {
      logger.error('❌ Business logic test failed:', { component: 'systemHandlers', operation: 'businessLogicTest' }, error as Error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });

  // System verification through business logic layer
  ipcMain.handle('system:verify-data-loading', async () => {
    try {
      logger.info('🔍 VERIFYING DATA LOADING THROUGH BUSINESS LAYER...', { component: 'systemHandlers', operation: 'verifyingDataLoading' });
      
      const [tasksResult, projectsResult, journalResult] = await Promise.all([
        apiService.getTasks(),
        apiService.getProjects(),
        apiService.getJournalEntries()
      ]);
      
      if (!tasksResult.success || !projectsResult.success || !journalResult.success) {
        return { success: false, error: 'Failed to load data through business layer' };
      }
      
      const tasksData = tasksResult.data || [];
      const projectsData = projectsResult.data || [];
      const journalData = journalResult.data || [];
      
      logger.info('📊 VERIFICATION RESULTS:', { component: 'systemHandlers', operation: 'verificationResults:' });
      logger.info(`  - Tasks: ${tasksData.length}`, { component: 'systemHandlers', operation: 'tasks:${tasksdata.length}' });
      logger.info(`  - Projects: ${projectsData.length}`, { component: 'systemHandlers', operation: 'projects:${projectsdata.length}' });
      logger.info(`  - Journal entries: ${journalData.length}`, { component: 'systemHandlers', operation: 'journalEntries:${journaldata.length}' });

      return { 
        success: true, 
        tasks: tasksData,
        projects: projectsData,
        journal: journalData,
        counts: {
          tasks: tasksData.length,
          projects: projectsData.length,
          journal: journalData.length
        }
      };
    } catch (error) {
      logger.error('❌ Data loading verification failed:', { component: 'systemHandlers', operation: 'dataLoadingVerification' }, error as Error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });

  ipcMain.handle('system:get-stats', async () => {
    try {
      logger.info('🔐 Getting system statistics through business layer...', { component: 'systemHandlers', operation: 'gettingSystemStatistics' });
      return await apiService.getDatabaseStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get statistics';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('system:backup', async (_, backupPath?: string) => {
    try {
      if (backupPath !== undefined && typeof backupPath !== 'string') {
        return { success: false, path: null, error: 'Invalid backup path' };
      }
      logger.info('🔐 Creating backup through business layer...', { component: 'systemHandlers', operation: 'creatingBackupThrough' });
      return await apiService.backupDatabase(backupPath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Backup failed';
      return { success: false, path: null, error: errorMessage };
    }
  });

  ipcMain.handle('system:import-from-localstorage', async (_, data) => {
    try {
      if (typeof data !== 'object' || data === null) {
        return { success: false, result: null, error: 'Invalid import data' };
      }
      logger.info('🔐 Importing data through business layer...', { component: 'systemHandlers', operation: 'importingDataThrough' });
      return await apiService.importFromLocalStorage(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      return { success: false, result: null, error: errorMessage };
    }
  });

  ipcMain.handle('system:export-all-data', async () => {
    try {
      logger.info('🔐 Exporting data through business layer...', { component: 'systemHandlers', operation: 'exportingDataThrough' });
      return await apiService.exportAllData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      return { success: false, data: null, error: errorMessage };
    }
  });

  // Secure query execution for specific system operations only
  // SECURITY: This is restricted to predefined safe queries only
  ipcMain.handle('system:secure-query', async (_, queryType: string, params?: any[]) => {
    try {
      logger.info('🔐 Executing secure system query through business layer:', {  component: 'systemHandlers', operation: 'executingSecureSystem' , metadata: { value: queryType } });
      
      // Only allow predefined secure queries
      const allowedQueries = {
        // Secure settings operations
        'get-secure-setting': 'SELECT value FROM secure_settings WHERE key = ?',
        'set-secure-setting': 'INSERT OR REPLACE INTO secure_settings (key, value, created_at, updated_at) VALUES (?, ?, ?, ?)',
        'delete-secure-setting': 'DELETE FROM secure_settings WHERE key = ?',
        'has-secure-setting': 'SELECT COUNT(*) as count FROM secure_settings WHERE key = ?',
        'clear-all-secure-settings': 'DELETE FROM secure_settings',
        
        // Master password specific operations  
        'get-master-password-hash': 'SELECT value FROM secure_settings WHERE key = "master_password_hash"',
        'set-master-password-hash': 'INSERT OR REPLACE INTO secure_settings (key, value, created_at, updated_at) VALUES ("master_password_hash", ?, ?, ?)',
        'has-master-password': 'SELECT COUNT(*) as count FROM secure_settings WHERE key = "master_password_hash"',
        'clear-master-password': 'DELETE FROM secure_settings WHERE key = "master_password_hash"',
        
        // Integration operations
        'get-encrypted-integrations': 'SELECT * FROM encrypted_integrations',
        'get-encrypted-integration': 'SELECT * FROM encrypted_integrations WHERE id = ?',
        'save-encrypted-integration': 'INSERT OR REPLACE INTO encrypted_integrations (id, type, encrypted_data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        'delete-encrypted-integration': 'DELETE FROM encrypted_integrations WHERE id = ?',
        'has-encrypted-integrations': 'SELECT COUNT(*) as count FROM encrypted_integrations',
        'clear-encrypted-integrations': 'DELETE FROM encrypted_integrations',
        
        // Table initialization
        'init-secure-settings-table': `CREATE TABLE IF NOT EXISTS secure_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`,
        'init-encrypted-integrations-table': `CREATE TABLE IF NOT EXISTS encrypted_integrations (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL CHECK (type IN ('google_calendar', 'github')),
          encrypted_data TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Note: custom/raw queries have been disabled for security
      };
      
      if (!allowedQueries[queryType as keyof typeof allowedQueries]) {
        return { success: false, error: 'Unauthorized query type' };
      }
      
      let query = allowedQueries[queryType as keyof typeof allowedQueries];
      let queryParams = params;
      
      // Reject any attempt to run custom/raw queries from renderer
      if (queryType === 'custom') {
        return { success: false, data: null, error: 'Custom queries are disabled' };
      }
      
      // Execute through database service with validation
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      const result = await sqliteService.executeRawQuery(query, queryParams);
      
      return { success: true, data: result, error: null };
    } catch (error) {
      logger.error('❌ Secure query execution failed:', { component: 'systemHandlers', operation: 'secureQueryExecution' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Query execution failed';
      return { success: false, data: null, error: errorMessage };
    }
  });

  // Analytics and insights through business logic
  ipcMain.handle('analytics:get-productivity-insights', async () => {
    try {
      logger.info('🔐 Getting productivity insights through business layer...', { component: 'systemHandlers', operation: 'gettingProductivityInsights' });
      return await apiService.getProductivityInsights();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get productivity insights';
      return { success: false, data: null, error: errorMessage };
    }
  });

  logger.info('✅ System IPC handlers registered', { component: 'systemHandlers', operation: 'systemIpcHandlers' });
}
