"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// These settings balance data freshness with reduced network churn and improved performance.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes - prevents unnecessary refetches
      staleTime: 1000 * 60 * 5, // 5 minutes
      
      // Keep data in cache for 10 minutes before garbage collection
      // This allows users to see cached data if they navigate away and back
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly known as cacheTime)
      
      // Don't refetch when window regains focus - reduces unnecessary API calls
      // when user switches tabs or apps
      refetchOnWindowFocus: false,
      
      // Don't refetch when internet reconnects - user can manually refresh if needed
      refetchOnReconnect: false,
      
      // Retry failed requests once before giving up
      retry: 1,
      
      // Don't automatically refetch stale data when component mounts
      // This gives better control over when data is fetched
      refetchOnMount: false,
    },
    mutations: {
      // Don't retry mutations - mutations have side effects and shouldn't auto-retry
      retry: 0,
    },
  } as any,
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export default QueryProvider;
