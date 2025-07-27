/**
 * SQLite Journal Queries for Serenity Notes
 */

import Database from 'better-sqlite3';
import { JournalEntry } from '@serenity/core';
import { v4 as uuidv4 } from 'uuid';

export class SQLiteJournalQueries {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Get all journal entries
   */
  getAllEntries(): JournalEntry[] {
    const stmt = this.db.prepare(`
      SELECT 
        j.*,
        GROUP_CONCAT(jt.tag) as tags
      FROM journal_entries j
      LEFT JOIN journal_tags jt ON j.id = jt.entry_id
      GROUP BY j.id
      ORDER BY j.date DESC, j.created_at DESC
    `);

    const rows = stmt.all();
    return rows.map(this.rowToJournalEntry);
  }

  /**
   * Get journal entry by ID
   */
  getEntryById(id: string): JournalEntry | null {
    const stmt = this.db.prepare(`
      SELECT 
        j.*,
        GROUP_CONCAT(jt.tag) as tags
      FROM journal_entries j
      LEFT JOIN journal_tags jt ON j.id = jt.entry_id
      WHERE j.id = ?
      GROUP BY j.id
    `);

    const row = stmt.get(id);
    return row ? this.rowToJournalEntry(row) : null;
  }

  /**
   * Get entries by date range
   */
  getEntriesByDateRange(startDate: Date, endDate: Date): JournalEntry[] {
    const stmt = this.db.prepare(`
      SELECT 
        j.*,
        GROUP_CONCAT(jt.tag) as tags
      FROM journal_entries j
      LEFT JOIN journal_tags jt ON j.id = jt.entry_id
      WHERE j.date >= ? AND j.date <= ?
      GROUP BY j.id
      ORDER BY j.date DESC, j.created_at DESC
    `);

    const start = this.dateToString(startDate);
    const end = this.dateToString(endDate);
    const rows = stmt.all(start, end);
    return rows.map(this.rowToJournalEntry);
  }

  /**
   * Get entries for a specific date
   */
  getEntriesByDate(date: Date): JournalEntry[] {
    const dateStr = this.dateToString(date);
    
    const stmt = this.db.prepare(`
      SELECT 
        j.*,
        GROUP_CONCAT(jt.tag) as tags
      FROM journal_entries j
      LEFT JOIN journal_tags jt ON j.id = jt.entry_id
      WHERE j.date = ?
      GROUP BY j.id
      ORDER BY j.created_at DESC
    `);

    const rows = stmt.all(dateStr);
    return rows.map(this.rowToJournalEntry);
  }

  /**
   * Get pinned entries
   */
  getPinnedEntries(): JournalEntry[] {
    const stmt = this.db.prepare(`
      SELECT 
        j.*,
        GROUP_CONCAT(jt.tag) as tags
      FROM journal_entries j
      LEFT JOIN journal_tags jt ON j.id = jt.entry_id
      WHERE j.pinned = 1
      GROUP BY j.id
      ORDER BY j.date DESC, j.created_at DESC
    `);

    const rows = stmt.all();
    return rows.map(this.rowToJournalEntry);
  }

  /**
   * Create a new journal entry
   */
  createEntry(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): JournalEntry {
    const id = this.generateId();
    const now = new Date().toISOString();
    const dateStr = this.dateToString(entry.date);

    const stmt = this.db.prepare(`
      INSERT INTO journal_entries (
        id, title, content, mood, date, pinned, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      entry.title || null,
      entry.content,
      entry.mood || null,
      dateStr,
      entry.pinned ? 1 : 0,
      now,
      now
    );

    // Insert tags if provided
    if (entry.tags && entry.tags.length > 0) {
      this.updateEntryTags(id, entry.tags);
    }

    return this.getEntryById(id)!;
  }

  /**
   * Update a journal entry
   */
  updateEntry(id: string, updates: Partial<JournalEntry>): JournalEntry | null {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    // Build dynamic update query
    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.content !== undefined) {
      fields.push('content = ?');
      values.push(updates.content);
    }
    if (updates.mood !== undefined) {
      fields.push('mood = ?');
      values.push(updates.mood);
    }
    if (updates.date !== undefined) {
      fields.push('date = ?');
      values.push(this.dateToString(updates.date));
    }
    if (updates.pinned !== undefined) {
      fields.push('pinned = ?');
      values.push(updates.pinned ? 1 : 0);
    }

    if (fields.length === 0 && updates.tags === undefined) {
      return this.getEntryById(id);
    }

    if (fields.length > 0) {
      fields.push('updated_at = ?');
      values.push(now);
      values.push(id);

      const stmt = this.db.prepare(`
        UPDATE journal_entries 
        SET ${fields.join(', ')}
        WHERE id = ?
      `);

      stmt.run(...values);
    }

    // Update tags if provided
    if (updates.tags !== undefined) {
      this.updateEntryTags(id, updates.tags);
    }

    return this.getEntryById(id);
  }

  /**
   * Delete a journal entry
   */
  deleteEntry(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM journal_entries WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Toggle pin status of an entry
   */
  togglePin(id: string): JournalEntry | null {
    const entry = this.getEntryById(id);
    if (!entry) return null;

    return this.updateEntry(id, { pinned: !entry.pinned });
  }

  /**
   * Search journal entries
   */
  searchEntries(query: string): JournalEntry[] {
    const stmt = this.db.prepare(`
      SELECT 
        j.*,
        GROUP_CONCAT(jt.tag) as tags
      FROM journal_entries j
      LEFT JOIN journal_tags jt ON j.id = jt.entry_id
      WHERE j.title LIKE ? OR j.content LIKE ?
      GROUP BY j.id
      ORDER BY j.date DESC, j.created_at DESC
    `);

    const searchTerm = `%${query}%`;
    const rows = stmt.all(searchTerm, searchTerm);
    return rows.map(this.rowToJournalEntry);
  }

  /**
   * Get entries by tag
   */
  getEntriesByTag(tag: string): JournalEntry[] {
    const stmt = this.db.prepare(`
      SELECT 
        j.*,
        GROUP_CONCAT(jt.tag) as tags
      FROM journal_entries j
      LEFT JOIN journal_tags jt ON j.id = jt.entry_id
      WHERE j.id IN (
        SELECT entry_id FROM journal_tags WHERE tag = ?
      )
      GROUP BY j.id
      ORDER BY j.date DESC, j.created_at DESC
    `);

    const rows = stmt.all(tag);
    return rows.map(this.rowToJournalEntry);
  }

  /**
   * Get all unique tags
   */
  getAllTags(): string[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT tag FROM journal_tags 
      ORDER BY tag ASC
    `);

    const rows = stmt.all();
    return rows.map((row: any) => row.tag);
  }

  /**
   * Get entries statistics
   */
  getStatistics(): {
    totalEntries: number;
    pinnedEntries: number;
    entriesThisWeek: number;
    entriesThisMonth: number;
    uniqueTags: number;
  } {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now);
    monthStart.setDate(now.getDate() - 30);

    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM journal_entries');
    const pinnedStmt = this.db.prepare('SELECT COUNT(*) as count FROM journal_entries WHERE pinned = 1');
    const weekStmt = this.db.prepare('SELECT COUNT(*) as count FROM journal_entries WHERE date >= ?');
    const monthStmt = this.db.prepare('SELECT COUNT(*) as count FROM journal_entries WHERE date >= ?');
    const tagsStmt = this.db.prepare('SELECT COUNT(DISTINCT tag) as count FROM journal_tags');

    const total = (totalStmt.get() as { count: number }).count;
    const pinned = (pinnedStmt.get() as { count: number }).count;
    const week = (weekStmt.get(this.dateToString(weekStart)) as { count: number }).count;
    const month = (monthStmt.get(this.dateToString(monthStart)) as { count: number }).count;
    const tags = (tagsStmt.get() as { count: number }).count;

    return {
      totalEntries: total,
      pinnedEntries: pinned,
      entriesThisWeek: week,
      entriesThisMonth: month,
      uniqueTags: tags
    };
  }

  /**
   * Update entry tags
   */
  private updateEntryTags(entryId: string, tags: string[]): void {
    // Delete existing tags
    const deleteStmt = this.db.prepare('DELETE FROM journal_tags WHERE entry_id = ?');
    deleteStmt.run(entryId);

    // Insert new tags
    if (tags.length > 0) {
      const insertStmt = this.db.prepare('INSERT INTO journal_tags (entry_id, tag) VALUES (?, ?)');
      
      for (const tag of tags) {
        insertStmt.run(entryId, tag);
      }
    }
  }

  /**
   * Convert database row to JournalEntry object
   */
  private rowToJournalEntry(row: any): JournalEntry {
    return {
      id: row.id,
      title: row.title || undefined,
      content: row.content,
      mood: row.mood || undefined,
      date: new Date(row.date),
      pinned: Boolean(row.pinned),
      tags: row.tags ? row.tags.split(',').filter(Boolean) : [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Convert Date to string (YYYY-MM-DD)
   */
  private dateToString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return uuidv4();
  }
}