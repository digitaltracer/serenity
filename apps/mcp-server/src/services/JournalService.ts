import { db } from '../utils/pool.js';
import logger from '../utils/logger.js';
import { NotFoundError, ValidationError, DatabaseError } from '../utils/errors.js';
import type {
  JournalEntry,
  CreateJournalData,
  UpdateJournalData,
  JournalFilters,
  SearchResult,
} from '../types/index.js';

/**
 * Journal Service
 * Uses shared database pool for database operations
 */
export class JournalService {
  constructor() {
    // No initialization needed - uses shared pool
  }

  /**
   * Get journal entries for a user with optional filters
   */
  async getJournalEntries(userId: string, filters?: JournalFilters): Promise<JournalEntry[]> {
    logger.info('Getting journal entries', { userId, filters });

    try {
      let query = `
        SELECT
          id,
          user_id as "userId",
          title,
          content,
          mood,
          tags,
          date,
          pinned,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM journal_entries
        WHERE user_id = $1
      `;

      const params: any[] = [userId];
      let paramIndex = 2;

      // Apply filters
      if (filters?.dateFrom) {
        query += ` AND date >= $${paramIndex++}`;
        params.push(filters.dateFrom);
      }

      if (filters?.dateTo) {
        query += ` AND date <= $${paramIndex++}`;
        params.push(filters.dateTo);
      }

      if (filters?.mood) {
        query += ` AND mood = $${paramIndex++}`;
        params.push(filters.mood);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query += ` AND tags && $${paramIndex++}`;
        params.push(filters.tags);
      }

      query += ` ORDER BY date DESC, created_at DESC`;

      if (filters?.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      if (filters?.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(filters.offset);
      }

      const result = await db.query(query, params);

      logger.info('Journal entries retrieved successfully', {
        userId,
        count: result.rows.length,
      });

      return result.rows as JournalEntry[];
    } catch (error) {
      logger.error('Failed to get journal entries', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        filters,
      });
      throw new DatabaseError('Failed to retrieve journal entries');
    }
  }

  /**
   * Get a single journal entry by ID
   */
  async getJournalEntryById(userId: string, entryId: string): Promise<JournalEntry | null> {
    logger.info('Getting journal entry by ID', { userId, entryId });

    try {
      const query = `
        SELECT
          id,
          user_id as "userId",
          title,
          content,
          mood,
          tags,
          date,
          pinned,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM journal_entries
        WHERE id = $1 AND user_id = $2
      `;

      const result = await db.query(query, [entryId, userId]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as JournalEntry;
    } catch (error) {
      logger.error('Failed to get journal entry by ID', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        entryId,
      });
      throw new DatabaseError('Failed to retrieve journal entry');
    }
  }

  /**
   * Get journal entry by date
   */
  async getJournalEntryByDate(userId: string, date: Date | string): Promise<JournalEntry | null> {
    logger.info('Getting journal entry by date', { userId, date });

    try {
      const query = `
        SELECT
          id,
          user_id as "userId",
          title,
          content,
          mood,
          tags,
          date,
          pinned,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM journal_entries
        WHERE user_id = $1
          AND date::date = $2::date
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const result = await db.query(query, [userId, date]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as JournalEntry;
    } catch (error) {
      logger.error('Failed to get journal entry by date', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        date,
      });
      throw new DatabaseError('Failed to retrieve journal entry');
    }
  }

  /**
   * Create a new journal entry
   */
  async createJournalEntry(userId: string, data: CreateJournalData): Promise<JournalEntry> {
    logger.info('Creating journal entry', { userId, title: data.title });

    try {
      // Insert journal entry
      const entryResult = await db.query(
        `INSERT INTO journal_entries (
          user_id, title, content, mood, tags, date
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          id,
          user_id as "userId",
          title,
          content,
          mood,
          tags,
          date,
          pinned,
          created_at as "createdAt",
          updated_at as "updatedAt"`,
        [
          userId,
          data.title || null,
          data.content,
          data.mood || null,
          data.tags || [],
          data.date || new Date(),
        ]
      );

      const entry = entryResult.rows[0] as JournalEntry;

      logger.info('Journal entry created successfully', { entryId: entry.id });
      return entry;
    } catch (error) {
      logger.error('Failed to create journal entry', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        data,
      });
      throw new DatabaseError('Failed to create journal entry');
    }
  }

  /**
   * Update an existing journal entry
   */
  async updateJournalEntry(userId: string, entryId: string, data: UpdateJournalData): Promise<JournalEntry> {
    logger.info('Updating journal entry', { userId, entryId, data });

    try {
      // Verify ownership
      const ownershipCheck = await db.query(
        `SELECT id FROM journal_entries WHERE id = $1 AND user_id = $2`,
        [entryId, userId]
      );

      if (ownershipCheck.rows.length === 0) {
        throw new NotFoundError('Journal entry not found or access denied');
      }

      // Build dynamic update query
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        values.push(data.title);
      }

      if (data.content !== undefined) {
        updates.push(`content = $${paramIndex++}`);
        values.push(data.content);
      }

      if (data.mood !== undefined) {
        updates.push(`mood = $${paramIndex++}`);
        values.push(data.mood);
      }

      if (data.tags !== undefined) {
        updates.push(`tags = $${paramIndex++}`);
        values.push(data.tags);
      }

      if (updates.length === 0) {
        throw new ValidationError('No fields to update');
      }

      updates.push(`updated_at = NOW()`);
      values.push(entryId);

      const query = `
        UPDATE journal_entries
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING
          id,
          user_id as "userId",
          title,
          content,
          mood,
          tags,
          date,
          pinned,
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      const result = await db.query(query, values);

      logger.info('Journal entry updated successfully', { entryId });
      return result.rows[0] as JournalEntry;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Failed to update journal entry', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        entryId,
        data,
      });
      throw new DatabaseError('Failed to update journal entry');
    }
  }

  /**
   * Delete a journal entry (hard delete)
   */
  async deleteJournalEntry(userId: string, entryId: string): Promise<void> {
    logger.info('Deleting journal entry', { userId, entryId });

    try {
      const result = await db.query(
        `DELETE FROM journal_entries
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [entryId, userId]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Journal entry not found or access denied');
      }

      logger.info('Journal entry deleted successfully', { entryId });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to delete journal entry', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        entryId,
      });
      throw new DatabaseError('Failed to delete journal entry');
    }
  }

  /**
   * Search journal entries with full-text search
   */
  async searchJournal(userId: string, query: string, limit: number = 20): Promise<SearchResult[]> {
    logger.info('Searching journal', { userId, query, limit });

    try {
      // PostgreSQL full-text search
      const searchQuery = `
        SELECT
          id,
          user_id as "userId",
          title,
          content,
          mood,
          tags,
          date,
          pinned,
          created_at as "createdAt",
          updated_at as "updatedAt",
          ts_rank(
            to_tsvector('english', COALESCE(title, '') || ' ' || content),
            plainto_tsquery('english', $2)
          ) as relevance_score,
          ts_headline(
            'english',
            content,
            plainto_tsquery('english', $2),
            'MaxWords=50, MinWords=25'
          ) as highlight
        FROM journal_entries
        WHERE user_id = $1
          AND (
            to_tsvector('english', COALESCE(title, '') || ' ' || content) @@
            plainto_tsquery('english', $2)
          )
        ORDER BY relevance_score DESC, date DESC
        LIMIT $3
      `;

      const result = await db.query(
        searchQuery,
        [userId, query, limit]
      );

      const results: SearchResult[] = result.rows.map((row: any) => {
        const { relevance_score, highlight, ...entry } = row;
        return {
          entry: entry as JournalEntry,
          relevanceScore: relevance_score,
          highlight,
        };
      });

      logger.info('Journal search completed', {
        userId,
        query,
        resultCount: results.length,
      });

      return results;
    } catch (error) {
      logger.error('Failed to search journal', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        query,
      });
      throw new DatabaseError('Failed to search journal entries');
    }
  }
}

// Export singleton instance
export const journalService = new JournalService();
