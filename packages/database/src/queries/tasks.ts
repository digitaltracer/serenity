import { getDatabase } from '../connection';
import { Task, Subtask } from '@serenity/core';

export const createTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
  const db = getDatabase();
  
  const result = await db.one(`
    INSERT INTO tasks (user_id, project_id, title, description, completed, priority, due_date, tags, recurring_pattern)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    task.userId || null,
    task.projectId || null,
    task.title,
    task.description || null,
    task.completed,
    task.priority,
    task.dueDate || null,
    task.tags,
    task.recurring ? JSON.stringify(task.recurring) : null
  ]);

  return mapTaskFromDB(result);
};

export const getTasks = async (userId: string): Promise<Task[]> => {
  const db = getDatabase();
  
  const results = await db.any(`
    SELECT * FROM tasks 
    WHERE user_id = $1 
    ORDER BY created_at DESC
  `, [userId]);

  return results.map(mapTaskFromDB);
};

export const getTaskById = async (taskId: string, userId: string): Promise<Task | null> => {
  const db = getDatabase();
  
  const result = await db.oneOrNone(`
    SELECT * FROM tasks 
    WHERE id = $1 AND user_id = $2
  `, [taskId, userId]);

  return result ? mapTaskFromDB(result) : null;
};

export const updateTask = async (taskId: string, userId: string, updates: Partial<Task>): Promise<Task | null> => {
  const db = getDatabase();
  
  const setClause = [];
  const values = [];
  let paramIndex = 1;

  if (updates.title !== undefined) {
    setClause.push(`title = $${paramIndex++}`);
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    setClause.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }
  if (updates.completed !== undefined) {
    setClause.push(`completed = $${paramIndex++}`);
    values.push(updates.completed);
  }
  if (updates.priority !== undefined) {
    setClause.push(`priority = $${paramIndex++}`);
    values.push(updates.priority);
  }
  if (updates.dueDate !== undefined) {
    setClause.push(`due_date = $${paramIndex++}`);
    values.push(updates.dueDate);
  }
  if (updates.tags !== undefined) {
    setClause.push(`tags = $${paramIndex++}`);
    values.push(updates.tags);
  }
  if (updates.projectId !== undefined) {
    setClause.push(`project_id = $${paramIndex++}`);
    values.push(updates.projectId);
  }

  if (setClause.length === 0) {
    return getTaskById(taskId, userId);
  }

  values.push(taskId, userId);

  const result = await db.oneOrNone(`
    UPDATE tasks 
    SET ${setClause.join(', ')}
    WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
    RETURNING *
  `, values);

  return result ? mapTaskFromDB(result) : null;
};

export const deleteTask = async (taskId: string, userId: string): Promise<boolean> => {
  const db = getDatabase();
  
  const result = await db.result(`
    DELETE FROM tasks 
    WHERE id = $1 AND user_id = $2
  `, [taskId, userId]);

  return result.rowCount > 0;
};

export const getTasksByProject = async (projectId: string, userId: string): Promise<Task[]> => {
  const db = getDatabase();
  
  const results = await db.any(`
    SELECT * FROM tasks 
    WHERE project_id = $1 AND user_id = $2 
    ORDER BY created_at DESC
  `, [projectId, userId]);

  return results.map(mapTaskFromDB);
};

export const getTodayTasks = async (userId: string): Promise<Task[]> => {
  const db = getDatabase();
  
  const results = await db.any(`
    SELECT * FROM tasks 
    WHERE user_id = $1 
    AND due_date::date = CURRENT_DATE
    ORDER BY priority DESC, created_at ASC
  `, [userId]);

  return results.map(mapTaskFromDB);
};

export const getOverdueTasks = async (userId: string): Promise<Task[]> => {
  const db = getDatabase();
  
  const results = await db.any(`
    SELECT * FROM tasks 
    WHERE user_id = $1 
    AND due_date < CURRENT_DATE
    AND completed = FALSE
    ORDER BY due_date ASC
  `, [userId]);

  return results.map(mapTaskFromDB);
};

// Helper function to map database row to Task object
const mapTaskFromDB = (row: any): Task => {
  // Safe JSON parsing helper
  const safeJsonParse = (jsonString: string | null, fallback: any = undefined) => {
    if (!jsonString) return fallback;
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('Failed to parse recurring pattern JSON:', error, 'Using fallback:', fallback);
      return fallback;
    }
  };

  // Parse recurring pattern safely
  const recurring = safeJsonParse(row.recurring_pattern, undefined);

  return {
    id: row.id,
    title: row.title || '',
    description: row.description || '',
    completed: Boolean(row.completed),
    priority: row.priority || 'medium',
    dueDate: row.due_date ? new Date(row.due_date) : undefined,
    projectId: row.project_id || undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    recurring: recurring && typeof recurring === 'object' && recurring.type ? recurring : undefined,
    userId: row.user_id,
  };
};