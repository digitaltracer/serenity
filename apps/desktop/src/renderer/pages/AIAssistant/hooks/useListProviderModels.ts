import { useEffect } from 'react';

export function useListProviderModels(
  providers: Array<{ id: string; hasApiKey: boolean }>,
  setAvailableModels: (m: Record<string, { id: string; label: string }[]>) => void
) {
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const api = (window as any)?.electronAPI?.aiAssistant;
        const next: Record<string, { id: string; label: string }[]> = {};
        for (const p of providers) {
          if (p.hasApiKey && api?.listModels) {
            const res = await api.listModels(p.id as any);
            if (res?.success) next[p.id] = res.models || [];
          }
        }
        if (!cancelled) setAvailableModels(next);
      } catch {}
    };
    run();
    return () => { cancelled = true; };
  }, [providers, setAvailableModels]);
}


