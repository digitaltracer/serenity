import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { taskService } from '../services/TaskService.js';
import {
  createTaskSchema,
  updateTaskSchema,
  taskFiltersSchema,
  completeTaskSchema,
  deleteTaskSchema,
  addSubtaskSchema,
} from '../utils/validation.js';
import logger from '../utils/logger.js';

/**
 * User context interface
 */
export interface UserContext {
  userId: string;
  userEmail: string;
  userName?: string;
}

/**
 * Tool handler type
 */
export type ToolHandler = (params: any, context: UserContext) => Promise<{
  content: Array<{ type: string; text: string }>;
}>;

/**
 * Store for tool handlers
 */
export const toolHandlers: Record<string, ToolHandler> = {};

/**
 * Register all task-related tools
 * This stores handlers in a map that can be called from the MCP endpoint
 */
export function registerTaskTools(_server: Server) {
  /**
   * Tool: get-tasks
   * Retrieve tasks with optional filters
   */
  toolHandlers['get-tasks'] = async (params: any, context: UserContext) => {
    logger.info('Tool called: get-tasks', {
      userId: context.userId,
      params,
    });

    try {
      // Validate and parse filters
      const filters = taskFiltersSchema.parse(params || {});

      // Get tasks from service
      const tasks = await taskService.getTasks(context.userId, filters);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            tasks,
            count: tasks.length,
            filters,
          }, null, 2),
        }],
      };
    } catch (error) {
      logger.error('Error in get-tasks tool', {
        error: error instanceof Error ? error.message : String(error),
        userId: context.userId,
      });
      throw error;
    }
  };

  /**
   * Tool: create-task
   * Create a new task
   */
  toolHandlers['create-task'] = async (params: any, context: UserContext) => {
    logger.info('Tool called: create-task', {
      userId: context.userId,
      params,
    });

    try {
      // Validate input
      const data = createTaskSchema.parse(params);

      // Create task
      const task = await taskService.createTask(context.userId, {
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate,
        projectId: data.projectId,
        tags: data.tags,
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            task,
            message: `Task "${task.title}" created successfully`,
          }, null, 2),
        }],
      };
    } catch (error) {
      logger.error('Error in create-task tool', {
        error: error instanceof Error ? error.message : String(error),
        userId: context.userId,
      });
      throw error;
    }
  };

  /**
   * Tool: update-task
   * Update an existing task
   */
  toolHandlers['update-task'] = async (params: any, context: UserContext) => {
    logger.info('Tool called: update-task', {
      userId: context.userId,
      params,
    });

    try {
      const { taskId, ...updateData } = params;

      if (!taskId) {
        throw new Error('taskId is required');
      }

      // Validate update data
      const validatedData = updateTaskSchema.parse(updateData);

      // Update task
      const task = await taskService.updateTask(context.userId, taskId, validatedData);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            task,
            message: `Task "${task.title}" updated successfully`,
          }, null, 2),
        }],
      };
    } catch (error) {
      logger.error('Error in update-task tool', {
        error: error instanceof Error ? error.message : String(error),
        userId: context.userId,
      });
      throw error;
    }
  };

  /**
   * Tool: complete-task
   * Mark a task as completed
   */
  toolHandlers['complete-task'] = async (params: any, context: UserContext) => {
    logger.info('Tool called: complete-task', {
      userId: context.userId,
      params,
    });

    try {
      // Validate input
      const { taskId } = completeTaskSchema.parse(params);

      // Complete task
      const task = await taskService.completeTask(context.userId, taskId);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            task,
            message: `Task "${task.title}" completed! Great job!`,
          }, null, 2),
        }],
      };
    } catch (error) {
      logger.error('Error in complete-task tool', {
        error: error instanceof Error ? error.message : String(error),
        userId: context.userId,
      });
      throw error;
    }
  };

  /**
   * Tool: delete-task
   * Delete a task (soft delete)
   */
  toolHandlers['delete-task'] = async (params: any, context: UserContext) => {
    logger.info('Tool called: delete-task', {
      userId: context.userId,
      params,
    });

    try {
      // Validate input
      const { taskId } = deleteTaskSchema.parse(params);

      // Delete task
      await taskService.deleteTask(context.userId, taskId);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Task deleted successfully',
          }, null, 2),
        }],
      };
    } catch (error) {
      logger.error('Error in delete-task tool', {
        error: error instanceof Error ? error.message : String(error),
        userId: context.userId,
      });
      throw error;
    }
  };

  /**
   * Tool: add-subtask
   * Add a subtask to an existing task
   */
  toolHandlers['add-subtask'] = async (params: any, context: UserContext) => {
    logger.info('Tool called: add-subtask', {
      userId: context.userId,
      params,
    });

    try {
      // Validate input
      const { taskId, title } = addSubtaskSchema.parse(params);

      // Add subtask
      const subtask = await taskService.addSubtask(context.userId, taskId, title);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            subtask,
            message: `Subtask "${subtask.title}" added successfully`,
          }, null, 2),
        }],
      };
    } catch (error) {
      logger.error('Error in add-subtask tool', {
        error: error instanceof Error ? error.message : String(error),
        userId: context.userId,
      });
      throw error;
    }
  };

  logger.info('Task tools registered successfully', {
    tools: Object.keys(toolHandlers),
  });
}
