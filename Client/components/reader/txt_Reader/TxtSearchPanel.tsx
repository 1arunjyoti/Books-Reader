import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
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
  
  const virtualizer = useVirtualizer({
    count: searchResults.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 70,
    overscan: 5,
  });

  return (
    <div className="absolute top-4 right-4 bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-lg z-30 w-96 text-gray-900 dark:text-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Search</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            onClose();
            onClear();
          }}
          className="h-6 w-6 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <X className="h-4 w-4 text-gray-900 dark:text-gray-100" />
        </Button>
      </div>
      
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Search in text..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isSearching) onSearch();
            }}
            className="flex-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            disabled={isSearching}
          />
          <Button 
            onClick={onSearch} 
            size="sm" 
            disabled={isSearching || !searchQuery}>
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Searching
              </>
            ) : (
              'Search'
            )}
          </Button>
        </div>

        {/* Progress indicator during search */}
        {isSearching && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Searching through text...</span>
              <span>{searchProgress}%</span>
            </div>
            <Progress value={searchProgress} className="h-1" />
            {onCancelSearch && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onCancelSearch}
                className="w-full text-xs"
              >
                Cancel Search
              </Button>
            )}
          </div>
        )}

        {/* Search results */}
        {searchResults.length > 0 && (
          <>
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onPrev}
                  disabled={searchResults.length === 0}
                  className="h-6 w-6"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <span className="text-xs">
                  {searchResults.length > 0 ? currentSearchIndex + 1 : 0} / {searchResults.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onNext}
                  disabled={searchResults.length === 0}
                  className="h-6 w-6"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Results list with virtual scrolling */}
            <div
              ref={parentRef}
              className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded bg-white/50 dark:bg-transparent"
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
                  return (
                    <button
                      key={virtualItem.key}
                      onClick={() => onSelectResult(virtualItem.index)}
                      className={`w-full text-left px-3 py-2 rounded text-xs ${
                        virtualItem.index === currentSearchIndex
                          ? 'bg-blue-100 dark:bg-blue-800/30'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      ref={(el) => {
                        // Measure the real element height so the virtualizer can adjust positions
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
                      <div className="text-gray-500 dark:text-gray-400 mb-1">
                        Section {result.sectionIndex + 1}
                      </div>
                      <div className="text-gray-900 dark:text-gray-100">
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
              className="w-full text-xs text-gray-700 dark:text-gray-200"
            >
              Clear Search
            </Button>
          </>
        )}

        {/* No results message */}
        {!isSearching && searchResults.length === 0 && searchQuery && (
          <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
            No results found for &quot;{searchQuery}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
