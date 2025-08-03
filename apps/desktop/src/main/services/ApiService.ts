/**
 * Main API Service
 * Provides intent-based business operations instead of direct database access
 * Implements security and validation layers
 */

import { taskService } from './TaskService';
import { projectService } from './ProjectService';
import { journalService } from './JournalService';

export class ApiService {
  // Task operations
  async getTasks() {
    console.log('🔐 ApiService: Getting tasks through business logic layer');
    return await taskService.getAllTasks();
  }

  async createTask(taskData: any) {
    console.log('🔐 ApiService: Creating task through business logic layer');
    return await taskService.createTask(taskData);
  }

  async updateTask(id: string, updates: any) {
    console.log('🔐 ApiService: Updating task through business logic layer');
    return await taskService.updateTask(id, updates);
  }

  async deleteTask(id: string) {
    console.log('🔐 ApiService: Deleting task through business logic layer');
    return await taskService.deleteTask(id);
  }

  async completeTask(id: string) {
    console.log('🔐 ApiService: Completing task through business logic layer');
    return await taskService.completeTask(id);
  }

  async bulkUpdateTasks(taskIds: string[], updates: any) {
    console.log('🔐 ApiService: Bulk updating tasks through business logic layer');
    return await taskService.bulkUpdateTasks(taskIds, updates);
  }

  // Project operations
  async getProjects() {
    console.log('🔐 ApiService: Getting projects through business logic layer');
    return await projectService.getAllProjects();
  }

  async getProject(id: string) {
    console.log('🔐 ApiService: Getting project through business logic layer');
    return await projectService.getProject(id);
  }

  async createProject(projectData: any) {
    console.log('🔐 ApiService: Creating project through business logic layer');
    return await projectService.createProject(projectData);
  }

  async updateProject(id: string, updates: any) {
    console.log('🔐 ApiService: Updating project through business logic layer');
    return await projectService.updateProject(id, updates);
  }

  async deleteProject(id: string) {
    console.log('🔐 ApiService: Deleting project through business logic layer');
    return await projectService.deleteProject(id);
  }

  async archiveProject(id: string) {
    console.log('🔐 ApiService: Archiving project through business logic layer');
    return await projectService.archiveProject(id);
  }

  async unarchiveProject(id: string) {
    console.log('🔐 ApiService: Unarchiving project through business logic layer');
    return await projectService.unarchiveProject(id);
  }

  async getProjectStats(id: string) {
    console.log('🔐 ApiService: Getting project statistics through business logic layer');
    return await projectService.getProjectStats(id);
  }

  // Journal operations
  async getJournalEntries() {
    console.log('🔐 ApiService: Getting journal entries through business logic layer');
    return await journalService.getAllJournalEntries();
  }

  async createJournalEntry(entryData: any) {
    console.log('🔐 ApiService: Creating journal entry through business logic layer');
    return await journalService.createJournalEntry(entryData);
  }

  async updateJournalEntry(id: string, updates: any) {
    console.log('🔐 ApiService: Updating journal entry through business logic layer');
    return await journalService.updateJournalEntry(id, updates);
  }

  async deleteJournalEntry(id: string) {
    console.log('🔐 ApiService: Deleting journal entry through business logic layer');
    return await journalService.deleteJournalEntry(id);
  }

  async pinJournalEntry(id: string) {
    console.log('🔐 ApiService: Pinning journal entry through business logic layer');
    return await journalService.pinJournalEntry(id);
  }

  async unpinJournalEntry(id: string) {
    console.log('🔐 ApiService: Unpinning journal entry through business logic layer');
    return await journalService.unpinJournalEntry(id);
  }

  async getJournalEntriesByDateRange(startDate: string, endDate: string) {
    console.log('🔐 ApiService: Getting journal entries by date range through business logic layer');
    return await journalService.getJournalEntriesByDateRange(startDate, endDate);
  }

  async getJournalStats() {
    console.log('🔐 ApiService: Getting journal statistics through business logic layer');
    return await journalService.getJournalStats();
  }

  // Database management operations (still needed for system-level operations)
  async initializeDatabase() {
    try {
      console.log('🔐 ApiService: Initializing database');
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      return { success: true, error: null };
    } catch (error) {
      console.error('❌ ApiService: Database initialization failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Database initialization failed' 
      };
    }
  }

  async testDatabaseConnection() {
    try {
      console.log('🔐 ApiService: Testing database connection');
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      const isConnected = await sqliteService.testConnection();
      return { success: isConnected, error: isConnected ? null : 'Connection failed' };
    } catch (error) {
      console.error('❌ ApiService: Database connection test failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection test failed' 
      };
    }
  }

  async getDatabaseStats() {
    try {
      console.log('🔐 ApiService: Getting database statistics');
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      const stats = sqliteService.getStatistics();
      return { success: true, data: stats, error: null };
    } catch (error) {
      console.error('❌ ApiService: Failed to get database statistics:', error);
      return { 
        success: false, 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to get statistics' 
      };
    }
  }

  async backupDatabase(backupPath?: string) {
    try {
      console.log('🔐 ApiService: Creating database backup');
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      const path = await sqliteService.backup(backupPath);
      return { success: true, path, error: null };
    } catch (error) {
      console.error('❌ ApiService: Database backup failed:', error);
      return { 
        success: false, 
        path: null, 
        error: error instanceof Error ? error.message : 'Backup failed' 
      };
    }
  }

  async exportAllData() {
    try {
      console.log('🔐 ApiService: Exporting all data');
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      const data = await sqliteService.exportAllData();
      return { success: true, data, error: null };
    } catch (error) {
      console.error('❌ ApiService: Data export failed:', error);
      return { 
        success: false, 
        data: null, 
        error: error instanceof Error ? error.message : 'Export failed' 
      };
    }
  }

  async importFromLocalStorage(data: any) {
    try {
      console.log('🔐 ApiService: Importing data from localStorage');
      
      // Business logic: Validate import data structure
      if (!data || typeof data !== 'object') {
        return { success: false, error: 'Invalid import data format' };
      }
      
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      const result = await sqliteService.importFromLocalStorage(data);
      return { success: true, result, error: null };
    } catch (error) {
      console.error('❌ ApiService: Data import failed:', error);
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
      console.log('🔐 ApiService: Getting productivity insights');
      
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
      console.error('❌ ApiService: Failed to get productivity insights:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get insights' 
      };
    }
  }
}

export const apiService = new ApiService();