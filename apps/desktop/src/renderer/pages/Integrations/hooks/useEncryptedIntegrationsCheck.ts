import { useEffect } from 'react';

export function useEncryptedIntegrationsCheck(
  shouldCheck: boolean,
  onDetected: () => void
): void {
  useEffect(() => {
    if (!shouldCheck) return;
    let cancelled = false;

    const run = async () => {
      try {
        const api = (window as any)?.electronAPI?.integrations;
        if (!api?.hasEncrypted) return;
        const result = await api.hasEncrypted();
        const has = result?.success && (result.data?.hasEncrypted || (result.data?.count ?? 0) > 0);
        if (has && !cancelled) onDetected();
      } catch {
        // ignore
      }
    };

    const id = setTimeout(run, 500);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [shouldCheck, onDetected]);
}


