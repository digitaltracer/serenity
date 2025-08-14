import { useEffect } from 'react';

type ProviderId = 'openai' | 'gemini' | 'anthropic' | undefined;

export function usePersistActiveProviderSettings(
  activeProvider: ProviderId,
  configuration: {
    autoAnalyze: boolean;
    analysisFrequency: 'daily' | 'weekly' | 'manual';
    dataTypes: { includeTasks: boolean; includeJournal: boolean; includeProjects: boolean };
  }
) {
  useEffect(() => {
    const persist = async () => {
      try {
        if (!activeProvider) return;
        const api = (window as any)?.electronAPI?.aiAssistant;
        // Debounce and only send when provider actually changes
        // The middleware also dedupes; this ensures UI-triggered saves are minimal
        await api?.saveSettings?.({
          activeProvider,
          autoAnalyze: configuration.autoAnalyze,
          analysisFrequency: configuration.analysisFrequency,
          dataTypes: configuration.dataTypes,
        });
      } catch {}
    };
    persist();
  // Only persist when provider identity changes; avoid tying to other config which middleware handles
  }, [activeProvider]);
}


