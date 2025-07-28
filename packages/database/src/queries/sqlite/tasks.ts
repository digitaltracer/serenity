/**
 * SQLite Task Queries for Serenity Notes
 */

import Database from 'better-sqlite3';
import { Task, Subtask } from '@serenity/core';
import { v4 as uuidv4 } from 'uuid';

export class SQLiteTaskQueries {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    console.log('🔍 SQLite: Getting all tasks...');
    
    // First, let's check what's in the task_tags table
    const tagCheckStmt = this.db.prepare('SELECT * FROM task_tags');
    const allTags = tagCheckStmt.all();
    console.log('🏷️ ALL TAGS IN DATABASE:', allTags);
    
    const stmt = this.db.prepare(`
      SELECT 
        t.*,
        GROUP_CONCAT(tt.tag) as tags
      FROM tasks t
      LEFT JOIN task_tags tt ON t.id = tt.task_id
      WHERE t.parent_task_id IS NULL
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);

    const rows = stmt.all();
    console.log(`📊 SQLite: Found ${rows.length} task rows in database`);
    
    if (rows.length > 0) {
      console.log('📋 SQLite: Raw task rows:', rows.map((r: any) => ({ id: r.id, title: r.title, tags: r.tags })));
    }
    
    const tasks = rows.map((row) => this.rowToTask(row));
    console.log(`✅ SQLite: Converted to ${tasks.length} Task objects`);
    
    return tasks;
  }

  /**
   * Get task by ID
   */
  getTaskById(id: string): Task | null {
    const stmt = this.db.prepare(`
      SELECT 
        t.*,
        GROUP_CONCAT(tt.tag) as tags
      FROM tasks t
      LEFT JOIN task_tags tt ON t.id = tt.task_id
      WHERE t.id = ?
      GROUP BY t.id
    `);

    const row = stmt.get(id);
    return row ? this.rowToTask(row) : null;
  }

  /**
   * Get tasks by project
   */
  getTasksByProject(projectId: string): Task[] {
    const stmt = this.db.prepare(`
      SELECT 
        t.*,
        GROUP_CONCAT(tt.tag) as tags
      FROM tasks t
      LEFT JOIN task_tags tt ON t.id = tt.task_id
      WHERE t.project_id = ? AND t.parent_task_id IS NULL
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);

    const rows = stmt.all(projectId);
    return rows.map((row) => this.rowToTask(row));
  }

  /**
   * Get subtasks for a task
   */
  getSubtasks(taskId: string): Subtask[] {
    const stmt = this.db.prepare(`
      SELECT id, title, completed, \`order\`
      FROM tasks 
      WHERE parent_task_id = ?
      ORDER BY \`order\` ASC, created_at ASC
    `);

    const rows = stmt.all(taskId);
    return rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      completed: Boolean(row.completed),
      order: row.order || 0
    }));
  }

  /**
   * Create a new task
   */
  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    console.log('📝 SQLite: Creating new task:', task.title);
    console.log('🏷️ SQLite: Task tags:', task.tags);
    
    const id = this.generateUniqueId();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO tasks (
        id, title, description, completed, priority, due_date, project_id, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertResult = stmt.run(
      id,
      task.title,
      task.description || null,
      task.completed ? 1 : 0,
      task.priority,
      task.dueDate ? task.dueDate.toISOString() : null,
      task.projectId || null,
      now,
      now
    );
    
    console.log(`✅ SQLite: Task inserted with ID ${id}, changes: ${insertResult.changes}`);

    // Insert tags if provided
    if (task.tags && task.tags.length > 0) {
      console.log(`🏷️ SQLite: Inserting ${task.tags.length} tags for task ${id}`);
      this.updateTaskTags(id, task.tags);
    } else {
      console.log('⚠️ SQLite: No tags to insert for task', id);
    }

    // Insert subtasks if provided
    if (task.subtasks && task.subtasks.length > 0) {
      this.insertSubtasks(id, task.subtasks);
    }

    const createdTask = this.getTaskById(id)!;
    console.log('📤 SQLite: Returning created task:', { id: createdTask.id, title: createdTask.title, tags: createdTask.tags });
    
    return createdTask;
  }

  /**
   * Create a task with a specific ID (used by middleware to preserve Redux IDs)
   */
  createTaskWithId(task: Task): Task {
    console.log('📝 SQLite: Creating task with ID:', task.id);
    console.log('🏷️ SQLite: Task tags:', task.tags);
    console.log('📋 SQLite: Full task object:', JSON.stringify(task, null, 2));
    
    try {
      const stmt = this.db.prepare(`
        INSERT INTO tasks (
          id, title, description, completed, priority, due_date, project_id, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertResult = stmt.run(
        task.id,
        task.title,
        task.description || null,
        task.completed ? 1 : 0,
        task.priority,
        task.dueDate ? (task.dueDate instanceof Date ? task.dueDate.toISOString() : new Date(task.dueDate).toISOString()) : null,
        task.projectId || null,
        task.createdAt instanceof Date ? task.createdAt.toISOString() : new Date(task.createdAt).toISOString(),
        task.updatedAt instanceof Date ? task.updatedAt.toISOString() : new Date(task.updatedAt).toISOString()
      );
      
      console.log(`✅ SQLite: Task inserted with ID ${task.id}, changes: ${insertResult.changes}`);
      
      if (insertResult.changes === 0) {
        console.error('❌ SQLite: Task insertion failed - no changes made');
        throw new Error('Task insertion failed - no rows affected');
      }
    } catch (error) {
      console.error('❌ SQLite: Task insertion error:', error);
      throw error;
    }

    // Insert tags if provided
    if (task.tags && task.tags.length > 0) {
      console.log(`🏷️ SQLite: Inserting ${task.tags.length} tags for task ${task.id}`);
      this.updateTaskTags(task.id, task.tags);
    } else {
      console.log('⚠️ SQLite: No tags to insert for task', task.id);
    }

    // Insert subtasks if provided
    if (task.subtasks && task.subtasks.length > 0) {
      this.insertSubtasks(task.id, task.subtasks);
    }

    const savedTask = this.getTaskById(task.id)!;
    console.log('📤 SQLite: Returning saved task:', { id: savedTask.id, title: savedTask.title, tags: savedTask.tags });
    
    return savedTask;
  }

  /**
   * Update a task
   */
  updateTask(id: string, updates: Partial<Task>): Task | null {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    // Build dynamic update query
    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.completed !== undefined) {
      fields.push('completed = ?');
      values.push(updates.completed ? 1 : 0);
    }
    if (updates.priority !== undefined) {
      fields.push('priority = ?');
      values.push(updates.priority);
    }
    if (updates.projectId !== undefined) {
      fields.push('project_id = ?');
      values.push(updates.projectId);
    }
    if (updates.dueDate !== undefined) {
      fields.push('due_date = ?');
      values.push(updates.dueDate ? updates.dueDate.toISOString() : null);
    }

    if (fields.length > 0) {
      fields.push('updated_at = ?');
      values.push(now);
      values.push(id);

      const stmt = this.db.prepare(`
        UPDATE tasks 
        SET ${fields.join(', ')}
        WHERE id = ?
      `);

      stmt.run(...values);
    }

    // Update tags if provided
    if (updates.tags !== undefined) {
      this.updateTaskTags(id, updates.tags);
    }

    // Update subtasks if provided
    if (updates.subtasks !== undefined) {
      this.updateSubtasks(id, updates.subtasks);
    }

    return this.getTaskById(id);
  }

  /**
   * Delete a task
   */
  deleteTask(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM tasks WHERE id = ? OR parent_task_id = ?');
    const result = stmt.run(id, id);
    return result.changes > 0;
  }

  /**
   * Insert subtasks for a task
   */
  private insertSubtasks(taskId: string, subtasks: Subtask[]): void {
    const stmt = this.db.prepare(`
      INSERT INTO tasks (id, title, completed, \`order\`, parent_task_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    for (const subtask of subtasks) {
      const subtaskId = subtask.id || this.generateUniqueId();
      stmt.run(
        subtaskId,
        subtask.title,
        subtask.completed ? 1 : 0,
        subtask.order,
        taskId,
        now,
        now
      );
    }
  }

  /**
   * Update subtasks for a task
   */
  private updateSubtasks(taskId: string, subtasks: Subtask[]): void {
    // Delete existing subtasks
    const deleteStmt = this.db.prepare('DELETE FROM tasks WHERE parent_task_id = ?');
    deleteStmt.run(taskId);

    // Insert new subtasks
    if (subtasks.length > 0) {
      this.insertSubtasks(taskId, subtasks);
    }
  }

  /**
   * Update task tags
   */
  private updateTaskTags(taskId: string, tags: string[]): void {
    console.log(`🏷️ Updating tags for task ${taskId}:`, tags);
    
    // Delete existing tags
    const deleteStmt = this.db.prepare('DELETE FROM task_tags WHERE task_id = ?');
    const deleteResult = deleteStmt.run(taskId);
    console.log(`🗑️ Deleted ${deleteResult.changes} existing tags for task ${taskId}`);

    // Insert new tags
    if (tags.length > 0) {
      const insertStmt = this.db.prepare('INSERT INTO task_tags (task_id, tag) VALUES (?, ?)');
      
      for (const tag of tags) {
        const insertResult = insertStmt.run(taskId, tag);
        console.log(`➕ Inserted tag "${tag}" for task ${taskId}, changes: ${insertResult.changes}`);
      }
    }
  }

  /**
   * Convert database row to Task object
   */
  private rowToTask(row: any): Task {
    const rawTags = row.tags;
    const parsedTags = rawTags ? rawTags.split(',').filter(Boolean) : [];
    console.log(`🏷️ Raw tags for task ${row.id}: "${rawTags}" -> Parsed:`, parsedTags);
    
    const task: Task = {
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      completed: Boolean(row.completed),
      priority: row.priority || 'medium',
      projectId: row.project_id || undefined,
      dueDate: row.due_date ? new Date(row.due_date) : undefined,
      tags: parsedTags,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      subtasks: this.getSubtasks(row.id),
    };

    return task;
  }

  /**
   * Generate a unique ID (using same UUID as Redux slice)
   */
  private generateUniqueId(): string {
    return uuidv4();
  }

  /**
   * Get tasks with subtasks populated
   */
  getTasksWithSubtasks(): Task[] {
    return this.getAllTasks();
  }

  /**
   * Search tasks
   */
  searchTasks(query: string): Task[] {
    const stmt = this.db.prepare(`
      SELECT 
        t.*,
        GROUP_CONCAT(tt.tag) as tags
      FROM tasks t
      LEFT JOIN task_tags tt ON t.id = tt.task_id
      WHERE (t.title LIKE ? OR t.description LIKE ?) AND t.parent_task_id IS NULL
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);

    const searchTerm = `%${query}%`;
    const rows = stmt.all(searchTerm, searchTerm);
    return rows.map((row) => this.rowToTask(row));
  }

  /**
   * Get tasks due today
   */
  getTasksDueToday(): Task[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stmt = this.db.prepare(`
      SELECT 
        t.*,
        GROUP_CONCAT(tt.tag) as tags
      FROM tasks t
      LEFT JOIN task_tags tt ON t.id = tt.task_id
      WHERE t.due_date >= ? AND t.due_date < ? AND t.completed = 0 AND t.parent_task_id IS NULL
      GROUP BY t.id
      ORDER BY t.due_date ASC
    `);

    const rows = stmt.all(today.toISOString(), tomorrow.toISOString());
    return rows.map((row) => this.rowToTask(row));
  }

  /**
   * Get overdue tasks
   */
  getOverdueTasks(): Task[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stmt = this.db.prepare(`
      SELECT 
        t.*,
        GROUP_CONCAT(tt.tag) as tags
      FROM tasks t
      LEFT JOIN task_tags tt ON t.id = tt.task_id
      WHERE t.due_date < ? AND t.completed = 0 AND t.parent_task_id IS NULL
      GROUP BY t.id
      ORDER BY t.due_date ASC
    `);

    const rows = stmt.all(today.toISOString());
    return rows.map((row) => this.rowToTask(row));
  }
}