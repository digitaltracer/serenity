import { db } from '../utils/pool.js';
import logger from '../utils/logger.js';
import { NotFoundError, ValidationError, DatabaseError } from '../utils/errors.js';
import type { Goal } from '../types/index.js';

export interface CreateGoalData {
  title: string;
  description?: string;
  type: 'weekly_tasks' | 'project_tasks' | 'priority_tasks' | 'daily_streak' | 'journal_weekly' | 'completion_rate';
  config: {
    targetCount?: number;
    projectId?: string;
    priority?: 'high' | 'medium' | 'low';
    streakDays?: number;
    targetRate?: number;
    timeframe: 'daily' | 'weekly' | 'monthly';
  };
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdateGoalData {
  title?: string;
  description?: string;
  config?: Record<string, any>;
  status?: 'active' | 'completed' | 'paused' | 'failed';
  priority?: 'low' | 'medium' | 'high';
}

export interface GoalFilters {
  status?: 'active' | 'completed' | 'paused' | 'failed';
  type?: string;
  limit?: number;
  offset?: number;
}

/**
 * Goal Service
 * Uses shared database pool for database operations
 */
export class GoalService {
  constructor() {
    // No initialization needed - uses shared pool
  }

  /**
   * Get goals for a user with optional filters
   */
  async getGoals(userId: string, filters?: GoalFilters): Promise<Goal[]> {
    logger.info('Getting goals', { userId, filters });

    try {
      let query = `
        SELECT
          id,
          user_id as "userId",
          title,
          description,
          type,
          config,
          progress,
          status,
          priority,
          reminders,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM goals
        WHERE user_id = $1
      `;

      const params: any[] = [userId];
      let paramIndex = 2;

      // Apply filters
      if (filters?.status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(filters.status);
      }

      if (filters?.type) {
        query += ` AND type = $${paramIndex++}`;
        params.push(filters.type);
      }

      query += ` ORDER BY created_at DESC`;

      if (filters?.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      if (filters?.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(filters.offset);
      }

      const result = await db.query(query, params);

      logger.info('Goals retrieved successfully', {
        userId,
        count: result.rows.length,
      });

      return result.rows as Goal[];
    } catch (error) {
      logger.error('Failed to get goals', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        filters,
      });
      throw new DatabaseError('Failed to retrieve goals');
    }
  }

  /**
   * Get a single goal by ID
   */
  async getGoalById(userId: string, goalId: string): Promise<Goal | null> {
    logger.info('Getting goal by ID', { userId, goalId });

    try {
      const query = `
        SELECT
          id,
          user_id as "userId",
          title,
          description,
          type,
          config,
          progress,
          status,
          priority,
          reminders,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM goals
        WHERE id = $1 AND user_id = $2
      `;

      const result = await db.query(query, [goalId, userId]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as Goal;
    } catch (error) {
      logger.error('Failed to get goal by ID', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        goalId,
      });
      throw new DatabaseError('Failed to retrieve goal');
    }
  }

  /**
   * Create a new goal
   */
  async createGoal(userId: string, data: CreateGoalData): Promise<Goal> {
    logger.info('Creating goal', { userId, title: data.title });

    try {
      // Initialize progress based on goal type and config
      const now = new Date();
      const progress = {
        current: 0,
        target: data.config.targetCount || data.config.targetRate || data.config.streakDays || 0,
        percentage: 0,
        isCompleted: false,
        periodStart: now,
        periodEnd: this.calculatePeriodEnd(now, data.config.timeframe),
      };

      const goalResult = await db.query(
        `INSERT INTO goals (
          user_id, title, description, type, config, progress, status, priority, reminders
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING
          id,
          user_id as "userId",
          title,
          description,
          type,
          config,
          progress,
          status,
          priority,
          reminders,
          created_at as "createdAt",
          updated_at as "updatedAt"`,
        [
          userId,
          data.title,
          data.description || null,
          data.type,
          JSON.stringify(data.config),
          JSON.stringify(progress),
          'active',
          data.priority || 'medium',
          JSON.stringify([]),
        ]
      );

      const goal = goalResult.rows[0] as Goal;

      logger.info('Goal created successfully', { goalId: goal.id });
      return goal;
    } catch (error) {
      logger.error('Failed to create goal', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        data,
      });
      throw new DatabaseError('Failed to create goal');
    }
  }

  /**
   * Update an existing goal
   */
  async updateGoal(userId: string, goalId: string, data: UpdateGoalData): Promise<Goal> {
    logger.info('Updating goal', { userId, goalId, data });

    try {
      // Verify ownership
      const ownershipCheck = await db.query(
        `SELECT id FROM goals WHERE id = $1 AND user_id = $2`,
        [goalId, userId]
      );

      if (ownershipCheck.rows.length === 0) {
        throw new NotFoundError('Goal not found or access denied');
      }

      // Build dynamic update query
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        values.push(data.title);
      }

      if (data.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }

      if (data.config !== undefined) {
        updates.push(`config = $${paramIndex++}`);
        values.push(JSON.stringify(data.config));
      }

      if (data.status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(data.status);
      }

      if (data.priority !== undefined) {
        updates.push(`priority = $${paramIndex++}`);
        values.push(data.priority);
      }

      if (updates.length === 0) {
        throw new ValidationError('No fields to update');
      }

      updates.push(`updated_at = NOW()`);
      values.push(goalId);

      const query = `
        UPDATE goals
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING
          id,
          user_id as "userId",
          title,
          description,
          type,
          config,
          progress,
          status,
          priority,
          reminders,
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      const result = await db.query(query, values);

      logger.info('Goal updated successfully', { goalId });
      return result.rows[0] as Goal;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Failed to update goal', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        goalId,
        data,
      });
      throw new DatabaseError('Failed to update goal');
    }
  }

  /**
   * Track progress for a goal
   * This updates the progress field and calculates completion percentage
   */
  async trackProgress(userId: string, goalId: string, current: number): Promise<Goal> {
    logger.info('Tracking goal progress', { userId, goalId, current });

    try {
      // Get current goal
      const goal = await this.getGoalById(userId, goalId);
      if (!goal) {
        throw new NotFoundError('Goal not found');
      }

      // Update progress
      const updatedProgress = {
        ...goal.progress,
        current,
        percentage: Math.min(100, Math.round((current / goal.progress.target) * 100)),
        isCompleted: current >= goal.progress.target,
      };

      const result = await db.query(
        `UPDATE goals
         SET progress = $1,
             status = $2,
             updated_at = NOW()
         WHERE id = $3 AND user_id = $4
         RETURNING
           id,
           user_id as "userId",
           title,
           description,
           type,
           config,
           progress,
           status,
           priority,
           reminders,
           created_at as "createdAt",
           updated_at as "updatedAt"`,
        [
          JSON.stringify(updatedProgress),
          updatedProgress.isCompleted ? 'completed' : goal.status,
          goalId,
          userId,
        ]
      );

      logger.info('Goal progress tracked successfully', { goalId });
      return result.rows[0] as Goal;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to track goal progress', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        goalId,
        current,
      });
      throw new DatabaseError('Failed to track goal progress');
    }
  }

  /**
   * Delete a goal
   */
  async deleteGoal(userId: string, goalId: string): Promise<void> {
    logger.info('Deleting goal', { userId, goalId });

    try {
      const result = await db.query(
        `DELETE FROM goals
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [goalId, userId]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Goal not found or access denied');
      }

      logger.info('Goal deleted successfully', { goalId });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to delete goal', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        goalId,
      });
      throw new DatabaseError('Failed to delete goal');
    }
  }

  /**
   * Calculate period end date based on timeframe
   */
  private calculatePeriodEnd(start: Date, timeframe: 'daily' | 'weekly' | 'monthly'): Date {
    const end = new Date(start);
    switch (timeframe) {
      case 'daily':
        end.setDate(end.getDate() + 1);
        break;
      case 'weekly':
        end.setDate(end.getDate() + 7);
        break;
      case 'monthly':
        end.setMonth(end.getMonth() + 1);
        break;
    }
    return end;
  }
}

// Export singleton instance
export const goalService = new GoalService();
