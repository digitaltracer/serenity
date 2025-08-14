/**
 * React Error Boundary Component
 * Catches JavaScript errors anywhere in the component tree and displays fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorHandler, ErrorCategory, ErrorSeverity, getUserMessage } from '@serenity/core';
import { Button } from './Button';
import { Card } from './Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'section' | 'component';
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props;

    // Create standardized error
    const serenityError = ErrorHandler.createError(
      'UNKNOWN_ERROR',
      error,
      {
        errorBoundaryLevel: level,
        componentStack: errorInfo.componentStack,
        errorInfo: errorInfo
      },
      'A component error occurred. Please try refreshing the page.'
    );

    // Override category and severity based on level
    serenityError.category = ErrorCategory.UI;
    serenityError.severity = level === 'page' ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM;

    // Handle the error through our standardized system
    ErrorHandler.handle(serenityError);

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Store error ID for potential reporting
    this.setState({ errorId: serenityError.code });
  }

  private handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount < this.maxRetries) {
      this.setState({
        hasError: false,
        error: undefined,
        errorId: undefined,
        retryCount: retryCount + 1
      });
    } else {
      // Max retries reached, suggest page refresh
      window.location.reload();
    }
  };

  private handleReportError = () => {
    const { error, errorId } = this.state;
    
    if (error && errorId) {
      // Get error reports and copy to clipboard for user to send
      const reports = ErrorHandler.getErrorReports();
      const errorData = {
        errorId,
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        recentErrors: reports.slice(-5) // Last 5 errors for context
      };

      navigator.clipboard?.writeText(JSON.stringify(errorData, null, 2))
        .then(() => {
          alert('Error details copied to clipboard. Please share this with support.');
        })
        .catch(() => {
          alert('Unable to copy error details. Please take a screenshot.');
        });
    }
  };

  private renderFallbackUI() {
    const { level = 'component', fallback } = this.props;
    const { error, retryCount } = this.state;

    // Use custom fallback if provided
    if (fallback) {
      return fallback;
    }

    const errorMessage = error ? getUserMessage(error) : 'Something went wrong';
    const canRetry = retryCount < this.maxRetries;

    // Different UI based on error boundary level
    switch (level) {
      case 'page':
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="max-w-md w-full text-center">
              <div className="p-6">
                <div className="w-16 h-16 mx-auto mb-4 text-red-500">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Page Error
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {errorMessage}
                </p>
                <div className="space-y-3">
                  {canRetry ? (
                    <Button onClick={this.handleRetry} className="w-full">
                      Try Again {retryCount > 0 && `(${this.maxRetries - retryCount} attempts left)`}
                    </Button>
                  ) : (
                    <Button onClick={() => window.location.reload()} className="w-full">
                      Refresh Page
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={this.handleReportError} 
                    className="w-full"
                  >
                    Report Error
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'section':
        return (
          <div className="p-6 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="w-12 h-12 mx-auto mb-3 text-orange-500">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Section Unavailable
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {errorMessage}
            </p>
            <div className="space-x-2">
              {canRetry && (
                <Button size="sm" onClick={this.handleRetry}>
                  Retry
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={this.handleReportError}>
                Report
              </Button>
            </div>
          </div>
        );

      case 'component':
      default:
        return (
          <div className="p-4 text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <div className="w-8 h-8 mx-auto mb-2 text-red-500">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-800 dark:text-red-300 text-sm font-medium mb-2">
              Component Error
            </p>
            <p className="text-red-600 dark:text-red-400 text-xs mb-3">
              {errorMessage}
            </p>
            {canRetry && (
              <Button size="sm" onClick={this.handleRetry}>
                Retry
              </Button>
            )}
          </div>
        );
    }
  }

  render() {
    if (this.state.hasError) {
      return this.renderFallbackUI();
    }

    return this.props.children;
  }
}

// Convenience components for different levels
export const PageErrorBoundary = ({ children, onError }: Omit<Props, 'level'>) => (
  <ErrorBoundary level="page" onError={onError}>
    {children}
  </ErrorBoundary>
);

export const SectionErrorBoundary = ({ children, onError, fallback }: Omit<Props, 'level'>) => (
  <ErrorBoundary level="section" onError={onError} fallback={fallback}>
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary = ({ children, onError, fallback }: Omit<Props, 'level'>) => (
  <ErrorBoundary level="component" onError={onError} fallback={fallback}>
    {children}
  </ErrorBoundary>
);

// Hook for functional components to report errors manually
export const useErrorHandler = () => {
  return {
    reportError: (error: Error, context?: Record<string, unknown>) => {
      const serenityError = ErrorHandler.createError(
        'UNKNOWN_ERROR',
        error,
        context,
        'An error occurred in the application'
      );
      ErrorHandler.handle(serenityError);
    },
    getUserMessage,
    getErrorStats: ErrorHandler.getErrorStats
  };
};