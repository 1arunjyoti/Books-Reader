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
    <div className="flex items-center justify-between p-3 gap-2 sm:p-2 sm:py-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 relative z-30 shadow-sm">
      {/* Left: Title */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="h-8 w-8 rounded-lg bg-blue-100/50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
        </div>
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
            className={`h-9 w-9 rounded-lg transition-all ${
              showSearchPanel 
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
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
            className={`h-9 w-9 rounded-lg transition-all relative ${
              showHighlightsPanel 
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Highlighter className="h-4 w-4" />
            {highlightsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-sm">
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
            className={`h-9 w-9 rounded-lg transition-all ${
              showDisplayOptions 
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* Text-to-Speech */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowTTSPanel(!showTTSPanel)}
            title="Text-to-Speech"
            className={`h-9 w-9 rounded-lg transition-all ${
              showTTSPanel 
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Volume2 className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

          {/* Text Selection Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEnableTextSelection(!enableTextSelection)}
            title={enableTextSelection 
              ? 'Disable text selection (Shortcuts: Ctrl+1-6 for quick highlight)' 
              : 'Enable text selection'
            }
            className={`h-9 w-9 rounded-lg transition-all ${
              enableTextSelection 
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Type className="h-4 w-4" />
          </Button>

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            className={`h-9 w-9 rounded-lg transition-all ${
              isFullscreen 
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              title="Close reader"
              className="h-9 w-9 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-all ml-1"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
    </div>
  );
}
