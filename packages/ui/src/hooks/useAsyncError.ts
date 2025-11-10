/**
 * Hook for handling async errors in React components
 * Provides consistent error handling and user feedback for async operations
 */

import { useState, useCallback } from 'react';
import { ErrorHandler, getUserMessage, type SerenityError } from '@serenity/core';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseAsyncErrorOptions {
  onError?: (error: SerenityError) => void;
  showUserMessages?: boolean;
}

export const useAsyncError = <T = unknown>(options: UseAsyncErrorOptions = {}) => {
  const { onError, showUserMessages = true } = options;
  
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (
    asyncFunction: () => Promise<T>,
    errorCode: keyof typeof import('@serenity/core').ERROR_CODES = 'UNKNOWN_ERROR',
    context?: Record<string, unknown>
  ): Promise<T | null> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await asyncFunction();
      
      setState(prev => ({ 
        ...prev, 
        data: result, 
        loading: false,
        error: null 
      }));
      
      return result;
    } catch (error) {
      const serenityError = ErrorHandler.createError(
        errorCode,
        error instanceof Error ? error : new Error(String(error)),
        context
      );
      
      // Handle through standardized error system
      const handledError = ErrorHandler.handle(serenityError);
      
      // Set user-friendly error message in state
      const userMessage = showUserMessages 
        ? getUserMessage(handledError)
        : handledError.message;
      
      setState(prev => ({ 
        ...prev, 
        data: null,
        loading: false, 
        error: userMessage
      }));
      
      // Call custom error handler if provided
      if (onError) {
        onError(handledError);
      }
      
      return null;
    }
  }, [onError, showUserMessages]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    clearError
  };
};

// Specialized hook for API calls
export const useApiCall = <T = unknown>(options: UseAsyncErrorOptions = {}) => {
  return useAsyncError<T>({
    ...options,
    onError: (error) => {
      // Additional API-specific error handling
      if (error.category === 'network') {
        // Could trigger offline mode or retry logic
      }
      options.onError?.(error);
    }
  });
};

// Hook for database operations
export const useDatabaseOperation = <T = unknown>(options: UseAsyncErrorOptions = {}) => {
  return useAsyncError<T>({
    ...options,
    onError: (error) => {
      // Database-specific error handling
      if (error.category === 'database') {
        // Could trigger data recovery or offline fallback
      }
      options.onError?.(error);
    }
  });
};