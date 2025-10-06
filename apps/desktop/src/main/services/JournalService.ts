/**
 * Journal Business Logic Service
 * Handles journal operations with validation and business rules
 */

import type { JournalEntry } from '@serenity/core';
import { logger } from '@serenity/core';

interface JournalEntryData {
  title: string;
  content: string;
  date: Date;
  mood?: string;
  tags: string[];
  pinned: boolean;
}

interface JournalEntryUpdate {
  title?: string;
  content?: string;
  date?: Date;
  mood?: string;
  tags?: string[];
  pinned?: boolean;
}

interface SQLiteService {
  initialize(): Promise<void>;
  getJournalEntries(): Promise<JournalEntry[]>;
  createJournalEntry(entry: JournalEntryData): Promise<JournalEntry>;
  updateJournalEntry(id: string, updates: JournalEntryUpdate): Promise<JournalEntry>;
  deleteJournalEntry(id: string): Promise<boolean>;
  getJournalEntry(id: string): Promise<JournalEntry | null>;
}

export class JournalService {
  private sqliteService: SQLiteService | null = null;

  private async getSqliteService(): Promise<SQLiteService> {
    if (!this.sqliteService) {
      const { sqliteService } = await import('@serenity/database');
      this.sqliteService = sqliteService as SQLiteService;
      await this.sqliteService.initialize();
    }
    return this.sqliteService;
  }

  /**
   * Get all journal entries with business logic
   */
  async getAllJournalEntries() {
    try {
      logger.info('📖 JournalService: Getting all journal entries', { component: 'JournalService', operation: 'journalservice:GettingAll' });
      const service = await this.getSqliteService();
      const entries = await service.getJournalEntries();
      
      // Business logic: Sort entries by date (newest first), with pinned entries on top
      const sortedEntries = entries.sort((a: JournalEntry, b: JournalEntry) => {
        // Pinned entries first
        if (a.pinned !== b.pinned) {
          return b.pinned ? 1 : -1;
        }
        
        // Then by date (newest first)
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      logger.info(`✅ JournalService: Retrieved ${sortedEntries.length} journal entries`, { component: 'JournalService', operation: 'journalservice:Retrieved${sortedentries.length}' });
      return { success: true, data: sortedEntries };
    } catch (error) {
      logger.error('❌ JournalService: Failed to get journal entries:', { component: 'JournalService', operation: 'journalservice:FailedGet' }, error as Error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to retrieve journal entries' 
      };
    }
  }

  /**
   * Create a new journal entry with validation
   */
  async createJournalEntry(entryData: JournalEntryData) {
    try {
      logger.info(`📝 JournalService: Creating new journal entry: ${entryData.title}`, { component: 'JournalService', operation: 'journalservice:CreatingNew' });
      
      // Validation
      if (!entryData.title || entryData.title.trim().length === 0) {
        return { success: false, error: 'Journal entry title is required' };
      }
      
      if (entryData.title.length > 200) {
        return { success: false, error: 'Journal entry title cannot exceed 200 characters' };
      }
      
      if (!entryData.content || entryData.content.trim().length === 0) {
        return { success: false, error: 'Journal entry content is required' };
      }
      
      if (entryData.content.length > 50000) {
        return { success: false, error: 'Journal entry content cannot exceed 50,000 characters' };
      }
      
      if (entryData.tags && entryData.tags.length > 15) {
        return { success: false, error: 'Cannot have more than 15 tags per journal entry' };
      }
      
      // Validate date format
      if (entryData.date && isNaN(entryData.date.getTime())) {
        return { success: false, error: 'Invalid date format' };
      }
      
      // Validate mood values
      const validMoods = ['😊', '😐', '😢', '😡', '😴', '🤔', '😮', '😍', '🤯', '🥳'];
      if (entryData.mood && !validMoods.includes(entryData.mood)) {
        return { success: false, error: 'Invalid mood value' };
      }

      // Business logic: Sanitize and format data
      const sanitizedEntry = {
        ...entryData,
        title: entryData.title.trim(),
        content: entryData.content.trim(),
        date: entryData.date || new Date(),
        tags: entryData.tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const service = await this.getSqliteService();
      const newEntry = await service.createJournalEntry(sanitizedEntry);
      
      logger.info(`✅ JournalService: Journal entry created successfully: ${newEntry.id}`, { component: 'JournalService', operation: 'journalservice:JournalEntry' });
      return { success: true, data: newEntry };
    } catch (error) {
      logger.error('❌ JournalService: Failed to create journal entry:', { component: 'JournalService', operation: 'journalservice:FailedCreate' }, error as Error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create journal entry' 
      };
    }
  }

  /**
   * Update a journal entry with validation and business rules
   */
  async updateJournalEntry(id: string, updates: JournalEntryUpdate) {
    try {
      logger.info('📝 JournalService: Updating journal entry:', {  component: 'JournalService', operation: 'journalservice:UpdatingJournal' , metadata: { value: id } });
      
      // Validation
      if (!id || id.trim().length === 0) {
        return { success: false, error: 'Journal entry ID is required' };
      }
      
      if (updates.title !== undefined) {
        if (updates.title.trim().length === 0) {
          return { success: false, error: 'Journal entry title cannot be empty' };
        }
        if (updates.title.length > 200) {
          return { success: false, error: 'Journal entry title cannot exceed 200 characters' };
        }
      }
      
      if (updates.content !== undefined) {
        if (updates.content.trim().length === 0) {
          return { success: false, error: 'Journal entry content cannot be empty' };
        }
        if (updates.content.length > 50000) {
          return { success: false, error: 'Journal entry content cannot exceed 50,000 characters' };
        }
      }
      
      if (updates.tags && updates.tags.length > 15) {
        return { success: false, error: 'Cannot have more than 15 tags per journal entry' };
      }
      
      if (updates.date && isNaN(updates.date.getTime())) {
        return { success: false, error: 'Invalid date format' };
      }
      
      const validMoods = ['😊', '😐', '😢', '😡', '😴', '🤔', '😮', '😍', '🤯', '🥳'];
      if (updates.mood && !validMoods.includes(updates.mood)) {
        return { success: false, error: 'Invalid mood value' };
      }

      // Business logic: Sanitize updates
      const sanitizedUpdates: any = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      if (updates.title !== undefined) {
        sanitizedUpdates.title = updates.title.trim();
      }
      
      if (updates.content !== undefined) {
        sanitizedUpdates.content = updates.content.trim();
      }
      
      if (updates.tags) {
        sanitizedUpdates.tags = updates.tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
      }

      const service = await this.getSqliteService();
      const updatedEntry = await service.updateJournalEntry(id, sanitizedUpdates);
      
      logger.info('✅ JournalService: Journal entry updated successfully:', {  component: 'JournalService', operation: 'journalservice:JournalEntry' , metadata: { value: id } });
      return { success: true, data: updatedEntry };
    } catch (error) {
      logger.error('❌ JournalService: Failed to update journal entry:', { component: 'JournalService', operation: 'journalservice:FailedUpdate' }, error as Error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update journal entry' 
      };
    }
  }

  /**
   * Delete a journal entry
   */
  async deleteJournalEntry(id: string) {
    try {
      logger.info('🗑️ JournalService: Deleting journal entry:', {  component: 'JournalService', operation: '🗑️Journalservice:Deleting' , metadata: { value: id } });
      
      // Validation
      if (!id || id.trim().length === 0) {
        return { success: false, error: 'Journal entry ID is required' };
      }

      const service = await this.getSqliteService();
      const deleted = await service.deleteJournalEntry(id);
      
      logger.info('✅ JournalService: Journal entry deleted successfully:', {  component: 'JournalService', operation: 'journalservice:JournalEntry' , metadata: { value: id } });
      return { success: true, data: deleted };
    } catch (error) {
      logger.error('❌ JournalService: Failed to delete journal entry:', { component: 'JournalService', operation: 'journalservice:FailedDelete' }, error as Error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete journal entry' 
      };
    }
  }

  /**
   * Pin a journal entry (business logic wrapper)
   */
  async pinJournalEntry(id: string) {
    logger.info('📌 JournalService: Pinning journal entry:', {  component: 'JournalService', operation: 'journalservice:PinningJournal' , metadata: { value: id } });
    return this.updateJournalEntry(id, { pinned: true });
  }

  /**
   * Unpin a journal entry (business logic wrapper)
   */
  async unpinJournalEntry(id: string) {
    logger.info('📌 JournalService: Unpinning journal entry:', {  component: 'JournalService', operation: 'journalservice:UnpinningJournal' , metadata: { value: id } });
    return this.updateJournalEntry(id, { pinned: false });
  }

  /**
   * Get journal entries by date range (business logic)
   */
  async getJournalEntriesByDateRange(startDate: string, endDate: string) {
    try {
      logger.info(`📅 JournalService: Getting journal entries by date range: ${startDate} to ${endDate}`, { component: 'JournalService', operation: 'journalservice:GettingJournal' });
      
      // Validation
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (!startDate || isNaN(start.getTime())) {
        return { success: false, error: 'Invalid start date' };
      }
      
      if (!endDate || isNaN(end.getTime())) {
        return { success: false, error: 'Invalid end date' };
      }
      
      if (start > end) {
        return { success: false, error: 'Start date cannot be after end date' };
      }

      const service = await this.getSqliteService();
      const allEntries = await service.getJournalEntries();
      
      // Filter entries by date range
      const filteredEntries = allEntries.filter((entry: any) => {
        const entryDate = new Date(entry.date);
        return entryDate >= start && entryDate <= end;
      });
      
      // Sort by date (newest first)
      const sortedEntries = filteredEntries.sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      logger.info(`✅ JournalService: Retrieved ${sortedEntries.length} entries for date range`, { component: 'JournalService', operation: 'journalservice:Retrieved${sortedentries.length}' });
      return { success: true, data: sortedEntries };
    } catch (error) {
      logger.error('❌ JournalService: Failed to get journal entries by date range:', { component: 'JournalService', operation: 'journalservice:FailedGet' }, error as Error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get journal entries by date range' 
      };
    }
  }

  /**
   * Get journal statistics (business logic)
   */
  async getJournalStats() {
    try {
      logger.info('📊 JournalService: Getting journal statistics', { component: 'JournalService', operation: 'journalservice:GettingJournal' });

      const service = await this.getSqliteService();
      const entries = await service.getJournalEntries();
      
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      
      const stats = {
        totalEntries: entries.length,
        pinnedEntries: entries.filter((entry: any) => entry.pinned).length,
        entriesLast30Days: entries.filter((entry: any) => new Date(entry.date) >= thirtyDaysAgo).length,
        entriesLast7Days: entries.filter((entry: any) => new Date(entry.date) >= sevenDaysAgo).length,
        averageWordsPerEntry: entries.length > 0 
          ? Math.round(entries.reduce((sum: number, entry: any) => 
              sum + entry.content.split(/\s+/).length, 0) / entries.length)
          : 0,
        moodDistribution: this.calculateMoodDistribution(entries),
        writingStreak: this.calculateWritingStreak(entries)
      };
      
      logger.info('✅ JournalService: Journal statistics calculated', { component: 'JournalService', operation: 'journalservice:JournalStatistics' });
      return { success: true, data: stats };
    } catch (error) {
      logger.error('❌ JournalService: Failed to get journal statistics:', { component: 'JournalService', operation: 'journalservice:FailedGet' }, error as Error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get journal statistics' 
      };
    }
  }

  private calculateMoodDistribution(entries: any[]) {
    const moodCounts: { [key: string]: number } = {};
    entries.forEach(entry => {
      if (entry.mood) {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      }
    });
    return moodCounts;
  }

  private calculateWritingStreak(entries: any[]) {
    if (entries.length === 0) return 0;
    
    // Sort entries by date
    const sortedEntries = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff > streak) {
        break;
      }
    }
    
    return streak;
  }
}

export const journalService = new JournalService();