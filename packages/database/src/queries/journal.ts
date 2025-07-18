import { getDatabase } from '../connection';
import { JournalEntry } from '@serenity/core';

export const createJournalEntry = async (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<JournalEntry> => {
  const db = getDatabase();
  
  const result = await db.one(`
    INSERT INTO journal_entries (user_id, title, content, date, tags, pinned, mood)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [
    entry.userId || null,
    entry.title || null,
    entry.content,
    entry.date,
    entry.tags,
    entry.pinned,
    entry.mood || null
  ]);

  return mapJournalEntryFromDB(result);
};

export const getJournalEntries = async (userId: string, limit?: number, offset?: number): Promise<JournalEntry[]> => {
  const db = getDatabase();
  
  let query = `
    SELECT * FROM journal_entries 
    WHERE user_id = $1 
    ORDER BY date DESC, created_at DESC
  `;
  
  const params = [userId];
  
  if (limit) {
    query += ` LIMIT $${params.length + 1}`;
    params.push(limit.toString());
  }
  
  if (offset) {
    query += ` OFFSET $${params.length + 1}`;
    params.push(offset.toString());
  }

  const results = await db.any(query, params);
  return results.map(mapJournalEntryFromDB);
};

export const getJournalEntryById = async (entryId: string, userId: string): Promise<JournalEntry | null> => {
  const db = getDatabase();
  
  const result = await db.oneOrNone(`
    SELECT * FROM journal_entries 
    WHERE id = $1 AND user_id = $2
  `, [entryId, userId]);

  return result ? mapJournalEntryFromDB(result) : null;
};

export const getJournalEntriesByDate = async (userId: string, date: Date): Promise<JournalEntry[]> => {
  const db = getDatabase();
  
  const results = await db.any(`
    SELECT * FROM journal_entries 
    WHERE user_id = $1 AND date = $2
    ORDER BY created_at DESC
  `, [userId, date.toISOString().split('T')[0]]);

  return results.map(mapJournalEntryFromDB);
};

export const getJournalEntriesByDateRange = async (
  userId: string, 
  startDate: Date, 
  endDate: Date
): Promise<JournalEntry[]> => {
  const db = getDatabase();
  
  const results = await db.any(`
    SELECT * FROM journal_entries 
    WHERE user_id = $1 
    AND date BETWEEN $2 AND $3
    ORDER BY date DESC, created_at DESC
  `, [userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

  return results.map(mapJournalEntryFromDB);
};

export const updateJournalEntry = async (entryId: string, userId: string, updates: Partial<JournalEntry>): Promise<JournalEntry | null> => {
  const db = getDatabase();
  
  const setClause = [];
  const values = [];
  let paramIndex = 1;

  if (updates.title !== undefined) {
    setClause.push(`title = $${paramIndex++}`);
    values.push(updates.title);
  }
  if (updates.content !== undefined) {
    setClause.push(`content = $${paramIndex++}`);
    values.push(updates.content);
  }
  if (updates.date !== undefined) {
    setClause.push(`date = $${paramIndex++}`);
    values.push(updates.date);
  }
  if (updates.tags !== undefined) {
    setClause.push(`tags = $${paramIndex++}`);
    values.push(updates.tags);
  }
  if (updates.pinned !== undefined) {
    setClause.push(`pinned = $${paramIndex++}`);
    values.push(updates.pinned);
  }
  if (updates.mood !== undefined) {
    setClause.push(`mood = $${paramIndex++}`);
    values.push(updates.mood);
  }

  if (setClause.length === 0) {
    return getJournalEntryById(entryId, userId);
  }

  values.push(entryId, userId);

  const result = await db.oneOrNone(`
    UPDATE journal_entries 
    SET ${setClause.join(', ')}
    WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
    RETURNING *
  `, values);

  return result ? mapJournalEntryFromDB(result) : null;
};

export const deleteJournalEntry = async (entryId: string, userId: string): Promise<boolean> => {
  const db = getDatabase();
  
  const result = await db.result(`
    DELETE FROM journal_entries 
    WHERE id = $1 AND user_id = $2
  `, [entryId, userId]);

  return result.rowCount > 0;
};

export const searchJournalEntries = async (userId: string, query: string): Promise<JournalEntry[]> => {
  const db = getDatabase();
  
  const results = await db.any(`
    SELECT * FROM journal_entries 
    WHERE user_id = $1 
    AND (
      title ILIKE $2 
      OR content ILIKE $2 
      OR $3 = ANY(tags)
    )
    ORDER BY date DESC, created_at DESC
  `, [userId, `%${query}%`, query]);

  return results.map(mapJournalEntryFromDB);
};

export const getPinnedEntries = async (userId: string): Promise<JournalEntry[]> => {
  const db = getDatabase();
  
  const results = await db.any(`
    SELECT * FROM journal_entries 
    WHERE user_id = $1 AND pinned = TRUE
    ORDER BY date DESC, created_at DESC
  `, [userId]);

  return results.map(mapJournalEntryFromDB);
};

export const getJournalStats = async (userId: string): Promise<{
  totalEntries: number;
  thisMonthEntries: number;
  avgWordsPerEntry: number;
  totalWords: number;
}> => {
  const db = getDatabase();
  
  const result = await db.one(`
    SELECT 
      COUNT(*) as total_entries,
      COUNT(CASE WHEN date >= date_trunc('month', CURRENT_DATE) THEN 1 END) as this_month_entries,
      AVG(word_count) as avg_words_per_entry,
      SUM(word_count) as total_words
    FROM journal_entries 
    WHERE user_id = $1
  `, [userId]);

  return {
    totalEntries: parseInt(result.total_entries) || 0,
    thisMonthEntries: parseInt(result.this_month_entries) || 0,
    avgWordsPerEntry: Math.round(parseFloat(result.avg_words_per_entry) || 0),
    totalWords: parseInt(result.total_words) || 0,
  };
};

// Helper function to map database row to JournalEntry object
const mapJournalEntryFromDB = (row: any): JournalEntry => {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    date: new Date(row.date),
    tags: row.tags || [],
    pinned: row.pinned,
    mood: row.mood,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
};