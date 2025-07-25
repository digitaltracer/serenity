import { useState, useCallback } from 'react';

export interface CryptoProgress {
  isLoading: boolean;
  progress: number;
  stage: 'initializing' | 'loading' | 'deriving-key' | 'decrypting' | 'complete';
  message: string;
}

export const useCryptoOperations = () => {
  const [cryptoProgress, setCryptoProgress] = useState<CryptoProgress>({
    isLoading: false,
    progress: 0,
    stage: 'initializing',
    message: 'Initializing security features...'
  });

  const updateProgress = useCallback((update: Partial<CryptoProgress>) => {
    setCryptoProgress(prev => ({ ...prev, ...update }));
  }, []);

  const startCryptoOperation = useCallback(() => {
    setCryptoProgress({
      isLoading: true,
      progress: 0,
      stage: 'initializing',
      message: 'Initializing security features...'
    });
  }, []);

  const completeCryptoOperation = useCallback(() => {
    setCryptoProgress({
      isLoading: false,
      progress: 100,
      stage: 'complete',
      message: 'Security initialized successfully!'
    });
  }, []);

  const failCryptoOperation = useCallback((error: string) => {
    setCryptoProgress({
      isLoading: false,
      progress: 0,
      stage: 'initializing',
      message: `Error: ${error}`
    });
  }, []);

  return {
    cryptoProgress,
    updateProgress,
    startCryptoOperation,
    completeCryptoOperation,
    failCryptoOperation
  };
};