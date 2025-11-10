/**
 * Main API Service
 * Provides intent-based business operations instead of direct database access
 * Implements security and validation layers
 */

import { taskService } from './TaskService';
import { projectService } from './ProjectService';
import { journalService } from './JournalService';
import { logger } from '@serenity/core';

export class ApiService {
  // Task operations
  async getTasks() {
    logger.info('🔐 ApiService: Getting tasks through business logic layer', { component: 'ApiService', operation: 'apiservice:GettingTasks' });
    return await taskService.getAllTasks();
  }

  async createTask(taskData: any) {
    logger.info('🔐 ApiService: Creating task through business logic layer', { component: 'ApiService', operation: 'apiservice:CreatingTask' });
    return await taskService.createTask(taskData);
  }

  async updateTask(id: string, updates: any) {
    logger.info('🔐 ApiService: Updating task through business logic layer', { component: 'ApiService', operation: 'apiservice:UpdatingTask' });
    return await taskService.updateTask(id, updates);
  }

  async deleteTask(id: string) {
    logger.info('🔐 ApiService: Deleting task through business logic layer', { component: 'ApiService', operation: 'apiservice:DeletingTask' });
    return await taskService.deleteTask(id);
  }

  async completeTask(id: string) {
    logger.info('🔐 ApiService: Completing task through business logic layer', { component: 'ApiService', operation: 'apiservice:CompletingTask' });
    return await taskService.completeTask(id);
  }

  async bulkUpdateTasks(taskIds: string[], updates: any) {
    logger.info('🔐 ApiService: Bulk updating tasks through business logic layer', { component: 'ApiService', operation: 'apiservice:BulkUpdating' });
    return await taskService.bulkUpdateTasks(taskIds, updates);
  }

  // Project operations
  async getProjects() {
    logger.info('🔐 ApiService: Getting projects through business logic layer', { component: 'ApiService', operation: 'apiservice:GettingProjects' });
    return await projectService.getAllProjects();
  }

  async getProject(id: string) {
    logger.info('🔐 ApiService: Getting project through business logic layer', { component: 'ApiService', operation: 'apiservice:GettingProject' });
    return await projectService.getProject(id);
  }

  async createProject(projectData: any) {
    logger.info('🔐 ApiService: Creating project through business logic layer', { component: 'ApiService', operation: 'apiservice:CreatingProject' });
    return await projectService.createProject(projectData);
  }

  async updateProject(id: string, updates: any) {
    logger.info('🔐 ApiService: Updating project through business logic layer', { component: 'ApiService', operation: 'apiservice:UpdatingProject' });
    return await projectService.updateProject(id, updates);
  }

  async deleteProject(id: string) {
    logger.info('🔐 ApiService: Deleting project through business logic layer', { component: 'ApiService', operation: 'apiservice:DeletingProject' });
    return await projectService.deleteProject(id);
  }

  async archiveProject(id: string) {
    logger.info('🔐 ApiService: Archiving project through business logic layer', { component: 'ApiService', operation: 'apiservice:ArchivingProject' });
    return await projectService.archiveProject(id);
  }

  async unarchiveProject(id: string) {
    logger.info('🔐 ApiService: Unarchiving project through business logic layer', { component: 'ApiService', operation: 'apiservice:UnarchivingProject' });
    return await projectService.unarchiveProject(id);
  }

  async getProjectStats(id: string) {
    logger.info('🔐 ApiService: Getting project statistics through business logic layer', { component: 'ApiService', operation: 'apiservice:GettingProject' });
    return await projectService.getProjectStats(id);
  }

  // Journal operations
  async getJournalEntries() {
    logger.info('🔐 ApiService: Getting journal entries through business logic layer', { component: 'ApiService', operation: 'apiservice:GettingJournal' });
    return await journalService.getAllJournalEntries();
  }

  async createJournalEntry(entryData: any) {
    logger.info('🔐 ApiService: Creating journal entry through business logic layer', { component: 'ApiService', operation: 'apiservice:CreatingJournal' });
    return await journalService.createJournalEntry(entryData);
  }

  async updateJournalEntry(id: string, updates: any) {
    logger.info('🔐 ApiService: Updating journal entry through business logic layer', { component: 'ApiService', operation: 'apiservice:UpdatingJournal' });
    return await journalService.updateJournalEntry(id, updates);
  }

  async deleteJournalEntry(id: string) {
    logger.info('🔐 ApiService: Deleting journal entry through business logic layer', { component: 'ApiService', operation: 'apiservice:DeletingJournal' });
    return await journalService.deleteJournalEntry(id);
  }

  async pinJournalEntry(id: string) {
    logger.info('🔐 ApiService: Pinning journal entry through business logic layer', { component: 'ApiService', operation: 'apiservice:PinningJournal' });
    return await journalService.pinJournalEntry(id);
  }

  async unpinJournalEntry(id: string) {
    logger.info('🔐 ApiService: Unpinning journal entry through business logic layer', { component: 'ApiService', operation: 'apiservice:UnpinningJournal' });
    return await journalService.unpinJournalEntry(id);
  }

  async getJournalEntriesByDateRange(startDate: string, endDate: string) {
    logger.info('🔐 ApiService: Getting journal entries by date range through business logic layer', { component: 'ApiService', operation: 'apiservice:GettingJournal' });
    return await journalService.getJournalEntriesByDateRange(startDate, endDate);
  }

  async getJournalStats() {
    logger.info('🔐 ApiService: Getting journal statistics through business logic layer', { component: 'ApiService', operation: 'apiservice:GettingJournal' });
    return await journalService.getJournalStats();
  }

  // Database management operations (still needed for system-level operations)
  async initializeDatabase() {
    try {
      logger.info('🔐 ApiService: Initializing database', { component: 'ApiService', operation: 'apiservice:InitializingDatabase' });
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      return { success: true, error: null };
    } catch (error) {
      logger.error('❌ ApiService: Database initialization failed:', { component: 'ApiService', operation: 'apiservice:DatabaseInitialization' }, error as Error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Database initialization failed' 
      };
    }
  }

  async testDatabaseConnection() {
    try {
      logger.info('🔐 ApiService: Testing database connection', { component: 'ApiService', operation: 'apiservice:TestingDatabase' });
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      const isConnected = await sqliteService.testConnection();
      return { success: isConnected, error: isConnected ? null : 'Connection failed' };
    } catch (error) {
      logger.error('❌ ApiService: Database connection test failed:', { component: 'ApiService', operation: 'apiservice:DatabaseConnection' }, error as Error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection test failed' 
      };
    }
  }

  async getDatabaseStats() {
    try {
      logger.info('🔐 ApiService: Getting database statistics', { component: 'ApiService', operation: 'apiservice:GettingDatabase' });
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      const stats = sqliteService.getStatistics();
      return { success: true, data: stats, error: null };
    } catch (error) {
      logger.error('❌ ApiService: Failed to get database statistics:', { component: 'ApiService', operation: 'apiservice:FailedGet' }, error as Error);
      return { 
        success: false, 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to get statistics' 
      };
    }
  }

  async backupDatabase(backupPath?: string) {
    try {
      logger.info('🔐 ApiService: Creating database backup', { component: 'ApiService', operation: 'apiservice:CreatingDatabase' });
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      const path = await sqliteService.backup(backupPath);
      return { success: true, path, error: null };
    } catch (error) {
      logger.error('❌ ApiService: Database backup failed:', { component: 'ApiService', operation: 'apiservice:DatabaseBackup' }, error as Error);
      return { 
        success: false, 
        path: null, 
        error: error instanceof Error ? error.message : 'Backup failed' 
      };
    }
  }

  async exportAllData() {
    try {
      logger.info('🔐 ApiService: Exporting all data', { component: 'ApiService', operation: 'apiservice:ExportingAll' });
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      const data = await sqliteService.exportAllData();
      return { success: true, data, error: null };
    } catch (error) {
      logger.error('❌ ApiService: Data export failed:', { component: 'ApiService', operation: 'apiservice:DataExport' }, error as Error);
      return { 
        success: false, 
        data: null, 
        error: error instanceof Error ? error.message : 'Export failed' 
      };
    }
  }

  async importFromLocalStorage(data: any) {
    try {
      logger.info('🔐 ApiService: Importing data from localStorage', { component: 'ApiService', operation: 'apiservice:ImportingData' });
      
      // Business logic: Validate import data structure
      if (!data || typeof data !== 'object') {
        return { success: false, error: 'Invalid import data format' };
      }
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      const result = await sqliteService.importFromLocalStorage(data);
      return { success: true, result, error: null };
    } catch (error) {
      logger.error('❌ ApiService: Data import failed:', { component: 'ApiService', operation: 'apiservice:DataImport' }, error as Error);
      return { 
        success: false, 
        result: null, 
        error: error instanceof Error ? error.message : 'Import failed' 
      };
    }
  }

  // Analytics and insights operations
  async getProductivityInsights() {
    try {
      logger.info('🔐 ApiService: Getting productivity insights', { component: 'ApiService', operation: 'apiservice:GettingProductivity' });
      
      // Combine data from multiple services for comprehensive insights
      const [tasksResult, projectsResult, journalResult] = await Promise.all([
        this.getTasks(),
        this.getProjects(),
        this.getJournalEntries()
      ]);
      
      if (!tasksResult.success || !projectsResult.success || !journalResult.success) {
        return { 
          success: false, 
          error: 'Failed to retrieve data for insights' 
        };
      }
      
      const tasks = tasksResult.data || [];
      const projects = projectsResult.data || [];
      const journalEntries = journalResult.data || [];
      
      // Calculate insights
      const insights = {
        overview: {
          totalTasks: tasks.length,
          completedTasks: tasks.filter((task: any) => task.completed).length,
          activeProjects: projects.filter((project: any) => !project.archived).length,
          journalEntries: journalEntries.length
        },
        productivity: {
          completionRate: tasks.length > 0 
            ? Math.round((tasks.filter((task: any) => task.completed).length / tasks.length) * 100)
            : 0,
          averageTasksPerProject: projects.length > 0 
            ? Math.round(tasks.length / projects.length)
            : 0,
          highPriorityTasksRemaining: tasks.filter((task: any) => 
            task.priority === 'high' && !task.completed
          ).length
        },
        trends: {
          recentlyCreated: tasks.filter((task: any) => {
            const taskDate = new Date(task.createdAt);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return taskDate > weekAgo;
          }).length,
          recentlyCompleted: tasks.filter((task: any) => {
            if (!task.completed || !task.updatedAt) return false;
            const updateDate = new Date(task.updatedAt);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return updateDate > weekAgo;
          }).length
        }
      };
      
      return { success: true, data: insights };
    } catch (error) {
      logger.error('❌ ApiService: Failed to get productivity insights:', { component: 'ApiService', operation: 'apiservice:FailedGet' }, error as Error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get insights' 
      };
    }
  }
}

export const apiService = new ApiService();