'use client';

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronUp, ChevronDown, X, Search } from 'lucide-react';

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
    estimateSize: () => 80, // Estimated height of each search result item
    overscan: 5,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSearching && searchQuery.trim()) {
      onSearch();
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-300 dark:bg-yellow-600 px-0.5 rounded-sm text-gray-900 dark:text-white">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="absolute top-16 right-0 bottom-0 w-80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-l border-gray-200/50 dark:border-gray-700/50 shadow-2xl z-20 flex flex-col">
      {/* Header */}
      <div className="bg-transparent border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Search in Book
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            onClose();
            onClear();
          }}
          className="h-8 w-8 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-full transition-colors"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter search term..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="flex-1 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-blue-500/20 focus:border-blue-500"
              autoFocus
              disabled={isSearching}
            />
            {isSearching ? (
              <Button 
                type="button" 
                size="sm" 
                variant="destructive" 
                onClick={onCancelSearch}
                className="min-w-[70px] shadow-sm"
                title="Cancel search"
              >
                Cancel
              </Button>
            ) : (
              <Button 
                type="submit" 
                size="sm" 
                disabled={!searchQuery.trim()}
                className="min-w-[70px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-sm"
              >
                Search
              </Button>
            )}
          </div>

          {/* Progress Indicator */}
          {isSearching && (
            <div className="space-y-2 p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between text-sm text-blue-900 dark:text-blue-100">
                <span className="font-medium">Searching book...</span>
                <span className="font-semibold">{searchProgress}%</span>
              </div>
              <div className="w-full bg-blue-200/50 dark:bg-blue-800/50 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                  style={{ width: `${searchProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          {searchResults.length > 0 && !isSearching && (
            <div className="flex items-center justify-between text-sm px-1">
              <span className="text-gray-600 dark:text-gray-300 font-medium">
                {currentSearchIndex + 1} of {searchResults.length} results
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onPrev}
                  className="h-8 w-8 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg"
                  title="Previous result"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onNext}
                  className="h-8 w-8 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-lg"
                  title="Next result"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30 dark:bg-gray-900/30">
        {isSearching ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Searching...
              </div>
            </div>
          </div>
        ) : searchResults.length > 0 ? (
          <div 
            ref={parentRef}
            className="h-full w-full overflow-auto custom-scrollbar p-2"
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
                  <div
                    key={virtualItem.key}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    onClick={() => onSelectResult(index)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    className={`
                      p-3 mb-2 rounded-xl cursor-pointer transition-all duration-200
                      ${index === currentSearchIndex
                        ? 'bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 shadow-sm'
                        : 'bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-medium ${index === currentSearchIndex ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>
                        Result {index + 1}
                      </span>
                      {index === currentSearchIndex && (
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">
                      {highlightText(result.excerpt, searchQuery)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : searchQuery && !isSearching ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <Search className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-900 dark:text-gray-100 font-medium mb-1">
              No results found
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              We couldn&apos;t find any matches for &quot;{searchQuery}&quot;
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClear} 
              className="mt-4"
            >
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="p-4 rounded-full bg-blue-50 dark:bg-gray-800 mb-4">
              <Search className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            </div>
            <p className="text-gray-900 dark:text-gray-100 font-medium mb-1">
              Search in Book
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-[200px]">
              Enter a keyword above to find text within this book
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
