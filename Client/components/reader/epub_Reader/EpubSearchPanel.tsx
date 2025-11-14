import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SearchResult {
  cfi: string;
  excerpt: string;
}

interface EpubSearchPanelProps {
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

export default function EpubSearchPanel({
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
}: EpubSearchPanelProps) {
  // VIRTUALIZATION: Set up virtual scrolling for large search result lists
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: searchResults.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Estimated height of each search result item
    overscan: 5,
  });

  return (
    <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-lg z-30 w-96">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Search</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            onClose();
            onClear();
          }}
          className="h-6 w-6 p-0 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Search in book..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isSearching) onSearch();
            }}
            className="flex-1"
            disabled={isSearching}
          />
          <Button onClick={onSearch} size="sm" disabled={isSearching || !searchQuery}>
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
              <span>Searching through book...</span>
              <span>{searchProgress}%</span>
            </div>
            <Progress value={searchProgress} className="h-2" />
            {onCancelSearch && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancelSearch}
                className="w-full"
              >
                Cancel Search
              </Button>
            )}
          </div>
        )}

        {searchResults.length > 0 && !isSearching && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {currentSearchIndex + 1} of {searchResults.length} results
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={onPrev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div 
              ref={parentRef}
              className="max-h-64 overflow-auto"
              style={{ contain: 'strict' }}
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
                  const index = virtualItem.index;
                  
                  return (
                    <button
                      key={virtualItem.key}
                      data-index={virtualItem.index}
                      ref={virtualizer.measureElement}
                      onClick={() => onSelectResult(index)}
                      className={`w-full text-left px-3 py-2 rounded text-xs ${
                        index === currentSearchIndex
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      ...{result.excerpt}...
                    </button>
                  );
                })}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onClear} className="w-full">
              Clear Search
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
