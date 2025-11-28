import React, { useRef, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, X, Loader2, Search } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SearchResult {
  sectionIndex: number;
  position: { start: number; end: number };
  excerpt: string;
}

interface TxtSearchPanelProps {
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  onSearch: () => void;
  searchResults: SearchResult[];
  currentSearchIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onSelectResult: (index: number) => void;
  onClear: () => void;
  onClose: () => void;
  isSearching?: boolean;
  searchProgress?: number;
  onCancelSearch?: () => void;
}

export default function TxtSearchPanel({
  searchQuery,
  onSearchQueryChange,
  onSearch,
  searchResults,
  currentSearchIndex,
  onPrev,
  onNext,
  onSelectResult,
  onClear,
  onClose,
  isSearching = false,
  searchProgress = 0,
  onCancelSearch,
}: TxtSearchPanelProps) {
  // Virtual scrolling for large result lists
  const parentRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Memoize handleClose to prevent listener churn
  const handleClose = useCallback(() => onClose(), [onClose]);

  // Handle click outside to close panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    // Use passive listener for better performance
    document.addEventListener('mousedown', handleClickOutside, { passive: true } as AddEventListenerOptions);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClose]);
  
  const virtualizer = useVirtualizer({
    count: searchResults.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 70,
    overscan: 5,
  });

  return (
    <div 
      className="absolute top-16 right-0 bottom-0 w-80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-l border-gray-200/50 dark:border-gray-700/50 shadow-2xl z-20 flex flex-col"
      ref={panelRef}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-500" />
          Search
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 bg-gray-100/50 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="p-4 space-y-4 flex-1 flex flex-col overflow-hidden">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search in text..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isSearching) onSearch();
              }}
              className="w-full bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-blue-500 pr-8"
              disabled={isSearching}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => onSearchQueryChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <Button 
            onClick={onSearch} 
            size="sm" 
            disabled={isSearching || !searchQuery}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Search'
            )}
          </Button>
        </div>

        {/* Progress indicator during search */}
        {isSearching && (
          <div className="space-y-2 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-300 font-medium">
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Searching...
              </span>
              <span>{searchProgress}%</span>
            </div>
            <Progress value={searchProgress} className="h-1.5 bg-blue-200 dark:bg-blue-900/50" />
            {onCancelSearch && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onCancelSearch}
                className="w-full text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 mt-1"
              >
                Cancel Search
              </Button>
            )}
          </div>
        )}

        {/* Search results */}
        {searchResults.length > 0 ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">
              <span className="font-medium">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </span>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onPrev}
                  disabled={searchResults.length === 0}
                  className="h-6 w-6 rounded-md hover:bg-white dark:hover:bg-gray-700 shadow-sm"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <span className="text-xs font-mono w-12 text-center">
                  {searchResults.length > 0 ? currentSearchIndex + 1 : 0}/{searchResults.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onNext}
                  disabled={searchResults.length === 0}
                  className="h-6 w-6 rounded-md hover:bg-white dark:hover:bg-gray-700 shadow-sm"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Results list with virtual scrolling */}
            <div
              ref={parentRef}
              className="flex-1 overflow-y-auto border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-gray-50/30 dark:bg-gray-800/30 custom-scrollbar"
            >
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const result = searchResults[virtualItem.index];
                  const isSelected = virtualItem.index === currentSearchIndex;
                  return (
                    <button
                      key={virtualItem.key}
                      onClick={() => onSelectResult(virtualItem.index)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800/50 transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-white dark:hover:bg-gray-800'
                      }`}
                      ref={(el) => {
                        if (el) virtualizer.measureElement(el as HTMLElement);
                      }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualItem.start}px)`,
                        willChange: 'transform',
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          Section {result.sectionIndex + 1}
                        </span>
                        {isSelected && (
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <div className={`text-sm line-clamp-2 leading-relaxed ${
                        isSelected ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-300'
                      }`}>
                        ...{result.excerpt}...
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              className="mt-3 w-full text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-dashed"
            >
              Clear Search Results
            </Button>
          </div>
        ) : (
          !isSearching && searchQuery && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 opacity-60">
              <Search className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">No matches found</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Try adjusting your search term
              </p>
            </div>
          )
        )}
        
        {!isSearching && !searchQuery && searchResults.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 opacity-60">
            <Search className="h-12 w-12 text-gray-200 dark:text-gray-700 mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Enter text to search through the document
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
