import { PostgresAdapter } from '@serenity/database';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';
import { NotFoundError, ValidationError, DatabaseError } from '../utils/errors.js';
import type {
  Task,
  Subtask,
  CreateTaskData,
  UpdateTaskData,
  TaskFilters,
} from '../types/index.js';

// Extend Task interface to include subtasks
export interface TaskWithSubtasks extends Task {
  subtasks?: Subtask[];
}

/**
 * Task Service
 * Uses PostgresAdapter from @serenity/database for database operations
 */
export class TaskService {
  private adapter: PostgresAdapter;

  constructor() {
    this.adapter = new PostgresAdapter({
      connectionString: config.databaseUrl,
    });
  }

  /**
   * Get tasks for a user with optional filters
   */
  async getTasks(userId: string, filters?: TaskFilters): Promise<TaskWithSubtasks[]> {
    logger.info('Getting tasks', { userId, filters });

    try {
      let query = `
        SELECT
          t.id,
          t.user_id as "userId",
          t.title,
          t.description,
          t.completed,
          t.priority,
          t.due_date as "dueDate",
          t.project_id as "projectId",
          t.tags,
          t.order_index as "order",
          t.created_at as "createdAt",
          t.updated_at as "updatedAt",
          t.completed_at as "completedAt",
          COALESCE(
            json_agg(
              json_build_object(
                'id', s.id,
                'taskId', s.task_id,
                'title', s.title,
                'completed', s.completed,
                'order', s.order_index,
                'createdAt', s.created_at,
                'updatedAt', s.updated_at
              )
              ORDER BY s.order_index
            ) FILTER (WHERE s.id IS NOT NULL),
            '[]'
          ) as subtasks
        FROM tasks t
        LEFT JOIN subtasks s ON s.task_id = t.id
        WHERE t.user_id = $1
      `;

      const params: any[] = [userId];
      let paramIndex = 2;

      // Apply filters
      if (filters?.filter === 'active') {
        query += ` AND t.completed = false`;
      } else if (filters?.filter === 'completed') {
        query += ` AND t.completed = true`;
      }

      if (filters?.priority) {
        query += ` AND t.priority = $${paramIndex++}`;
        params.push(filters.priority);
      }

      if (filters?.projectId) {
        query += ` AND t.project_id = $${paramIndex++}`;
        params.push(filters.projectId);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query += ` AND t.tags && $${paramIndex++}`;
        params.push(filters.tags);
      }

      if (filters?.search) {
        query += ` AND (
          t.title ILIKE $${paramIndex} OR
          t.description ILIKE $${paramIndex}
        )`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      if (filters?.dueDateFrom) {
        query += ` AND t.due_date >= $${paramIndex++}`;
        params.push(filters.dueDateFrom);
      }

      if (filters?.dueDateTo) {
        query += ` AND t.due_date <= $${paramIndex++}`;
        params.push(filters.dueDateTo);
      }

      query += ` GROUP BY t.id ORDER BY t.order_index ASC, t.created_at DESC`;

      if (filters?.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      if (filters?.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(filters.offset);
      }

      const result = await this.adapter.query(query, params);

      logger.info('Tasks retrieved successfully', {
        userId,
        count: result.rows.length,
      });

      return result.rows as TaskWithSubtasks[];
    } catch (error) {
      logger.error('Failed to get tasks', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        filters,
      });
      throw new DatabaseError('Failed to retrieve tasks');
    }
  }

  /**
   * Get a single task by ID
   */
  async getTaskById(userId: string, taskId: string): Promise<TaskWithSubtasks | null> {
    logger.info('Getting task by ID', { userId, taskId });

    try {
      const query = `
        SELECT
          t.id,
          t.user_id as "userId",
          t.title,
          t.description,
          t.completed,
          t.priority,
          t.due_date as "dueDate",
          t.project_id as "projectId",
          t.tags,
          t.order_index as "order",
          t.created_at as "createdAt",
          t.updated_at as "updatedAt",
          t.completed_at as "completedAt",
          COALESCE(
            json_agg(
              json_build_object(
                'id', s.id,
                'taskId', s.task_id,
                'title', s.title,
                'completed', s.completed,
                'order', s.order_index,
                'createdAt', s.created_at,
                'updatedAt', s.updated_at
              )
              ORDER BY s.order_index
            ) FILTER (WHERE s.id IS NOT NULL),
            '[]'
          ) as subtasks
        FROM tasks t
        LEFT JOIN subtasks s ON s.task_id = t.id
        WHERE t.id = $1 AND t.user_id = $2
        GROUP BY t.id
      `;

      const result = await this.adapter.query(query, [taskId, userId]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as TaskWithSubtasks;
    } catch (error) {
      logger.error('Failed to get task by ID', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        taskId,
      });
      throw new DatabaseError('Failed to retrieve task');
    }
  }

  /**
   * Create a new task
   */
  async createTask(userId: string, data: CreateTaskData): Promise<Task> {
    logger.info('Creating task', { userId, title: data.title });

    try {
      // Get next order value
      const orderResult = await this.adapter.query(
        `SELECT COALESCE(MAX(order_index), 0) as max_order
         FROM tasks
         WHERE user_id = $1`,
        [userId]
      );
      const nextOrder = (orderResult.rows[0]?.max_order || 0) + 1;

      // Insert task
      const taskResult = await this.adapter.query(
        `INSERT INTO tasks (
          user_id, title, description, priority,
          due_date, tags, order_index
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          id,
          user_id as "userId",
          title,
          description,
          completed,
          priority,
          due_date as "dueDate",
          project_id as "projectId",
          tags,
          order_index as "order",
          created_at as "createdAt",
          updated_at as "updatedAt",
          completed_at as "completedAt"`,
        [
          userId,
          data.title,
          data.description || null,
          data.priority || 'medium',
          data.dueDate || null,
          data.tags || [],
          nextOrder,
        ]
      );

      const task = taskResult.rows[0] as Task;

      logger.info('Task created successfully', { taskId: task.id });
      return task;
    } catch (error) {
      logger.error('Failed to create task', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        data,
      });
      throw new DatabaseError('Failed to create task');
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(userId: string, taskId: string, data: UpdateTaskData): Promise<Task> {
    logger.info('Updating task', { userId, taskId, data });

    try {
      // Verify ownership
      const ownershipCheck = await this.adapter.query(
        `SELECT id FROM tasks WHERE id = $1 AND user_id = $2`,
        [taskId, userId]
      );

      if (ownershipCheck.rows.length === 0) {
        throw new NotFoundError('Task not found or access denied');
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

      if (data.priority !== undefined) {
        updates.push(`priority = $${paramIndex++}`);
        values.push(data.priority);
      }

      if (data.dueDate !== undefined) {
        updates.push(`due_date = $${paramIndex++}`);
        values.push(data.dueDate);
      }

      if (data.projectId !== undefined) {
        updates.push(`project_id = $${paramIndex++}`);
        values.push(data.projectId);
      }

      if (data.tags !== undefined) {
        updates.push(`tags = $${paramIndex++}`);
        values.push(data.tags);
      }

      if (data.completed !== undefined) {
        updates.push(`completed = $${paramIndex++}`);
        values.push(data.completed);
        if (data.completed) {
          updates.push(`completed_at = NOW()`);
        } else {
          updates.push(`completed_at = NULL`);
        }
      }

      if (updates.length === 0) {
        throw new ValidationError('No fields to update');
      }

      updates.push(`updated_at = NOW()`);
      values.push(taskId);

      const query = `
        UPDATE tasks
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING
          id,
          user_id as "userId",
          title,
          description,
          completed,
          priority,
          due_date as "dueDate",
          project_id as "projectId",
          tags,
          order_index as "order",
          created_at as "createdAt",
          updated_at as "updatedAt",
          completed_at as "completedAt"
      `;

      const result = await this.adapter.query(query, values);

      logger.info('Task updated successfully', { taskId });
      return result.rows[0] as Task;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Failed to update task', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        taskId,
        data,
      });
      throw new DatabaseError('Failed to update task');
    }
  }

  /**
   * Complete a task
   */
  async completeTask(userId: string, taskId: string): Promise<Task> {
    logger.info('Completing task', { userId, taskId });

    try {
      const result = await this.adapter.query(
        `UPDATE tasks
         SET completed = true,
             completed_at = NOW(),
             updated_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING
           id,
           user_id as "userId",
           title,
           description,
           completed,
           priority,
           due_date as "dueDate",
           project_id as "projectId",
           tags,
           order_index as "order",
           created_at as "createdAt",
           updated_at as "updatedAt",
           completed_at as "completedAt"`,
        [taskId, userId]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Task not found or access denied');
      }

      logger.info('Task completed successfully', { taskId });
      return result.rows[0] as Task;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to complete task', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        taskId,
      });
      throw new DatabaseError('Failed to complete task');
    }
  }

  /**
   * Delete a task (soft delete if schema supports it, otherwise hard delete)
   */
  async deleteTask(userId: string, taskId: string): Promise<void> {
    logger.info('Deleting task', { userId, taskId });

    try {
      // Use hard delete since the schema doesn't have deleted_at
      const result = await this.adapter.query(
        `DELETE FROM tasks
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [taskId, userId]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Task not found or access denied');
      }

      logger.info('Task deleted successfully', { taskId });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to delete task', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        taskId,
      });
      throw new DatabaseError('Failed to delete task');
    }
  }

  /**
   * Add a subtask to a task
   */
  async addSubtask(userId: string, taskId: string, title: string): Promise<Subtask> {
    logger.info('Adding subtask', { userId, taskId, title });

    try {
      // Verify task ownership
      const taskCheck = await this.adapter.query(
        `SELECT id FROM tasks WHERE id = $1 AND user_id = $2`,
        [taskId, userId]
      );

      if (taskCheck.rows.length === 0) {
        throw new NotFoundError('Task not found or access denied');
      }

      // Get next order value for subtask
      const orderResult = await this.adapter.query(
        `SELECT COALESCE(MAX(order_index), 0) as max_order
         FROM subtasks
         WHERE task_id = $1`,
        [taskId]
      );
      const nextOrder = (orderResult.rows[0]?.max_order || 0) + 1;

      // Insert subtask
      const subtaskResult = await this.adapter.query(
        `INSERT INTO subtasks (task_id, title, order_index)
         VALUES ($1, $2, $3)
         RETURNING
           id,
           task_id as "taskId",
           title,
           completed,
           order_index as "order",
           created_at as "createdAt",
           updated_at as "updatedAt"`,
        [taskId, title, nextOrder]
      );

      const subtask = subtaskResult.rows[0] as Subtask;

      // Update parent task's updatedAt
      await this.adapter.query(
        `UPDATE tasks SET updated_at = NOW() WHERE id = $1`,
        [taskId]
      );

      logger.info('Subtask added successfully', { subtaskId: subtask.id });
      return subtask;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to add subtask', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        taskId,
        title,
      });
      throw new DatabaseError('Failed to add subtask');
    }
  }
}

// Export singleton instance
export const taskService = new TaskService();
