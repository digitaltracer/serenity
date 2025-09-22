/**
 * Task Business Logic Service
 * Handles task operations with validation and business rules
 */

interface TaskData {
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  dueDate?: Date | string | null;
  projectId?: string;
  parentId?: string;
}

interface TaskUpdate {
  title?: string;
  description?: string;
  completed?: boolean;
  completedAt?: Date | string | null;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  dueDate?: Date | string | null;
  projectId?: string;
}

export class TaskService {
  private sqliteService: any = null;

  private async getSqliteService() {
    if (!this.sqliteService) {
      const { sqliteService } = await import('@serenity/database');
      this.sqliteService = sqliteService;
      await this.sqliteService.initialize();
    }
    return this.sqliteService;
  }

  /**
   * Get all tasks with business logic filtering
   */
  async getAllTasks() {
    try {
      console.log('📋 TaskService: Getting all tasks');
      const service = await this.getSqliteService();
      const tasks = await service.getTasks();
      
      // Business logic: Sort by priority and due date
      const sortedTasks = tasks.sort((a: any, b: any) => {
        // Priority order: high > medium > low
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority; // Higher priority first
        }
        
        // Then by due date (closest first)
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        
        return 0;
      });
      
      console.log(`✅ TaskService: Retrieved ${sortedTasks.length} tasks`);
      return { success: true, data: sortedTasks };
    } catch (error) {
      console.error('❌ TaskService: Failed to get tasks:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to retrieve tasks' 
      };
    }
  }

  /**
   * Create a new task with validation
   */
  async createTask(taskData: TaskData) {
    try {
      console.log('📝 TaskService: Creating new task:', taskData.title);
      
      // Validation
      if (!taskData.title || taskData.title.trim().length === 0) {
        return { success: false, error: 'Task title is required' };
      }
      
      if (taskData.title.length > 200) {
        return { success: false, error: 'Task title cannot exceed 200 characters' };
      }
      
      if (taskData.description && taskData.description.length > 2000) {
        return { success: false, error: 'Task description cannot exceed 2000 characters' };
      }
      
      if (taskData.tags && taskData.tags.length > 10) {
        return { success: false, error: 'Cannot have more than 10 tags per task' };
      }

      // Business logic: Sanitize and format data
      const sanitizedTask: any = {
        ...taskData,
        title: taskData.title.trim(),
        description: taskData.description?.trim() || '',
        tags: taskData.tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Handle dueDate - convert string to Date if necessary
      if (taskData.dueDate !== undefined) {
        if (taskData.dueDate === null) {
          sanitizedTask.dueDate = null;
        } else if (typeof taskData.dueDate === 'string') {
          // Convert string to Date object
          const dateValue = new Date(taskData.dueDate);
          if (isNaN(dateValue.getTime())) {
            return { success: false, error: 'Invalid due date format' };
          }
          sanitizedTask.dueDate = dateValue;
        } else if (taskData.dueDate instanceof Date) {
          sanitizedTask.dueDate = taskData.dueDate;
        } else {
          return { success: false, error: 'Due date must be a valid date' };
        }
      }

      const service = await this.getSqliteService();
      const newTask = await service.createTask(sanitizedTask);
      
      console.log('✅ TaskService: Task created successfully:', newTask.id);
      return { success: true, data: newTask };
    } catch (error) {
      console.error('❌ TaskService: Failed to create task:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create task' 
      };
    }
  }

  /**
   * Update a task with validation and business rules
   */
  async updateTask(id: string, updates: TaskUpdate) {
    try {
      console.log('📝 TaskService: Updating task:', id);
      
      // Validation
      if (!id || id.trim().length === 0) {
        return { success: false, error: 'Task ID is required' };
      }
      
      if (updates.title !== undefined) {
        if (updates.title.trim().length === 0) {
          return { success: false, error: 'Task title cannot be empty' };
        }
        if (updates.title.length > 200) {
          return { success: false, error: 'Task title cannot exceed 200 characters' };
        }
      }
      
      if (updates.description !== undefined && updates.description.length > 2000) {
        return { success: false, error: 'Task description cannot exceed 2000 characters' };
      }
      
      if (updates.tags && updates.tags.length > 10) {
        return { success: false, error: 'Cannot have more than 10 tags per task' };
      }

      // Business logic: Sanitize updates
      const sanitizedUpdates: any = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      if (updates.title !== undefined) {
        sanitizedUpdates.title = updates.title.trim();
      }
      
      if (updates.description !== undefined) {
        sanitizedUpdates.description = updates.description.trim();
      }
      
      if (updates.tags) {
        sanitizedUpdates.tags = updates.tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
      }
      
      // Handle dueDate - convert string to Date if necessary
      if (updates.dueDate !== undefined) {
        if (updates.dueDate === null) {
          sanitizedUpdates.dueDate = null;
        } else if (typeof updates.dueDate === 'string') {
          // Convert string to Date object
          const dateValue = new Date(updates.dueDate);
          if (isNaN(dateValue.getTime())) {
            return { success: false, error: 'Invalid due date format' };
          }
          sanitizedUpdates.dueDate = dateValue;
        } else if (updates.dueDate instanceof Date) {
          sanitizedUpdates.dueDate = updates.dueDate;
        } else {
          return { success: false, error: 'Due date must be a valid date' };
        }
      }

      // Handle completedAt - convert string to Date if necessary
      if (updates.completedAt !== undefined) {
        if (updates.completedAt === null) {
          sanitizedUpdates.completedAt = null;
        } else if (typeof updates.completedAt === 'string') {
          // Convert string to Date object
          const dateValue = new Date(updates.completedAt);
          if (isNaN(dateValue.getTime())) {
            return { success: false, error: 'Invalid completed date format' };
          }
          sanitizedUpdates.completedAt = dateValue;
        } else if (updates.completedAt instanceof Date) {
          sanitizedUpdates.completedAt = updates.completedAt;
        } else {
          return { success: false, error: 'Completed date must be a valid date' };
        }
      }

      // Business logic: Handle completion state changes
      if (updates.completed !== undefined) {
        if (updates.completed === true && updates.completedAt === undefined) {
          // If marking as completed but no completedAt provided, set it to now
          sanitizedUpdates.completedAt = new Date();
        } else if (updates.completed === false) {
          // If marking as incomplete, clear the completedAt
          sanitizedUpdates.completedAt = null;
        }
      }

      const service = await this.getSqliteService();
      const updatedTask = await service.updateTask(id, sanitizedUpdates);
      
      console.log('✅ TaskService: Task updated successfully:', id);
      return { success: true, data: updatedTask };
    } catch (error) {
      console.error('❌ TaskService: Failed to update task:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update task' 
      };
    }
  }

  /**
   * Delete a task with business rules
   */
  async deleteTask(id: string) {
    try {
      console.log('🗑️ TaskService: Deleting task:', id);
      
      // Validation
      if (!id || id.trim().length === 0) {
        return { success: false, error: 'Task ID is required' };
      }

      const service = await this.getSqliteService();
      
      // Business logic: Check if task has subtasks
      const allTasks = await service.getTasks();
      const hasSubtasks = allTasks.some((task: any) => task.parentId === id);
      
      if (hasSubtasks) {
        return { 
          success: false, 
          error: 'Cannot delete task with subtasks. Please delete subtasks first or move them to another parent task.' 
        };
      }
      
      const deleted = await service.deleteTask(id);
      
      console.log('✅ TaskService: Task deleted successfully:', id);
      return { success: true, data: deleted };
    } catch (error) {
      console.error('❌ TaskService: Failed to delete task:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete task' 
      };
    }
  }

  /**
   * Complete a task (business logic wrapper)
   */
  async completeTask(id: string) {
    console.log('✅ TaskService: Completing task:', id);
    return this.updateTask(id, {
      completed: true,
      completedAt: new Date().toISOString()
    });
  }

  /**
   * Bulk operations with validation
   */
  async bulkUpdateTasks(taskIds: string[], updates: TaskUpdate) {
    try {
      console.log('📦 TaskService: Bulk updating tasks:', taskIds.length);
      
      if (!taskIds || taskIds.length === 0) {
        return { success: false, error: 'No task IDs provided' };
      }
      
      if (taskIds.length > 100) {
        return { success: false, error: 'Cannot bulk update more than 100 tasks at once' };
      }

      const results = [];
      for (const id of taskIds) {
        const result = await this.updateTask(id, updates);
        results.push({ id, ...result });
      }
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      console.log(`✅ TaskService: Bulk update completed - ${successful} successful, ${failed} failed`);
      return { 
        success: true, 
        data: { 
          results, 
          summary: { successful, failed, total: taskIds.length } 
        } 
      };
    } catch (error) {
      console.error('❌ TaskService: Bulk update failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Bulk update failed' 
      };
    }
  }
}

export const taskService = new TaskService();