/**
 * Insights IPC Handlers
 * Handles IPC communication for the Insights Hub
 */

import { ipcMain } from 'electron';
import { logger, VisualizationService } from '@serenity/core';
import type { KPIMetrics, TimeRange } from '@serenity/core/dist/services/visualizationService';
import { apiService } from '../services/ApiService';

/**
 * Register all insights-related IPC handlers
 */
export function registerInsightsHandlers(): void {
  logger.info('📊 Registering Insights IPC handlers...', { component: 'insightsHandlers', operation: 'registeringInsights' });

  /**
   * Get dashboard data (KPIs, insights, recaps)
   */
  ipcMain.handle('insights:getDashboardData', async (event, params: {
    timeRange: { start: string; end: string };
    includeKPIs: boolean;
    includeInsights: boolean;
    includeRecaps: boolean;
  }) => {
    try {
      logger.info('Fetching dashboard data', { component: 'insightsHandlers', operation: 'fetchingDashboard', metadata: { params } });

      const data: any = {};

      // Parse time range
      const timeRange: TimeRange = {
        start: new Date(params.timeRange.start),
        end: new Date(params.timeRange.end),
      };

      // Get tasks and journal entries if KPIs requested
      if (params.includeKPIs) {
        const tasksResult = await apiService.getTasks();
        const journalResult = await apiService.getJournalEntries();

        if (!tasksResult.success || !journalResult.success) {
          throw new Error('Failed to fetch tasks or journal entries');
        }

        data.kpis = VisualizationService.generateKPIMetrics({
          tasks: tasksResult.data || [],
          journalEntries: journalResult.data || [],
          timeRange,
        });
      }

      // Get insights
      if (params.includeInsights) {
        const { sqliteService } = await import('@serenity/database');
        await sqliteService.initialize();
        const insights = await sqliteService.getInsightsFiltered({
          dismissed: false,
          limit: 50,
        });
        data.insights = insights;
      }

      // Get recaps
      if (params.includeRecaps) {
        const { sqliteService } = await import('@serenity/database');
        await sqliteService.initialize();
        const recaps = await sqliteService.getRecapsFiltered({
          limit: 10,
        });
        data.recaps = recaps;
      }

      logger.info('Dashboard data fetched successfully', { component: 'insightsHandlers', operation: 'dashboardDataFetched' });
      return { success: true, data };
    } catch (error: any) {
      logger.error('Failed to fetch dashboard data:', { component: 'insightsHandlers', operation: 'failedFetchDashboard' }, error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Get insights with filters
   */
  ipcMain.handle('insights:getInsights', async (event, filters: {
    category?: string;
    type?: string;
    dismissed?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    try {
      logger.info('Fetching insights with filters', { component: 'insightsHandlers', operation: 'fetchingInsights', metadata: { filters } });

      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      const insights = await sqliteService.getInsightsFiltered(filters);

      logger.info(`Fetched ${insights.length} insights`, { component: 'insightsHandlers', operation: 'insightsFetched' });
      return { success: true, insights };
    } catch (error: any) {
      logger.error('Failed to fetch insights:', { component: 'insightsHandlers', operation: 'failedFetchInsights' }, error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Update insight feedback
   */
  ipcMain.handle('insights:updateFeedback', async (event, id: string, feedback: {
    userRating?: number;
    dismissed?: boolean;
    markedHelpful?: boolean;
    userNotes?: string;
  }) => {
    try {
      logger.info('Updating insight feedback', { component: 'insightsHandlers', operation: 'updatingFeedback', metadata: { id, feedback } });

      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      await sqliteService.updateInsightFeedback(id, feedback);

      logger.info('Insight feedback updated successfully', { component: 'insightsHandlers', operation: 'feedbackUpdated' });
      return { success: true };
    } catch (error: any) {
      logger.error('Failed to update insight feedback:', { component: 'insightsHandlers', operation: 'failedUpdateFeedback' }, error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Dismiss an insight
   */
  ipcMain.handle('insights:dismiss', async (event, id: string) => {
    try {
      logger.info('Dismissing insight', { component: 'insightsHandlers', operation: 'dismissingInsight', metadata: { id } });

      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      await sqliteService.dismissInsight(id);

      logger.info('Insight dismissed successfully', { component: 'insightsHandlers', operation: 'insightDismissed' });
      return { success: true };
    } catch (error: any) {
      logger.error('Failed to dismiss insight:', { component: 'insightsHandlers', operation: 'failedDismissInsight' }, error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Get recaps with filters
   */
  ipcMain.handle('insights:getRecaps', async (event, filters: {
    type?: 'weekly' | 'monthly';
    favorited?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    try {
      logger.info('Fetching recaps with filters', { component: 'insightsHandlers', operation: 'fetchingRecaps', metadata: { filters } });

      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      const recaps = await sqliteService.getRecapsFiltered(filters);

      logger.info(`Fetched ${recaps.length} recaps`, { component: 'insightsHandlers', operation: 'recapsFetched' });
      return { success: true, recaps };
    } catch (error: any) {
      logger.error('Failed to fetch recaps:', { component: 'insightsHandlers', operation: 'failedFetchRecaps' }, error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Update recap interaction
   */
  ipcMain.handle('insights:updateRecapInteraction', async (event, id: string, interaction: {
    viewed?: boolean;
    favorited?: boolean;
    exported?: boolean;
  }) => {
    try {
      logger.info('Updating recap interaction', { component: 'insightsHandlers', operation: 'updatingRecapInteraction', metadata: { id, interaction } });

      const { sqliteService } = await import('@serenity/database');
      await sqliteService.initialize();
      await sqliteService.updateRecapInteraction(id, interaction);

      logger.info('Recap interaction updated successfully', { component: 'insightsHandlers', operation: 'recapInteractionUpdated' });
      return { success: true };
    } catch (error: any) {
      logger.error('Failed to update recap interaction:', { component: 'insightsHandlers', operation: 'failedUpdateRecapInteraction' }, error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Get visualization data for charts
   */
  ipcMain.handle('insights:getVisualizationData', async (event, params: {
    metric: 'completion' | 'mood' | 'productivity' | 'velocity';
    granularity: 'day' | 'week' | 'month';
    timeRange: { start: string; end: string };
  }) => {
    try {
      logger.info('Fetching visualization data', { component: 'insightsHandlers', operation: 'fetchingVisualization', metadata: { params } });

      const tasksResult = await apiService.getTasks();
      const journalResult = await apiService.getJournalEntries();

      if (!tasksResult.success || !journalResult.success) {
        throw new Error('Failed to fetch tasks or journal entries');
      }

      const timeRange: TimeRange = {
        start: new Date(params.timeRange.start),
        end: new Date(params.timeRange.end),
      };

      const data = VisualizationService.generateTrendData(
        tasksResult.data || [],
        journalResult.data || [],
        params.metric,
        params.granularity,
        timeRange
      );

      logger.info('Visualization data fetched successfully', { component: 'insightsHandlers', operation: 'visualizationDataFetched' });
      return { success: true, data };
    } catch (error: any) {
      logger.error('Failed to fetch visualization data:', { component: 'insightsHandlers', operation: 'failedFetchVisualization' }, error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Get KPI metrics
   */
  ipcMain.handle('insights:getKPIMetrics', async (event, params: {
    timeRange: { start: string; end: string };
  }) => {
    try {
      logger.info('Fetching KPI metrics', { component: 'insightsHandlers', operation: 'fetchingKpiMetrics', metadata: { params } });

      const tasksResult = await apiService.getTasks();
      const journalResult = await apiService.getJournalEntries();

      if (!tasksResult.success || !journalResult.success) {
        throw new Error('Failed to fetch tasks or journal entries');
      }

      const timeRange: TimeRange = {
        start: new Date(params.timeRange.start),
        end: new Date(params.timeRange.end),
      };

      const kpis = VisualizationService.generateKPIMetrics({
        tasks: tasksResult.data || [],
        journalEntries: journalResult.data || [],
        timeRange,
      });

      logger.info('KPI metrics fetched successfully', { component: 'insightsHandlers', operation: 'kpiMetricsFetched' });
      return { success: true, kpis };
    } catch (error: any) {
      logger.error('Failed to fetch KPI metrics:', { component: 'insightsHandlers', operation: 'failedFetchKpiMetrics' }, error);
      return { success: false, error: error.message };
    }
  });

  logger.info('✅ Insights IPC handlers registered', { component: 'insightsHandlers', operation: 'insightsIpcHandlers' });
}
