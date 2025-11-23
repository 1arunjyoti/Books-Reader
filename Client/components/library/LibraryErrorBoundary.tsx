"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { logger } from "@/lib/logger";
import { AlertTriangle, RefreshCw, Home, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary for Library Page
 * Catches and handles errors in library view, preventing full app crashes
 * Provides graceful degradation with error details and recovery options
 */
class LibraryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error("Library Error Boundary caught an error:", error);

    this.setState({
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call custom reset handler if provided
    this.props.onReset?.();

    // Reload the page to reset state
    window.location.reload();
  };

  handleClearFilters = (): void => {
    // Clear filters from localStorage
    localStorage.removeItem("library-filters");
    localStorage.removeItem("library-search");
    localStorage.removeItem("library-sort");

    this.handleReset();
  };

  handleGoHome = (): void => {
    window.location.href = "/";
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;

      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            {/* Error Icon */}
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-4">
              Unable to Load Library
            </h1>

            {/* Error Message */}
            <div className="mb-6">
              <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
                Something went wrong while loading your library. This could be
                due to:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
                <li>Network connection issues</li>
                <li>Server temporarily unavailable</li>
                <li>Invalid filter or search parameters</li>
                <li>Browser storage corruption</li>
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
                    {error.name}: {error.message}
                  </p>
                  {error.stack && (
                    <pre className="text-red-700 dark:text-red-400 whitespace-pre-wrap break-words">
                      {error.stack}
                    </pre>
                  )}
                  {errorInfo && errorInfo.componentStack && (
                    <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                      <p className="text-red-800 dark:text-red-300 font-semibold mb-1">
                        Component Stack:
                      </p>
                      <pre className="text-red-700 dark:text-red-400 whitespace-pre-wrap break-words">
                        {errorInfo.componentStack}
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
                Reload Library
              </Button>

              <Button
                onClick={this.handleClearFilters}
                className="flex items-center gap-2"
                variant="outline"
              >
                <X className="w-4 h-4" />
                Clear Filters & Reload
              </Button>

              <Button
                onClick={this.handleGoHome}
                className="flex items-center gap-2"
                variant="secondary"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </div>

            {/* Support Message */}
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              If this problem persists, please try logging out and back in, or
              contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LibraryErrorBoundary;
