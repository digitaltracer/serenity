/**
 * Summary IPC Handlers
 * Handles date-range based summary generation and management
 */

import { ipcMain, app, dialog } from 'electron';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { logger, AISummarizationService } from '@serenity/core';

// Runtime validation schemas
const GenerateSummarySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  types: z.array(z.enum(['tasks', 'journal'])),
});

/**
 * Register all summary-related IPC handlers
 */
export function registerSummaryHandlers() {
  logger.info('Registering summary IPC handlers...', {
    component: 'summaryHandlers',
    operation: 'registerSummaryHandlers',
  });

  /**
   * Generate a new summary
   */
  ipcMain.handle('summary:generate', async (event, params) => {
    try {
      // Validate input
      const validated = GenerateSummarySchema.parse(params);
      const { startDate, endDate, types } = validated;

      logger.info('[summary:generate] Generating summary', {
        component: 'summaryHandlers',
        operation: 'generateSummary',
        metadata: { startDate, endDate, types },
      });

      // Get database service
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();

      // Fetch tasks and journal entries
      const allTasks = await sqliteService.getTasks();
      const allJournals = await sqliteService.getJournalEntries();

      // Get AI settings to determine provider
      const settingsPath = path.join(app.getPath('userData'), 'ai-settings.json');
      let provider: 'openai' | 'gemini' | 'anthropic' | 'local' = 'local';

      try {
        if (fs.existsSync(settingsPath)) {
          const settingsData = fs.readFileSync(settingsPath, 'utf-8');
          const settings = JSON.parse(settingsData);
          provider = settings.activeProvider || 'local';
        }
      } catch (e) {
        logger.warn('[summary:generate] Failed to load AI settings, using local provider', {
          component: 'summaryHandlers',
          operation: 'loadSettings',
        });
      }

      // Filter data by date range
      const filteredTasks = allTasks.filter(task => {
        const taskDate = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return taskDate >= start && taskDate <= end;
      });

      const filteredJournals = allJournals.filter(entry => {
        const entryDate = new Date(entry.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return entryDate >= start && entryDate <= end;
      });

      // Generate unique ID
      const id = `summary_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      let summaryResult: any;
      let promptTokens = 0;
      let completionTokens = 0;
      let totalTokens = 0;

      // If using AI provider, make the API call
      if (provider !== 'local') {
        logger.info('[summary:generate] Using AI provider, building prompt...', {
          component: 'summaryHandlers',
          operation: 'generateSummary',
          metadata: { provider, taskCount: filteredTasks.length, journalCount: filteredJournals.length }
        });

        // Build prompt for AI
        const prompt = AISummarizationService.buildSummaryPrompt(
          filteredTasks,
          filteredJournals,
          types,
          startDate,
          endDate
        );

        logger.info('[summary:generate] Calling AI provider with failover...', {
          component: 'summaryHandlers',
          operation: 'generateSummary'
        });

        // Import the failover function from aiAssistantHandlers
        const aiHandlerModule = await import('./aiAssistantHandlers');
        const makeAIApiCallWithFailover = (aiHandlerModule as any).makeAIApiCallWithFailover;

        if (!makeAIApiCallWithFailover) {
          throw new Error('makeAIApiCallWithFailover not exported from aiAssistantHandlers');
        }

        const aiResult = await makeAIApiCallWithFailover(prompt);

        if (!aiResult.success) {
          logger.error('[summary:generate] AI provider call failed', {
            component: 'summaryHandlers',
            operation: 'generateSummary',
            metadata: { error: aiResult.error }
          });
          throw new Error(`AI provider failed: ${aiResult.error}`);
        }

        logger.info('[summary:generate] AI provider call succeeded', {
          component: 'summaryHandlers',
          operation: 'generateSummary',
          metadata: {
            provider: aiResult.provider,
            credentialName: aiResult.credentialName,
            contentLength: aiResult.content?.length || 0
          }
        });

        // Extract token usage
        const usage = aiResult.usage || aiResult.rawData?.usage || {};
        if (usage.prompt_tokens || usage.promptTokens || usage.input_tokens) {
          promptTokens = usage.prompt_tokens || usage.promptTokens || usage.input_tokens || 0;
          completionTokens = usage.completion_tokens || usage.completionTokens || usage.output_tokens || 0;
          totalTokens = usage.total_tokens || usage.totalTokens || (promptTokens + completionTokens);
        }

        // Parse AI response
        const content = aiResult.content || '';
        const wordCount = content.trim().split(/\s+/).length;

        // Extract title from the AI response (first # heading or generate one)
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch
          ? titleMatch[1].trim()
          : `Summary: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;

        // Determine summary type
        const summaryType = types.length === 2 ? 'combined' : types[0];

        summaryResult = {
          title,
          content,
          summaryType,
          wordCount,
          metadata: {} // AI doesn't provide structured metadata
        };
      } else {
        // Use local summary generation
        logger.info('[summary:generate] Using local summary generation', {
          component: 'summaryHandlers',
          operation: 'generateSummary'
        });

        summaryResult = await AISummarizationService.generateSummary({
          provider,
          startDate,
          endDate,
          types,
          tasks: allTasks,
          journalEntries: allJournals,
        });
      }

      // Create summary object
      const summary = {
        id,
        title: summaryResult.title,
        content: summaryResult.content,
        summaryType: summaryResult.summaryType,
        startDate,
        endDate,
        generatedAt: new Date().toISOString(),
        wordCount: summaryResult.wordCount,
        metadata: summaryResult.metadata,
        provider,
        promptTokens,
        completionTokens,
        totalTokens,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store in database
      await sqliteService.createSummary({
        id: summary.id,
        title: summary.title,
        content: summary.content,
        summaryType: summary.summaryType,
        startDate: summary.startDate,
        endDate: summary.endDate,
        wordCount: summary.wordCount,
        metadata: JSON.stringify(summary.metadata),
        provider: summary.provider,
        promptTokens: summary.promptTokens,
        completionTokens: summary.completionTokens,
        totalTokens: summary.totalTokens,
      });

      // If tokens were used, record in ai_usage table
      if (summary.totalTokens > 0) {
        await sqliteService.addAIUsage([
          {
            provider: summary.provider as 'openai' | 'gemini' | 'anthropic',
            operation: 'summary', // Record as summary operation
            promptTokens: summary.promptTokens,
            completionTokens: summary.completionTokens,
            totalTokens: summary.totalTokens,
          },
        ]);
      }

      logger.info('[summary:generate] Summary generated successfully', {
        component: 'summaryHandlers',
        operation: 'generateSummary',
        metadata: { summaryId: summary.id },
      });

      return {
        success: true,
        summary,
      };
    } catch (error) {
      logger.error('[summary:generate] Failed to generate summary', {
        component: 'summaryHandlers',
        operation: 'generateSummary',
      }, error as Error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate summary',
      };
    }
  });

  /**
   * Get all summaries
   */
  ipcMain.handle('summary:getAll', async () => {
    try {
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();

      const summaries = await sqliteService.getAllSummaries();

      // Parse metadata JSON strings
      const parsedSummaries = summaries.map((s: any) => ({
        ...s,
        metadata: typeof s.metadata === 'string' ? JSON.parse(s.metadata) : s.metadata,
      }));

      return {
        success: true,
        summaries: parsedSummaries,
      };
    } catch (error) {
      logger.error('[summary:getAll] Failed to fetch summaries', {
        component: 'summaryHandlers',
        operation: 'getAllSummaries',
      }, error as Error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch summaries',
        summaries: [],
      };
    }
  });

  /**
   * Get summary by ID
   */
  ipcMain.handle('summary:getById', async (event, id: string) => {
    try {
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();

      const summary = await sqliteService.getSummaryById(id);

      if (!summary) {
        return {
          success: false,
          error: 'Summary not found',
        };
      }

      // Parse metadata JSON string
      const parsedSummary = {
        ...summary,
        metadata: typeof summary.metadata === 'string' ? JSON.parse(summary.metadata) : summary.metadata,
      };

      return {
        success: true,
        summary: parsedSummary,
      };
    } catch (error) {
      logger.error('[summary:getById] Failed to fetch summary', {
        component: 'summaryHandlers',
        operation: 'getSummaryById',
        metadata: { id },
      }, error as Error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch summary',
      };
    }
  });

  /**
   * Delete a summary
   */
  ipcMain.handle('summary:delete', async (event, id: string) => {
    try {
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();

      const deleted = await sqliteService.deleteSummary(id);

      if (!deleted) {
        return {
          success: false,
          error: 'Summary not found or could not be deleted',
        };
      }

      logger.info('[summary:delete] Summary deleted successfully', {
        component: 'summaryHandlers',
        operation: 'deleteSummary',
        metadata: { summaryId: id },
      });

      return {
        success: true,
      };
    } catch (error) {
      logger.error('[summary:delete] Failed to delete summary', {
        component: 'summaryHandlers',
        operation: 'deleteSummary',
        metadata: { id },
      }, error as Error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete summary',
      };
    }
  });

  /**
   * Export summary to markdown
   */
  ipcMain.handle('summary:export', async (event, id: string, format: string) => {
    try {
      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();

      // Get the summary
      const summary = await sqliteService.getSummaryById(id);

      if (!summary) {
        return {
          success: false,
          error: 'Summary not found',
        };
      }

      // Only support markdown for now
      if (format !== 'markdown') {
        return {
          success: false,
          error: 'Only markdown format is currently supported',
        };
      }

      // Show save dialog
      const result = await dialog.showSaveDialog({
        title: 'Export Summary',
        defaultPath: `${summary.title.replace(/[^a-z0-9]/gi, '_')}.md`,
        filters: [
          { name: 'Markdown', extensions: ['md'] },
        ],
      });

      if (result.canceled || !result.filePath) {
        return {
          success: false,
          error: 'Export canceled',
        };
      }

      // Generate markdown content
      let markdownContent = `# ${summary.title}\n\n`;
      markdownContent += `**Generated:** ${new Date(summary.generated_at).toLocaleString()}\n`;
      markdownContent += `**Period:** ${new Date(summary.start_date).toLocaleDateString()} - ${new Date(summary.end_date).toLocaleDateString()}\n`;
      markdownContent += `**Type:** ${summary.summary_type}\n\n`;
      markdownContent += `---\n\n`;
      markdownContent += summary.content;

      // Write to file
      fs.writeFileSync(result.filePath, markdownContent, 'utf-8');

      logger.info('[summary:export] Summary exported successfully', {
        component: 'summaryHandlers',
        operation: 'exportSummary',
        metadata: { summaryId: id, path: result.filePath },
      });

      return {
        success: true,
        path: result.filePath,
      };
    } catch (error) {
      logger.error('[summary:export] Failed to export summary', {
        component: 'summaryHandlers',
        operation: 'exportSummary',
        metadata: { id, format },
      }, error as Error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export summary',
      };
    }
  });

  logger.info('✅ Summary IPC handlers registered', {
    component: 'summaryHandlers',
    operation: 'registerSummaryHandlers',
  });
}
