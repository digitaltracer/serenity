import { useEffect } from 'react';

type ProviderId = 'openai' | 'gemini' | 'anthropic';

export function useLoadAISettings(
  dispatch: (action: any) => any,
  actions: {
    updateProvidersWithModelInfo: (info: any) => any;
    updateProvidersWithApiKeys: (keys: any) => any;
    setActiveProvider: (id: ProviderId) => any;
  }
) {
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const api = (window as any)?.electronAPI?.aiAssistant;
        if (!api?.getSettings) return;
        const result = await api.getSettings();
        if (!result?.success || cancelled) return;

        if (result.settings?.modelInfo) {
          dispatch(actions.updateProvidersWithModelInfo(result.settings.modelInfo));
        }
        if (result.settings?.providersWithKeys) {
          dispatch(actions.updateProvidersWithApiKeys(result.settings.providersWithKeys));
        }
        const active: ProviderId | undefined = result.settings?.activeProvider;
        const hasKey = active ? !!result.settings?.providersWithKeys?.[active] : false;
        if (active && hasKey) {
          dispatch(actions.setActiveProvider(active));
        } else if (!active) {
          const firstWithKey = (['openai','gemini','anthropic'] as const).find(p => result.settings?.providersWithKeys?.[p]);
          if (firstWithKey) {
            dispatch(actions.setActiveProvider(firstWithKey));
          }
        }
      } catch {}
    };
    load();
    return () => { cancelled = true; };
  // Run once on mount; internal logic sets provider without re-saving redundantly
  }, []);
}


