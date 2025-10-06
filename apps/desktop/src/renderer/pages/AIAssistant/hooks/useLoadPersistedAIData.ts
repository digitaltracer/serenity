import { useEffect } from 'react';
import { logger } from '@serenity/core';

export function useLoadPersistedAIData(
  dispatch: (action: any) => any,
  actions: {
    restoreInsights: (insights: any[]) => any;
    restoreRecaps: (recaps: any[]) => any;
    restoreUsage: (usage: any[]) => any;
  }
) {
  useEffect(() => {
    let cancelled = false;
    
    const loadPersistedData = async () => {
      try {
        const api = (window as any)?.electronAPI?.aiAssistant;
        if (!api) return;

        logger.info('🔄 Loading persisted AI data...', { component: 'useLoadPersistedAIData', operation: 'loadingPersistedData...' });

        // Load insights
        try {
          const insightsResult = await api.listInsights();
          if (insightsResult?.success && insightsResult.data && !cancelled) {
            logger.info(`📊 Loaded ${insightsResult.data.length} persisted insights`, { component: 'useLoadPersistedAIData', operation: 'loaded${insightsresult.data.length}Persisted' });
            const formattedInsights = insightsResult.data.map((row: any) => ({
              id: row.id?.toString() || `insight_${Date.now()}_${Math.random()}`,
              type: row.type || 'productivity',
              title: row.title || 'Insight',
              description: row.description || '',
              confidence: Number(row.confidence || 0.5),
              createdAt: row.created_at || new Date().toISOString(),
              source: row.provider || 'local',
              category: row.category || 'tasks',
              actionable: !!row.actionable,
              metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : {},
            }));
            dispatch(actions.restoreInsights(formattedInsights));
          }
        } catch (error) {
          logger.warn('Failed to load persisted insights:', error, { component: 'useLoadPersistedAIData', operation: 'failedLoadPersisted' });
        }

        // Load recaps
        try {
          const recapsResult = await api.listRecaps();
          if (recapsResult?.success && recapsResult.data && !cancelled) {
            logger.info(`📝 Loaded ${recapsResult.data.length} persisted recaps`, { component: 'useLoadPersistedAIData', operation: 'loaded${recapsresult.data.length}Persisted' });
            const formattedRecaps = recapsResult.data.map((row: any) => ({
              id: row.id?.toString() || `recap_${Date.now()}_${Math.random()}`,
              type: row.type || 'weekly',
              title: row.title || 'Recap',
              summary: row.summary || '',
              highlights: row.highlights ? (typeof row.highlights === 'string' ? JSON.parse(row.highlights) : row.highlights) : [],
              challenges: row.challenges ? (typeof row.challenges === 'string' ? JSON.parse(row.challenges) : row.challenges) : [],
              recommendations: row.recommendations ? (typeof row.recommendations === 'string' ? JSON.parse(row.recommendations) : row.recommendations) : [],
              period: row.period ? (typeof row.period === 'string' ? JSON.parse(row.period) : row.period) : { start: '', end: '' },
              createdAt: row.created_at || new Date().toISOString(),
              source: row.provider || 'local',
              metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : {},
            }));
            dispatch(actions.restoreRecaps(formattedRecaps));
          }
        } catch (error) {
          logger.warn('Failed to load persisted recaps:', error, { component: 'useLoadPersistedAIData', operation: 'failedLoadPersisted' });
        }

        // Load usage data
        try {
          const usageResult = await api.listUsage();
          if (usageResult?.success && usageResult.data && !cancelled) {
            logger.info(`💰 Loaded ${usageResult.data.length} usage records`, { component: 'useLoadPersistedAIData', operation: 'loaded${usageresult.data.length}Usage' });
            const formattedUsage = usageResult.data.map((row: any) => ({
              id: row.id?.toString() || `usage_${Date.now()}_${Math.random()}`,
              timestamp: row.created_at || row.timestamp || new Date().toISOString(),
              provider: row.provider || 'local',
              operation: row.operation || 'analyze',
              promptTokens: Number(row.prompt_tokens || row.promptTokens || 0),
              completionTokens: Number(row.completion_tokens || row.completionTokens || 0),
              totalTokens: Number(row.total_tokens || row.totalTokens || 0),
              note: row.note || undefined,
            }));
            // Restore usage records to Redux state (without triggering persistence)
            dispatch(actions.restoreUsage(formattedUsage));
          }
        } catch (error) {
          logger.warn('Failed to load persisted usage data:', error, { component: 'useLoadPersistedAIData', operation: 'failedLoadPersisted' });
        }

        logger.info('✅ Persisted AI data loading complete', { component: 'useLoadPersistedAIData', operation: 'persistedDataLoading' });
      } catch (error) {
        logger.error('Failed to load persisted AI data:', { component: 'useLoadPersistedAIData', operation: 'failedLoadPersisted' }, error);
      }
    };

    loadPersistedData();
    return () => { cancelled = true; };
  }, []); // Run once on mount
}