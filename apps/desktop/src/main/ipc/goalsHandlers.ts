import { ipcMain } from 'electron';
import { goalService } from '../services/GoalService';
import { logger } from '@serenity/core';

export function registerGoalHandlers(): void {
  ipcMain.handle('goals:get', async () => {
    return await goalService.getAllGoals();
  });

  ipcMain.handle('goals:create-with-id', async (_event, goal) => {
    return await goalService.createGoal(goal);
  });

  ipcMain.handle('goals:update', async (_event, id: string, updates: any) => {
    return await goalService.updateGoal(id, updates);
  });

  ipcMain.handle('goals:delete', async (_event, id: string) => {
    return await goalService.deleteGoal(id);
  });
}

/**
 * Helper function to query goals for AI analysis
 */
export async function queryGoalsIPC() {
  try {
    logger.info('🔐 Querying goals for AI analysis...', { component: 'goalsHandlers', operation: 'queryingGoalsFor' });
    return await goalService.getAllGoals();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to query goals';
    return { success: false, data: null, error: errorMessage };
  }
}

