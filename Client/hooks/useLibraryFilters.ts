import { useState, useCallback, useRef, useEffect } from 'react';
import { AdvancedFilters } from '@/components/library/advanced-filters';

type BookStatus = 'all' | 'reading' | 'want-to-read' | 'read' | 'unread';

export const useLibraryFilters = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookStatus>('all');
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    search: '',
    status: 'all',
    genre: [],
    format: [],
    language: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'uploadedAt',
    sortOrder: 'desc'
  });

  // Debounced filter update - single batched state change
  const filterUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (filterUpdateTimeoutRef.current) {
      clearTimeout(filterUpdateTimeoutRef.current);
    }

    // Single state update with batched values (increased to 500ms for better UX)
    filterUpdateTimeoutRef.current = setTimeout(() => {
      setAdvancedFilters(prev => ({
        ...prev,
        search: searchQuery,
        status: statusFilter,
      }));
    }, 500);

    return () => {
      if (filterUpdateTimeoutRef.current) {
        clearTimeout(filterUpdateTimeoutRef.current);
      }
    };
  }, [searchQuery, statusFilter]);

  const handleFiltersChange = useCallback((newFilters: AdvancedFilters) => {
    setAdvancedFilters(newFilters);
  }, []);

  const resetFilters = useCallback(() => {
    const defaults: AdvancedFilters = {
      search: '',
      status: 'all',
      genre: [],
      format: [],
      language: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'uploadedAt',
      sortOrder: 'desc'
    };
    setAdvancedFilters(defaults);
    setSearchQuery('');
    setStatusFilter('all');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    advancedFilters,
    handleFiltersChange,
    resetFilters,
  };
};
