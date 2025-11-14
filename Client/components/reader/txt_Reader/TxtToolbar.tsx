import React from 'react';
import { Button } from '@/components/ui/button';
import {
  X,
  Search,
  Highlighter,
  Settings,
  Volume2,
  Maximize,
  Minimize,
  Type,
  FileText,
} from 'lucide-react';

interface TxtToolbarProps {
  // Panel Toggles
  showSearchPanel: boolean;
  setShowSearchPanel: (show: boolean) => void;
  showHighlightsPanel: boolean;
  setShowHighlightsPanel: (show: boolean) => void;
  showDisplayOptions: boolean;
  setShowDisplayOptions: (show: boolean) => void;
  showTTSPanel: boolean;
  setShowTTSPanel: (show: boolean) => void;

  // Highlight State
  highlightsCount: number;
  enableTextSelection: boolean;
  setEnableTextSelection: (enabled: boolean) => void;

  // Fullscreen
  isFullscreen: boolean;
  toggleFullscreen: () => void;

  // Close Handler
  onClose?: () => void;
}

export default function TxtToolbar({
  showSearchPanel,
  setShowSearchPanel,
  showHighlightsPanel,
  setShowHighlightsPanel,
  showDisplayOptions,
  setShowDisplayOptions,
  showTTSPanel,
  setShowTTSPanel,
  highlightsCount,
  enableTextSelection,
  setEnableTextSelection,
  isFullscreen,
  toggleFullscreen,
  onClose,
}: TxtToolbarProps) {
  return (
    <div className="flex items-center justify-between p-3 gap-2 sm:p-2 sm:py-3 bg-card border-b relative">
      {/* Left: Title */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-gray-600 dark:text-gray-300" />
        <h1 className="text-sm sm:text-lg font-semibold truncate text-gray-900 dark:text-white">
          Text Reader
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-end">
          {/* Search */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearchPanel(!showSearchPanel)}
            title="Search"
            className={`h-8 w-8 hover:bg-blue-200 dark:hover:bg-blue-900 ${showSearchPanel ? 'bg-blue-200 dark:bg-blue-900' : ' '}`}
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Highlights */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHighlightsPanel(!showHighlightsPanel)}
            disabled={highlightsCount === 0}
            title={`Highlights (${highlightsCount})`}
            className={`h-8 w-8 relative hover:bg-blue-200 dark:hover:bg-blue-900 ${showHighlightsPanel ? 'bg-blue-200 dark:bg-blue-900' : ''}`}
          >
            <Highlighter className="h-4 w-4" />
            {highlightsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {highlightsCount > 9 ? '9+' : highlightsCount}
              </span>
            )}
          </Button>

          {/* Display Options */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDisplayOptions(!showDisplayOptions)}
            title="Display Options"
            className={`h-8 w-8 hover:bg-blue-200 dark:hover:bg-blue-900 ${showDisplayOptions ? 'bg-blue-200 dark:bg-blue-900' : ''}`}
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* Text-to-Speech */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowTTSPanel(!showTTSPanel)}
            title="Text-to-Speech"
            className={`h-8 w-8 hover:bg-blue-200 dark:hover:bg-blue-900 ${showTTSPanel ? 'bg-blue-200 dark:bg-blue-900' : ''}`}
          >
            <Volume2 className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 hidden sm:block" />

          {/* Text Selection Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEnableTextSelection(!enableTextSelection)}
            title={enableTextSelection 
              ? 'Disable text selection (Shortcuts: Ctrl+1-6 for quick highlight)' 
              : 'Enable text selection'
            }
            className={`h-8 w-8 hover:bg-blue-200 dark:hover:bg-blue-900 ${enableTextSelection ? 'bg-blue-200 dark:bg-blue-900' : ''}`}
          >
            <Type className={`h-4 w-4 ${enableTextSelection ? 'text-blue-700 dark:text-blue-300' : ''}`} />
          </Button>

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            className={`h-8 w-8 hover:bg-blue-200 dark:hover:bg-blue-900 ${isFullscreen ? 'bg-blue-200 dark:bg-blue-900' : ''}`}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              title="Close reader"
              className="h-8 w-8 hover:bg-red-200 dark:hover:bg-red-900"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
    </div>
  );
}
