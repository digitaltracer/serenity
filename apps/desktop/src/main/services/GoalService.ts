/**
 * Goal Business Logic Service
 */

import type { Goal } from '@serenity/core';

export class GoalService {
  private sqliteService: any = null;

  private async getSqliteService() {
    if (!this.sqliteService) {
      const { sqliteService } = await import('@serenity/database');
      this.sqliteService = sqliteService;
      await this.sqliteService.initialize();
    }
    return this.sqliteService;
  }

  async getAllGoals() {
    try {
      const service = await this.getSqliteService();
      const goals: Goal[] = await service.getGoals();
      return { success: true, data: goals };
    } catch (error) {
      console.error('GoalService: Failed to get goals:', error);
      return { success: false, error: 'Failed to get goals' };
    }
  }

  async createGoal(goal: Goal) {
    try {
      const service = await this.getSqliteService();
      const created = await service.createGoalWithId(goal);
      return { success: true, data: created };
    } catch (error) {
      console.error('GoalService: Failed to create goal:', error);
      return { success: false, error: 'Failed to create goal' };
    }
  }

  async updateGoal(id: string, updates: Partial<Goal>) {
    try {
      const service = await this.getSqliteService();
      const updated = await service.updateGoal(id, updates);
      return { success: true, data: updated };
    } catch (error) {
      console.error('GoalService: Failed to update goal:', error);
      return { success: false, error: 'Failed to update goal' };
    }
  }

  async deleteGoal(id: string) {
    try {
      const service = await this.getSqliteService();
      const ok = await service.deleteGoal(id);
      return { success: ok };
    } catch (error) {
      console.error('GoalService: Failed to delete goal:', error);
      return { success: false, error: 'Failed to delete goal' };
    }
  }
}

export const goalService = new GoalService();

