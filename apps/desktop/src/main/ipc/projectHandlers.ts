/**
 * Project-related IPC handlers
 * Handles all project operations through the business logic layer
 */

import { ipcMain } from 'electron';
import { z } from 'zod';
import { ProjectSchema } from '@serenity/core';
import { apiService } from '../services/ApiService';
import { logger } from '@serenity/core';

export function registerProjectHandlers(): void {
  logger.info('🔧 Registering project IPC handlers...', { component: 'projectHandlers', operation: 'registeringProjectIpc' });

  // Project operations through business logic
  ipcMain.handle('projects:get', async () => {
    try {
      logger.info('🔐 Getting projects through business layer...', { component: 'projectHandlers', operation: 'gettingProjectsThrough' });
      return await apiService.getProjects();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get projects';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('projects:get-single', async (_, id) => {
    try {
      logger.info('🔐 Getting single project through business layer...', { component: 'projectHandlers', operation: 'gettingSingleProject' });
      z.string().min(1).parse(id);
      return await apiService.getProject(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get project';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('projects:create', async (_, project) => {
    try {
      logger.info('🔐 Creating project through business layer...', { component: 'projectHandlers', operation: 'creatingProjectThrough' });
      const validated = ProjectSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(project);
      return await apiService.createProject(validated);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('projects:create-with-id', async (_, project) => {
    try {
      logger.info('🔐 Creating project with ID through business layer:', {  component: 'projectHandlers', operation: 'creatingProjectWith' , metadata: { data1: project.name, data2: project.id } });
      const validated = ProjectSchema.parse(project);
      return await apiService.createProject(validated);
    } catch (error) {
      logger.error('❌ Business layer: Project creation failed:', { component: 'projectHandlers', operation: 'businessLayer:Project' }, error as Error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project with ID';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('projects:update', async (_, id, updates) => {
    try {
      logger.info('🔐 Updating project through business layer...', { component: 'projectHandlers', operation: 'updatingProjectThrough' });
      z.string().min(1).parse(id);
      const validatedUpdates = ProjectSchema.partial().parse(updates);
      return await apiService.updateProject(id, validatedUpdates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('projects:delete', async (_, id) => {
    try {
      logger.info('🔐 Deleting project through business layer...', { component: 'projectHandlers', operation: 'deletingProjectThrough' });
      z.string().min(1).parse(id);
      return await apiService.deleteProject(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
      return { success: false, data: false, error: errorMessage };
    }
  });

  // Additional project business operations
  ipcMain.handle('projects:archive', async (_, id) => {
    try {
      logger.info('🔐 Archiving project through business layer...', { component: 'projectHandlers', operation: 'archivingProjectThrough' });
      z.string().min(1).parse(id);
      return await apiService.archiveProject(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to archive project';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('projects:unarchive', async (_, id) => {
    try {
      logger.info('🔐 Unarchiving project through business layer...', { component: 'projectHandlers', operation: 'unarchivingProjectThrough' });
      z.string().min(1).parse(id);
      return await apiService.unarchiveProject(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unarchive project';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('projects:get-stats', async (_, id) => {
    try {
      logger.info('🔐 Getting project stats through business layer...', { component: 'projectHandlers', operation: 'gettingProjectStats' });
      z.string().min(1).parse(id);
      return await apiService.getProjectStats(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get project stats';
      return { success: false, data: null, error: errorMessage };
    }
  });

  logger.info('✅ Project IPC handlers registered', { component: 'projectHandlers', operation: 'projectIpcHandlers' });
}
