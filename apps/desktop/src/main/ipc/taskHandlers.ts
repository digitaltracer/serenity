/**
 * Task-related IPC handlers
 * Handles all task operations through the business logic layer
 */

import { ipcMain } from 'electron';
import { z } from 'zod';
import { TaskSchema } from '@serenity/core';
import { apiService } from '../services/ApiService';

export function registerTaskHandlers(): void {
  console.log('🔧 Registering task IPC handlers...');

  // Task operations through business logic
  ipcMain.handle('tasks:get', async () => {
    try {
      console.log('🔐 Getting tasks through business layer...');
      return await apiService.getTasks();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get tasks';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('tasks:create', async (_, task) => {
    try {
      console.log('🔐 Creating task through business layer...');
      const validated = TaskSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(task);
      return await apiService.createTask(validated);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('tasks:create-with-id', async (_, task) => {
    try {
      console.log('🔐 Creating task with ID through business layer...');
      const validated = TaskSchema.parse(task);
      return await apiService.createTask(validated);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task with ID';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('tasks:update', async (_, id, updates) => {
    try {
      console.log('🔐 Updating task through business layer...');
      z.string().min(1).parse(id);
      const validatedUpdates = TaskSchema.partial().parse(updates);
      return await apiService.updateTask(id, validatedUpdates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('tasks:delete', async (_, id) => {
    try {
      console.log('🔐 Deleting task through business layer...');
      z.string().min(1).parse(id);
      return await apiService.deleteTask(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      return { success: false, data: false, error: errorMessage };
    }
  });

  // Additional task business operations
  ipcMain.handle('tasks:complete', async (_, id) => {
    try {
      console.log('🔐 Completing task through business layer...');
      z.string().min(1).parse(id);
      return await apiService.completeTask(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete task';
      return { success: false, data: null, error: errorMessage };
    }
  });

  ipcMain.handle('tasks:bulk-update', async (_, taskIds, updates) => {
    try {
      console.log('🔐 Bulk updating tasks through business layer...');
      const ids = z.array(z.string().min(1)).nonempty().parse(taskIds);
      const validatedUpdates = TaskSchema.partial().parse(updates);
      return await apiService.bulkUpdateTasks(ids, validatedUpdates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update tasks';
      return { success: false, data: null, error: errorMessage };
    }
  });

  console.log('✅ Task IPC handlers registered');
}

/**
 * Helper function to query tasks for AI analysis
 */
export async function queryTasksIPC() {
  try {
    console.log('🔐 Querying tasks for AI analysis...');
    return await apiService.getTasks();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to query tasks';
    return { success: false, data: null, error: errorMessage };
  }
}
