import { getDatabase } from '../connection';
import { User, UserPreferences } from '@serenity/core';

export const createUser = async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
  const db = getDatabase();
  
  const result = await db.one(`
    INSERT INTO users (name, email, preferences)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [
    user.name,
    user.email,
    JSON.stringify(user.preferences)
  ]);

  return mapUserFromDB(result);
};

export const getUserById = async (userId: string): Promise<User | null> => {
  const db = getDatabase();
  
  const result = await db.oneOrNone(`
    SELECT * FROM users WHERE id = $1
  `, [userId]);

  return result ? mapUserFromDB(result) : null;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const db = getDatabase();
  
  const result = await db.oneOrNone(`
    SELECT * FROM users WHERE email = $1
  `, [email]);

  return result ? mapUserFromDB(result) : null;
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User | null> => {
  const db = getDatabase();
  
  const setClause = [];
  const values = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    setClause.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.email !== undefined) {
    setClause.push(`email = $${paramIndex++}`);
    values.push(updates.email);
  }
  if (updates.preferences !== undefined) {
    setClause.push(`preferences = $${paramIndex++}`);
    values.push(JSON.stringify(updates.preferences));
  }

  if (setClause.length === 0) {
    return getUserById(userId);
  }

  values.push(userId);

  const result = await db.oneOrNone(`
    UPDATE users 
    SET ${setClause.join(', ')}
    WHERE id = $${paramIndex++}
    RETURNING *
  `, values);

  return result ? mapUserFromDB(result) : null;
};

export const updateUserPreferences = async (userId: string, preferences: Partial<UserPreferences>): Promise<User | null> => {
  const db = getDatabase();
  
  // First get current preferences
  const currentUser = await getUserById(userId);
  if (!currentUser) return null;

  const updatedPreferences = {
    ...currentUser.preferences,
    ...preferences
  };

  return updateUser(userId, { preferences: updatedPreferences });
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  const db = getDatabase();
  
  const result = await db.result(`
    DELETE FROM users WHERE id = $1
  `, [userId]);

  return result.rowCount > 0;
};

export const getUserAnalytics = async (userId: string): Promise<{
  tasksCompleted: number;
  tasksCompletedToday: number;
  completionRate: number;
  activeStreak: number;
  journalEntries: number;
  journalEntriesThisMonth: number;
  avgWordsPerEntry: number;
}> => {
  const db = getDatabase();
  
  const result = await db.one(`
    SELECT 
      -- Task statistics
      COUNT(CASE WHEN t.completed = TRUE THEN 1 END) as tasks_completed,
      COUNT(CASE WHEN t.completed = TRUE AND (t.completed_at::date = CURRENT_DATE OR (t.completed_at IS NULL AND t.updated_at::date = CURRENT_DATE)) THEN 1 END) as tasks_completed_today,
      CASE 
        WHEN COUNT(t.id) > 0 THEN ROUND((COUNT(CASE WHEN t.completed = TRUE THEN 1 END) * 100.0) / COUNT(t.id), 0)
        ELSE 0
      END as completion_rate,
      
      -- Journal statistics
      COUNT(j.id) as journal_entries,
      COUNT(CASE WHEN j.date >= date_trunc('month', CURRENT_DATE) THEN 1 END) as journal_entries_this_month,
      COALESCE(AVG(j.word_count), 0) as avg_words_per_entry
      
    FROM users u
    LEFT JOIN tasks t ON u.id = t.user_id
    LEFT JOIN journal_entries j ON u.id = j.user_id
    WHERE u.id = $1
    GROUP BY u.id
  `, [userId]);

  // Calculate active streak separately
  const streakResult = await db.oneOrNone(`
    WITH daily_activity AS (
      SELECT 
        date,
        COUNT(*) as activity_count
      FROM (
        SELECT updated_at::date as date FROM tasks WHERE user_id = $1 AND completed = TRUE
        UNION ALL
        SELECT date FROM journal_entries WHERE user_id = $1
      ) activities
      GROUP BY date
      ORDER BY date DESC
    ),
    streak_calculation AS (
      SELECT 
        date,
        ROW_NUMBER() OVER (ORDER BY date DESC) as rn,
        date - INTERVAL '1 day' * (ROW_NUMBER() OVER (ORDER BY date DESC) - 1) as expected_date
      FROM daily_activity
      WHERE date <= CURRENT_DATE
    )
    SELECT COUNT(*) as streak_days
    FROM streak_calculation
    WHERE date = expected_date
    AND date = (SELECT MAX(date) FROM streak_calculation WHERE expected_date = date)
  `, [userId]);

  return {
    tasksCompleted: parseInt(result.tasks_completed) || 0,
    tasksCompletedToday: parseInt(result.tasks_completed_today) || 0,
    completionRate: parseInt(result.completion_rate) || 0,
    activeStreak: parseInt(streakResult?.streak_days) || 0,
    journalEntries: parseInt(result.journal_entries) || 0,
    journalEntriesThisMonth: parseInt(result.journal_entries_this_month) || 0,
    avgWordsPerEntry: Math.round(parseFloat(result.avg_words_per_entry) || 0),
  };
};

// Helper function to map database row to User object
const mapUserFromDB = (row: any): User => {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    preferences: row.preferences ? JSON.parse(row.preferences) : {},
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
};