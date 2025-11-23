"use client";

import React, { Component, ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { AlertCircle, RefreshCw, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isHidden: boolean;
}

/**
 * Lightweight Error Boundary for Analytics Components
 * Non-intrusive error handling that doesn't block the entire page
 * Allows users to hide analytics and continue using other features
 */
class AnalyticsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isHidden: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error): void {
    logger.error('Analytics Error Boundary caught an error:', error);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      isHidden: false,
    });

    // Call custom reset handler if provided
    this.props.onReset?.();
  };

  handleHide = (): void => {
    this.setState({
      isHidden: true,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && !this.state.isHidden) {
      const { error } = this.state;

      return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 my-4">
          <div className="flex items-start gap-4">
            {/* Error Icon */}
            <div className="flex items-center justify-center w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>

            {/* Error Content */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
                Analytics Temporarily Unavailable
              </h3>
              <p className="text-sm text-red-800 dark:text-red-300 mb-4">
                We couldn&apos;t load your analytics data. This doesn&apos;t affect your reading progress or library.
              </p>

              {/* Error Details (if in development) */}
              {process.env.NODE_ENV === 'development' && error && (
                <details className="mb-4">
                  <summary className="cursor-pointer text-xs font-medium text-red-700 dark:text-red-400 mb-2">
                    Error Details
                  </summary>
                  <div className="text-xs font-mono bg-red-100 dark:bg-red-950/50 rounded p-2 overflow-auto max-h-32">
                    <p className="text-red-900 dark:text-red-300 whitespace-pre-wrap break-words">
                      {error.name}: {error.message}
                    </p>
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={this.handleReset}
                  size="sm"
                  variant="outline"
                  className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
                
                <Button
                  onClick={this.handleHide}
                  size="sm"
                  variant="ghost"
                  className="text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40"
                >
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide This Section
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // If hidden, don't render anything
    if (this.state.isHidden) {
      return null;
    }

    return this.props.children;
  }
}

export default AnalyticsErrorBoundary;
