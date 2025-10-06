import { getDatabase } from '../connection';
import { Goal } from '@serenity/core';
import { logger } from '@serenity/core';

export const createGoal = async (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> => {
  const db = getDatabase();
  
  const result = await db.one(`
    INSERT INTO goals (user_id, title, description, type, config, progress, status, priority, reminders)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    goal.userId || null,
    goal.title,
    goal.description || null,
    goal.type,
    JSON.stringify(goal.config),
    JSON.stringify(goal.progress),
    goal.status,
    goal.priority,
    JSON.stringify(goal.reminders)
  ]);

  return mapGoalFromDB(result);
};

export const getGoals = async (userId: string): Promise<Goal[]> => {
  const db = getDatabase();
  
  const results = await db.any(`
    SELECT * FROM goals 
    WHERE user_id = $1 
    ORDER BY priority DESC, created_at DESC
  `, [userId]);

  return results.map(mapGoalFromDB);
};

export const getGoalById = async (goalId: string, userId: string): Promise<Goal | null> => {
  const db = getDatabase();
  
  const result = await db.oneOrNone(`
    SELECT * FROM goals 
    WHERE id = $1 AND user_id = $2
  `, [goalId, userId]);

  return result ? mapGoalFromDB(result) : null;
};

export const updateGoal = async (goalId: string, userId: string, updates: Partial<Goal>): Promise<Goal | null> => {
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
  if (updates.type !== undefined) {
    setClause.push(`type = $${paramIndex++}`);
    values.push(updates.type);
  }
  if (updates.config !== undefined) {
    setClause.push(`config = $${paramIndex++}`);
    values.push(JSON.stringify(updates.config));
  }
  if (updates.progress !== undefined) {
    setClause.push(`progress = $${paramIndex++}`);
    values.push(JSON.stringify(updates.progress));
  }
  if (updates.status !== undefined) {
    setClause.push(`status = $${paramIndex++}`);
    values.push(updates.status);
  }
  if (updates.priority !== undefined) {
    setClause.push(`priority = $${paramIndex++}`);
    values.push(updates.priority);
  }
  if (updates.reminders !== undefined) {
    setClause.push(`reminders = $${paramIndex++}`);
    values.push(JSON.stringify(updates.reminders));
  }

  if (setClause.length === 0) {
    return getGoalById(goalId, userId);
  }

  values.push(goalId, userId);

  const result = await db.oneOrNone(`
    UPDATE goals 
    SET ${setClause.join(', ')}
    WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
    RETURNING *
  `, values);

  return result ? mapGoalFromDB(result) : null;
};

export const deleteGoal = async (goalId: string, userId: string): Promise<boolean> => {
  const db = getDatabase();
  
  const result = await db.result(`
    DELETE FROM goals 
    WHERE id = $1 AND user_id = $2
  `, [goalId, userId]);

  return result.rowCount > 0;
};

export const getActiveGoals = async (userId: string): Promise<Goal[]> => {
  const db = getDatabase();
  
  const results = await db.any(`
    SELECT * FROM goals 
    WHERE user_id = $1 AND status = 'active'
    ORDER BY priority DESC, created_at DESC
  `, [userId]);

  return results.map(mapGoalFromDB);
};

export const getGoalsByType = async (userId: string, type: Goal['type']): Promise<Goal[]> => {
  const db = getDatabase();
  
  const results = await db.any(`
    SELECT * FROM goals 
    WHERE user_id = $1 AND type = $2
    ORDER BY created_at DESC
  `, [userId, type]);

  return results.map(mapGoalFromDB);
};

export const updateGoalProgress = async (goalId: string, userId: string, progress: Goal['progress']): Promise<Goal | null> => {
  const db = getDatabase();
  
  const result = await db.oneOrNone(`
    UPDATE goals 
    SET progress = $1
    WHERE id = $2 AND user_id = $3
    RETURNING *
  `, [JSON.stringify(progress), goalId, userId]);

  return result ? mapGoalFromDB(result) : null;
};

// Helper function to map database row to Goal object
const mapGoalFromDB = (row: any): Goal => {
  // Safe JSON parsing helper
  const safeJsonParse = (jsonString: string | null, fallback: any = {}) => {
    if (!jsonString) return fallback;
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      logger.warn('Failed to parse JSON, using fallback', { component: 'goals', operation: 'failedParseJson:' });
      return fallback;
    }
  };

  // Parse config with proper defaults
  const config = safeJsonParse(row.config, {});
  const defaultConfig = {
    targetCount: 10,
    projectId: '',
    priority: 'high' as const,
    streakDays: 7,
    targetRate: 80,
    timeframe: 'weekly' as const,
  };
  
  // Parse progress with proper defaults
  const progress = safeJsonParse(row.progress, {});
  const defaultProgress = {
    current: 0,
    target: config.targetCount || config.streakDays || config.targetRate || 1,
    percentage: 0,
    isCompleted: false,
    periodStart: new Date(),
    periodEnd: new Date(),
  };

  // Parse reminders with error handling
  const reminders = safeJsonParse(row.reminders, []);

  return {
    id: row.id,
    title: row.title || '',
    description: row.description || '',
    type: row.type,
    config: { ...defaultConfig, ...config },
    progress: { ...defaultProgress, ...progress },
    status: row.status || 'active',
    priority: row.priority || 'medium',
    reminders: Array.isArray(reminders) ? reminders : [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    userId: row.user_id,
  };
};