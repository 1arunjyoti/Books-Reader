'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  X,
  Maximize,
  Minimize,
  Bookmark,
  BookmarkPlus,
  List,
  Search,
  Volume2,
  Settings,
  Highlighter,
  Eye,
  EyeOff,
} from 'lucide-react';

interface EpubToolbarProps {
  // Book Info
  bookTitle: string;
  currentChapter?: string;

  // Page Info
  pageInfo: {
    current: number;
    total: number;
  };
  pageInput: string;
  setPageInput: (value: string) => void;
  handlePageInputSubmit: (e: React.FormEvent) => void;

  // Location Generation
  isGeneratingLocations: boolean;
  locationGenerationProgress: number;

  // Navigation
  onPrevPage: () => void;
  onNextPage: () => void;
  isLoading: boolean;

  // Toolbar Visibility
  readingMode: boolean;
  toolbarVisible: boolean;
  colorFilter: string;

  // Bookmark Controls
  isCurrentPageBookmarked: boolean;
  isLoadingBookmarks: boolean;
  toggleBookmark: () => void;

  // Panel Toggles
  showSearchPanel: boolean;
  setShowSearchPanel: (show: boolean) => void;
  showContentsAndBookmarks: boolean;
  setShowContentsAndBookmarks: (show: boolean) => void;
  showHighlightsPanel: boolean;
  setShowHighlightsPanel: (show: boolean) => void;
  showDisplayOptions: boolean;
  setShowDisplayOptions: (show: boolean) => void;
  showTTSControls: boolean;
  setShowTTSControls: (show: boolean) => void;

  // Highlights
  highlightsCount: number;

  // Text Selection
  enableTextSelection: boolean;
  setEnableTextSelection: (enabled: boolean) => void;

  // Fullscreen
  isFullscreen: boolean;
  toggleFullscreen: () => void;

  // Close Handler
  onClose?: () => void;
}

export default function EpubToolbar({
  bookTitle,
  currentChapter,
  pageInfo,
  pageInput,
  setPageInput,
  handlePageInputSubmit,
  isGeneratingLocations,
  locationGenerationProgress,
  onPrevPage,
  onNextPage,
  isLoading,
  readingMode,
  toolbarVisible,
  colorFilter,
  isCurrentPageBookmarked,
  isLoadingBookmarks,
  toggleBookmark,
  showSearchPanel,
  setShowSearchPanel,
  showContentsAndBookmarks,
  setShowContentsAndBookmarks,
  showHighlightsPanel,
  setShowHighlightsPanel,
  showDisplayOptions,
  setShowDisplayOptions,
  showTTSControls,
  setShowTTSControls,
  highlightsCount,
  enableTextSelection,
  setEnableTextSelection,
  isFullscreen,
  toggleFullscreen,
  onClose,
}: EpubToolbarProps) {
  // Auto-hide toolbar in reading mode
  if (readingMode && !toolbarVisible) {
    return null;
  }

  return (
    <div
      className={`border-b px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0 ${
        colorFilter === 'dark'
          ? 'bg-gray-900 border-gray-800 text-white'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Left Section - Title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <BookOpen
            className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${
              colorFilter === 'dark' ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'
            }`}
          />
          <h1
            className={`text-sm sm:text-lg font-semibold truncate ${
              colorFilter === 'dark' ? 'text-white' : 'text-gray-900 dark:text-white'
            }`}
          >
            {bookTitle}
          </h1>
        </div>

        {/* Center Section - Page Info (Desktop Only) */}
        <div className="hidden md:flex items-center gap-2">
          {currentChapter && (
            <span
              className={`text-sm max-w-xs truncate ${
                colorFilter === 'dark' ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {currentChapter}
            </span>
          )}

          <Button
            variant="ghost"
            size="icon"
            disabled={pageInfo.current <= 1 || isLoading}
            onClick={onPrevPage}
            title="Previous page"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Page Input */}
          <div className="flex items-center gap-2">
            <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1">
              <Input
                type="number"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                min={1}
                max={pageInfo.total}
                className="w-16 text-center h-8 text-sm"
                disabled={pageInfo.total === 0 || isLoading}
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                / {pageInfo.total}
              </span>
            </form>
            {isGeneratingLocations && (
              <div className="flex flex-col gap-1 ml-2 min-w-[120px]">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    Calculating pages...
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {locationGenerationProgress}%
                  </span>
                </div>
                <Progress value={locationGenerationProgress} className="h-1 w-full" />
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onNextPage}
            disabled={pageInfo.current >= pageInfo.total || isLoading}
            title="Next page"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Right Section - Essential Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Search - Always visible */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearchPanel(!showSearchPanel)}
            title="Search"
            className={`h-8 w-8 sm:h-10 sm:w-10 ${
              showSearchPanel ? 'bg-gray-100 dark:bg-gray-700' : ''
            }`}
          >
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          {/* Bookmark Controls - Always visible */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleBookmark}
            disabled={isLoadingBookmarks || isLoading}
            title={isCurrentPageBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            className={`h-8 w-8 sm:h-10 sm:w-10 ${
              isCurrentPageBookmarked ? 'text-blue-600 dark:text-blue-400' : ''
            }`}
          >
            {isCurrentPageBookmarked ? (
              <Bookmark className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
            ) : (
              <BookmarkPlus className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>

          {/* Bookmark Panel */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowContentsAndBookmarks(!showContentsAndBookmarks)}
            disabled={isLoadingBookmarks}
            title="Contents & Bookmarks"
            className={`h-8 w-8 sm:h-10 sm:w-10 ${
              showContentsAndBookmarks ? 'bg-gray-100 dark:bg-gray-700' : ''
            }`}
          >
            <List className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          {/* Highlights Panel - Mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHighlightsPanel(!showHighlightsPanel)}
            disabled={highlightsCount === 0}
            title="Highlights"
            className={`h-8 w-8 sm:h-10 sm:w-10 sm:hidden relative ${
              showHighlightsPanel ? 'bg-gray-100 dark:bg-gray-700' : ''
            }`}
          >
            <Highlighter className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          {/* Desktop Advanced Features */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* Highlights Panel */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHighlightsPanel(!showHighlightsPanel)}
              disabled={highlightsCount === 0}
              title="Highlights"
              className={`relative ${showHighlightsPanel ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
            >
              <Highlighter className="h-5 w-5" />
            </Button>

            {/* Display Options Panel Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDisplayOptions(!showDisplayOptions)}
              title="Display options"
              className={showDisplayOptions ? 'bg-gray-100 dark:bg-gray-700' : ''}
            >
              <Settings className="h-5 w-5" />
            </Button>

            {/* Text-to-Speech Panel */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTTSControls(!showTTSControls)}
              title="Text-to-Speech"
              className={showTTSControls ? 'bg-gray-100 dark:bg-gray-700' : ''}
            >
              <Volume2 className="h-5 w-5" />
            </Button>

            {/* Text Selection Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEnableTextSelection(!enableTextSelection)}
              title={enableTextSelection ? 'Disable text selection' : 'Enable text selection'}
              className={enableTextSelection ? 'bg-gray-100 dark:bg-gray-700' : ''}
            >
              {enableTextSelection ? (
                <Eye className="h-5 w-5" />
              ) : (
                <EyeOff className="h-5 w-5" />
              )}
            </Button>

            {/* Fullscreen Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* Close Button */}
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} title="Close reader">
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Mobile Close Button */}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              title="Close reader"
              className="lg:hidden h-8 w-8 sm:h-10 sm:w-10"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
