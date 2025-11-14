"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sanitizeErrorMessage, sanitizeStackTrace, sanitizeComponentStack } from '@/lib/sanitize-text';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary for PDF Reader
 * Catches and handles errors in PDF rendering, preventing full app crashes
 * Provides graceful degradation with error details and recovery options
 */
class PDFReaderErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for debugging
    logger.error('PDF Reader Error Boundary caught an error:', error);
    
    // Store error info in state
    this.setState({
      errorInfo,
    });

    // TODO: Send error to analytics/monitoring service
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call custom reset handler if provided
    this.props.onReset?.();
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/library';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      const { fallbackTitle = 'Unable to Load PDF Reader' } = this.props;

      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            {/* Error Icon */}
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-4">
              {fallbackTitle}
            </h1>

            {/* Error Message */}
            <div className="mb-6">
              <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
                Something went wrong while loading the PDF reader. This could be due to:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
                <li>Corrupted or invalid PDF file</li>
                <li>Unsupported PDF features</li>
                <li>Memory limitations</li>
                <li>Browser compatibility issues</li>
              </ul>
            </div>

            {/* Error Details (Expandable) */}
            {error && (
              <details className="mb-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Technical Details
                </summary>
                <div className="mt-3 text-xs font-mono bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 overflow-auto max-h-48">
                  <p className="text-red-800 dark:text-red-300 font-semibold mb-2 whitespace-pre-wrap break-words">
                    {error.name}: {sanitizeErrorMessage(error.message)}
                  </p>
                  {error.stack && (
                    <pre className="text-red-700 dark:text-red-400 whitespace-pre-wrap break-words">
                      {sanitizeStackTrace(error.stack)}
                    </pre>
                  )}
                  {errorInfo && errorInfo.componentStack && (
                    <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                      <p className="text-red-800 dark:text-red-300 font-semibold mb-1">
                        Component Stack:
                      </p>
                      <pre className="text-red-700 dark:text-red-400 whitespace-pre-wrap break-words">
                        {sanitizeComponentStack(errorInfo.componentStack)}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                className="flex items-center gap-2"
                variant="default"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              
              <Button
                onClick={this.handleReload}
                className="flex items-center gap-2"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </Button>

              <Button
                onClick={this.handleGoHome}
                className="flex items-center gap-2"
                variant="secondary"
              >
                <Home className="w-4 h-4" />
                Go to Library
              </Button>
            </div>

            {/* Support Message */}
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              If this problem persists, please try a different PDF or contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PDFReaderErrorBoundary;
