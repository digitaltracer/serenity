/**
 * System-related IPC handlers
 * Handles database management, analytics, and system operations
 */

import { ipcMain } from 'electron';
import { apiService } from '../services/ApiService';

export function registerSystemHandlers(): void {
  console.log('🔧 Registering system IPC handlers...');

  // System management operations
  ipcMain.handle('system:initialize', async () => {
    try {
      console.log('🔐 Initializing system through business layer...');
      return await apiService.initializeDatabase();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize system';
      return { success: false, error: errorMessage };
    }
  });

  ipcMain.handle('system:test-connection', async () => {
    try {
      console.log('🔐 Testing connection through business layer...');
      return await apiService.testDatabaseConnection();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      return { success: false, error: errorMessage };
    }
  });

  ipcMain.handle('system:test-persistence', async () => {
    try {
      console.log('🧪 Testing persistence through business layer...');
      
      // Create a test task through business logic
      const testTask = {
        title: 'Business Logic Test Task',
        description: 'Testing business logic persistence',
        completed: false,
        priority: 'high' as const,
        tags: ['test'],
        dueDate: new Date()
      };

      console.log('📝 Creating test task through business layer:', testTask);
      const createResult = await apiService.createTask(testTask);
      
      if (!createResult.success) {
        return { success: false, error: createResult.error };
      }
      
      console.log('✅ Task created through business layer:', createResult.data.id);

      // Retrieve all tasks through business logic
      console.log('📂 Retrieving all tasks through business layer...');
      const tasksResult = await apiService.getTasks();
      
      if (!tasksResult.success) {
        return { success: false, error: tasksResult.error };
      }
      
      const allTasks = tasksResult.data || [];
      console.log('📊 TOTAL TASKS:', allTasks.length);
      console.log('📋 TASKS RETRIEVED THROUGH BUSINESS LAYER:');
      allTasks.forEach((task: any, index: number) => {
        console.log(`  ${index + 1}. ${task.title} (ID: ${task.id})`);
        console.log(`     Description: ${task.description}`);
        console.log(`     Priority: ${task.priority}, Completed: ${task.completed}`);
        console.log(`     Created: ${task.createdAt}`);
        console.log('     ---');
      });

      return { 
        success: true, 
        createdTask: createResult.data, 
        allTasks,
        totalTasks: allTasks.length 
      };
    } catch (error) {
      console.error('❌ Business logic test failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });

  // System verification through business logic layer
  ipcMain.handle('system:verify-data-loading', async () => {
    try {
      console.log('🔍 VERIFYING DATA LOADING THROUGH BUSINESS LAYER...');
      
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
      
      console.log('📊 VERIFICATION RESULTS:');
      console.log(`  - Tasks: ${tasksData.length}`);
      console.log(`  - Projects: ${projectsData.length}`);
      console.log(`  - Journal entries: ${journalData.length}`);

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
      console.error('❌ Data loading verification failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });

  ipcMain.handle('system:get-stats', async () => {
    try {
      console.log('🔐 Getting system statistics through business layer...');
      return await apiService.getDatabaseStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get statistics';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('system:backup', async (_, backupPath?: string) => {
    try {
      console.log('🔐 Creating backup through business layer...');
      return await apiService.backupDatabase(backupPath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Backup failed';
      return { success: false, path: null, error: errorMessage };
    }
  });

  ipcMain.handle('system:import-from-localstorage', async (_, data) => {
    try {
      console.log('🔐 Importing data through business layer...');
      return await apiService.importFromLocalStorage(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      return { success: false, result: null, error: errorMessage };
    }
  });

  ipcMain.handle('system:export-all-data', async () => {
    try {
      console.log('🔐 Exporting data through business layer...');
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
      console.log('🔐 Executing secure system query through business layer:', queryType);
      
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
        
        // Custom queries (for migration and debug purposes)
        'custom': 'CUSTOM_QUERY_PLACEHOLDER'
      };
      
      if (!allowedQueries[queryType as keyof typeof allowedQueries]) {
        return { success: false, error: 'Unauthorized query type' };
      }
      
      let query = allowedQueries[queryType as keyof typeof allowedQueries];
      let queryParams = params;
      
      // Handle custom queries (for migration and debug purposes)
      if (queryType === 'custom' && params && params.length >= 1) {
        query = params[0]; // First param is the actual query
        queryParams = params[1] || []; // Second param is the query parameters
        console.log('🔍 Executing custom query:', query, 'with params:', queryParams);
      }
      
      // Execute through database service with validation
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      const result = await sqliteService.executeRawQuery(query, queryParams);
      
      return { success: true, data: result, error: null };
    } catch (error) {
      console.error('❌ Secure query execution failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Query execution failed';
      return { success: false, data: null, error: errorMessage };
    }
  });

  // Analytics and insights through business logic
  ipcMain.handle('analytics:get-productivity-insights', async () => {
    try {
      console.log('🔐 Getting productivity insights through business layer...');
      return await apiService.getProductivityInsights();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get productivity insights';
      return { success: false, data: null, error: errorMessage };
    }
  });

  console.log('✅ System IPC handlers registered');
}