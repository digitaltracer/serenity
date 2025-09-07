import { ipcMain } from 'electron';
import { goalService } from '../services/GoalService';

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

