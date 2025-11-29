import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { journalService } from '../services/JournalService.js';
import {
  createJournalSchema,
  updateJournalSchema,
  journalFiltersSchema,
  deleteJournalSchema,
  searchJournalSchema,
  getEntryByDateSchema,
} from '../utils/validation.js';
import logger from '../utils/logger.js';
import type { UserContext } from './tasks.js';

// Import toolHandlers from tasks to add to the same map
import { toolHandlers } from './tasks.js';

/**
 * Register all journal-related tools
 * This stores handlers in the shared toolHandlers map
 */
export function registerJournalTools(_server: Server) {
  /**
   * Tool: get-journal-entries
   * Retrieve journal entries with optional filters
   */
  toolHandlers['get-journal-entries'] = async (params: any, context: UserContext) => {
    logger.info('Tool called: get-journal-entries', {
      userId: context.userId,
      params,
    });

    try {
      // Validate and parse filters
      const filters = journalFiltersSchema.parse(params || {});

      // Get journal entries from service
      const entries = await journalService.getJournalEntries(context.userId, filters);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            entries,
            count: entries.length,
            filters,
          }, null, 2),
        }],
      };
    } catch (error) {
      logger.error('Error in get-journal-entries tool', {
        error: error instanceof Error ? error.message : String(error),
        userId: context.userId,
      });
      throw error;
    }
  };

  /**
   * Tool: create-journal-entry
   * Create a new journal entry
   */
  toolHandlers['create-journal-entry'] = async (params: any, context: UserContext) => {
    logger.info('Tool called: create-journal-entry', {
      userId: context.userId,
      params,
    });

    try {
      // Validate input
      const data = createJournalSchema.parse(params);

      // Create journal entry
      const entry = await journalService.createJournalEntry(context.userId, {
        title: data.title,
        content: data.content,
        mood: data.mood,
        tags: data.tags,
        date: data.date,
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            entry,
            message: `Journal entry "${entry.title}" created successfully`,
          }, null, 2),
        }],
      };
    } catch (error) {
      logger.error('Error in create-journal-entry tool', {
        error: error instanceof Error ? error.message : String(error),
        userId: context.userId,
      });
      throw error;
    }
  };

  /**
   * Tool: update-journal-entry
   * Update an existing journal entry
   */
  toolHandlers['update-journal-entry'] = async (params: any, context: UserContext) => {
    logger.info('Tool called: update-journal-entry', {
      userId: context.userId,
      params,
    });

    try {
      const { entryId, ...updateData } = params;

      if (!entryId) {
        throw new Error('entryId is required');
      }

      // Validate update data
      const validatedData = updateJournalSchema.parse(updateData);

      // Update journal entry
      const entry = await journalService.updateJournalEntry(context.userId, entryId, validatedData);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            entry,
            message: `Journal entry "${entry.title}" updated successfully`,
          }, null, 2),
        }],
      };
    } catch (error) {
      logger.error('Error in update-journal-entry tool', {
        error: error instanceof Error ? error.message : String(error),
        userId: context.userId,
      });
      throw error;
    }
  };

  /**
   * Tool: delete-journal-entry
   * Delete a journal entry (soft delete)
   */
  toolHandlers['delete-journal-entry'] = async (params: any, context: UserContext) => {
    logger.info('Tool called: delete-journal-entry', {
      userId: context.userId,
      params,
    });

    try {
      // Validate input
      const { entryId } = deleteJournalSchema.parse(params);

      // Delete journal entry
      await journalService.deleteJournalEntry(context.userId, entryId);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Journal entry deleted successfully',
          }, null, 2),
        }],
      };
    } catch (error) {
      logger.error('Error in delete-journal-entry tool', {
        error: error instanceof Error ? error.message : String(error),
        userId: context.userId,
      });
      throw error;
    }
  };

  /**
   * Tool: search-journal
   * Full-text search across journal entries
   */
  toolHandlers['search-journal'] = async (params: any, context: UserContext) => {
    logger.info('Tool called: search-journal', {
      userId: context.userId,
      params,
    });

    try {
      // Validate input
      const { query, limit } = searchJournalSchema.parse(params);

      // Search journal entries
      const results = await journalService.searchJournal(context.userId, query, limit);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            results,
            count: results.length,
            query,
          }, null, 2),
        }],
      };
    } catch (error) {
      logger.error('Error in search-journal tool', {
        error: error instanceof Error ? error.message : String(error),
        userId: context.userId,
      });
      throw error;
    }
  };

  /**
   * Tool: get-entry-by-date
   * Get journal entry for a specific date
   */
  toolHandlers['get-entry-by-date'] = async (params: any, context: UserContext) => {
    logger.info('Tool called: get-entry-by-date', {
      userId: context.userId,
      params,
    });

    try {
      // Validate input
      const { date } = getEntryByDateSchema.parse(params);

      // Get entry by date
      const entry = await journalService.getJournalEntryByDate(context.userId, date);

      if (!entry) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              entry: null,
              message: `No journal entry found for ${date}`,
            }, null, 2),
          }],
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            entry,
            message: `Found journal entry for ${date}`,
          }, null, 2),
        }],
      };
    } catch (error) {
      logger.error('Error in get-entry-by-date tool', {
        error: error instanceof Error ? error.message : String(error),
        userId: context.userId,
      });
      throw error;
    }
  };

  logger.info('Journal tools registered successfully', {
    tools: ['get-journal-entries', 'create-journal-entry', 'update-journal-entry', 'delete-journal-entry', 'search-journal', 'get-entry-by-date'],
  });
}
