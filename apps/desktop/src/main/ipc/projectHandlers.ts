/**
 * Project-related IPC handlers
 * Handles all project operations through the business logic layer
 */

import { ipcMain } from 'electron';
import { apiService } from '../services/ApiService';

export function registerProjectHandlers(): void {
  console.log('🔧 Registering project IPC handlers...');

  // Project operations through business logic
  ipcMain.handle('projects:get', async () => {
    try {
      console.log('🔐 Getting projects through business layer...');
      return await apiService.getProjects();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get projects';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('projects:get-single', async (_, id) => {
    try {
      console.log('🔐 Getting single project through business layer...');
      return await apiService.getProject(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get project';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('projects:create', async (_, project) => {
    try {
      console.log('🔐 Creating project through business layer...');
      return await apiService.createProject(project);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('projects:create-with-id', async (_, project) => {
    try {
      console.log('🔐 Creating project with ID through business layer:', project.name, project.id);
      // Business layer will handle ID assignment validation
      return await apiService.createProject(project);
    } catch (error) {
      console.error('❌ Business layer: Project creation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project with ID';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('projects:update', async (_, id, updates) => {
    try {
      console.log('🔐 Updating project through business layer...');
      return await apiService.updateProject(id, updates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('projects:delete', async (_, id) => {
    try {
      console.log('🔐 Deleting project through business layer...');
      return await apiService.deleteProject(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
      return { success: false, data: false, error: errorMessage };
    }
  });

  // Additional project business operations
  ipcMain.handle('projects:archive', async (_, id) => {
    try {
      console.log('🔐 Archiving project through business layer...');
      return await apiService.archiveProject(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to archive project';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('projects:unarchive', async (_, id) => {
    try {
      console.log('🔐 Unarchiving project through business layer...');
      return await apiService.unarchiveProject(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unarchive project';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('projects:get-stats', async (_, id) => {
    try {
      console.log('🔐 Getting project stats through business layer...');
      return await apiService.getProjectStats(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get project stats';
      return { success: false, data: null, error: errorMessage };
    }
  });

  console.log('✅ Project IPC handlers registered');
}