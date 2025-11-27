'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Palette, Columns2, RectangleVertical, ZoomOut, ZoomIn, Type, RotateCw, Settings2 } from 'lucide-react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

interface DisplayOptionsPanelProps {
  colorFilter: 'none' | 'sepia' | 'dark' | 'custom';
  customBgColor: string;
  setColorFilter: (v: 'none' | 'sepia' | 'dark' | 'custom') => void;
  setCustomBgColor: (c: string) => void;
  
  fontSize: number;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  
  lineHeight: number;
  increaseLineHeight: () => void;
  decreaseLineHeight: () => void;
  
  pageLayout: 'single' | 'double';
  togglePageLayout: () => void;
  
  fontFamily: 'serif' | 'sans-serif';
  toggleFontFamily: () => void;
  
  rotation: number;
  rotatePage: () => void;
  resetRotation: () => void;
  
  onClose: () => void;
}

function DisplayOptionsPanel({
  colorFilter,
  customBgColor,
  setColorFilter,
  setCustomBgColor,
  fontSize,
  increaseFontSize,
  decreaseFontSize,
  lineHeight,
  increaseLineHeight,
  decreaseLineHeight,
  pageLayout,
  togglePageLayout,
  fontFamily,
  toggleFontFamily,
  rotation,
  rotatePage,
  resetRotation,
  onClose,
}: DisplayOptionsPanelProps) {
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

  return (
    <div 
      className="absolute top-16 right-0 bottom-0 w-80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-l border-gray-200/50 dark:border-gray-700/50 shadow-2xl z-20 flex flex-col overflow-y-auto custom-scrollbar"
      ref={panelRef}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Display Options
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 bg-gray-100/50 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
          aria-label="Close display options"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Site Theme Toggle (uses next-themes) */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Theme
            </h3>
          </div>
          <div className="flex-shrink-0">
            <ThemeSwitcher />
          </div>
        </div>
        
        {/* Color Filters Section */}
        <div className='pt-4 border-t border-gray-200/50 dark:border-gray-700/50'>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Reading Themes
            </h3>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => setColorFilter('none')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                colorFilter === 'none'
                  ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50'
                  : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-white border border-gray-300 shadow-sm" />
                None (Default)
              </div>
            </button>
            <button
              onClick={() => setColorFilter('sepia')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                colorFilter === 'sepia'
                  ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-700/50'
                  : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#f4ecd8] border border-amber-200 shadow-sm" />
                Sepia (Warm)
              </div>
            </button>
            <button
              onClick={() => setColorFilter('dark')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                colorFilter === 'dark'
                  ? 'bg-gradient-to-r from-gray-800/20 to-gray-900/20 text-gray-900 dark:text-gray-100 border border-gray-300/50 dark:border-gray-600/50'
                  : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-900 border border-gray-700 shadow-sm" />
                Night Mode
              </div>
            </button>
            <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wider">
                Custom Color
              </label>
              <div className="flex gap-2">
                <div className="relative w-full">
                  <input
                    type="color"
                    value={customBgColor}
                    onChange={(e) => {
                      setCustomBgColor(e.target.value);
                      setColorFilter('custom');
                    }}
                    className="h-10 w-full rounded-lg cursor-pointer border border-gray-200 dark:border-gray-700 p-1 bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layout Options Section */}
        <div className='pt-4 border-t border-gray-200/50 dark:border-gray-700/50'>
          <div className="flex items-center gap-2 mb-3">
            {pageLayout === 'single' ? (
              <RectangleVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Columns2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Layout Options
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => pageLayout !== 'single' && togglePageLayout()}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                pageLayout === 'single'
                  ? 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50'
                  : 'bg-gray-100/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50'
              }`}
            >
              <RectangleVertical className="h-4 w-4" />
              Single
            </button>
            <button
              onClick={() => pageLayout !== 'double' && togglePageLayout()}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                pageLayout === 'double'
                  ? 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50'
                  : 'bg-gray-100/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50'
              }`}
            >
              <Columns2 className="h-4 w-4" />
              Double
            </button>
          </div>
        </div>

        {/* Font Size Section */}
        <div className='pt-4 border-t border-gray-200/50 dark:border-gray-700/50'>
          <div className="flex items-center gap-2 mb-3">
            <ZoomOut className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Font Size
            </h3>
          </div>
          <div className="flex items-center justify-between gap-3 p-2 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={decreaseFontSize}
              className="h-9 w-9 p-0 hover:bg-white dark:hover:bg-gray-700 rounded-lg shadow-sm transition-all"
              title="Decrease font size"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-bold text-gray-900 dark:text-white min-w-[3rem] text-center">
              {fontSize}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={increaseFontSize}
              className="h-9 w-9 p-0 hover:bg-white dark:hover:bg-gray-700 rounded-lg shadow-sm transition-all"
              title="Increase font size"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Line Height Section */}
        <div className='pt-4 border-t border-gray-200/50 dark:border-gray-700/50'>
          <div className="flex items-center gap-2 mb-3">
            <Type className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Line Height
            </h3>
          </div>
          <div className="flex items-center justify-between gap-3 p-2 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={decreaseLineHeight}
              className="h-9 w-9 p-0 hover:bg-white dark:hover:bg-gray-700 rounded-lg shadow-sm transition-all"
              title="Decrease line height"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-bold text-gray-900 dark:text-white min-w-[3rem] text-center">
              {lineHeight.toFixed(1)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={increaseLineHeight}
              className="h-9 w-9 p-0 hover:bg-white dark:hover:bg-gray-700 rounded-lg shadow-sm transition-all"
              title="Increase line height"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Font Change Section */}
        <div className='pt-4 border-t border-gray-200/50 dark:border-gray-700/50'>
          <div className="flex items-center gap-2 mb-3">
            <Type className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Font Family
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => fontFamily !== 'serif' && toggleFontFamily()}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                fontFamily === 'serif'
                  ? 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50'
                  : 'bg-gray-100/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50'
              }`}
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Serif
            </button>
            <button
              onClick={() => fontFamily !== 'sans-serif' && toggleFontFamily()}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                fontFamily === 'sans-serif'
                  ? 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50'
                  : 'bg-gray-100/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50'
              }`}
              style={{ fontFamily: 'Arial, sans-serif' }}
            >
              Sans-serif
            </button>
          </div>
        </div>

        {/* Page Rotation Section */}
        <div className='pt-4 border-t border-gray-200/50 dark:border-gray-700/50'>
          <div className="flex items-center gap-2 mb-3">
            <RotateCw className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Rotation
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={rotatePage}
              className="w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all bg-gray-100/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-sm text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2"
            >
              <RotateCw className="h-4 w-4" />
              Rotate Page ({rotation}°)
            </button>
            {rotation !== 0 && (
              <button
                onClick={resetRotation}
                className="w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all bg-red-50/50 dark:bg-red-900/20 hover:bg-red-100/50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-800/50"
              >
                Reset Rotation
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

const propsAreEqual = (prevProps: DisplayOptionsPanelProps, nextProps: DisplayOptionsPanelProps) => {
  return (
    prevProps.colorFilter === nextProps.colorFilter &&
    prevProps.customBgColor === nextProps.customBgColor &&
    prevProps.setColorFilter === nextProps.setColorFilter &&
    prevProps.setCustomBgColor === nextProps.setCustomBgColor &&
    prevProps.fontSize === nextProps.fontSize &&
    prevProps.increaseFontSize === nextProps.increaseFontSize &&
    prevProps.decreaseFontSize === nextProps.decreaseFontSize &&
    prevProps.lineHeight === nextProps.lineHeight &&
    prevProps.increaseLineHeight === nextProps.increaseLineHeight &&
    prevProps.decreaseLineHeight === nextProps.decreaseLineHeight &&
    prevProps.pageLayout === nextProps.pageLayout &&
    prevProps.togglePageLayout === nextProps.togglePageLayout &&
    prevProps.fontFamily === nextProps.fontFamily &&
    prevProps.toggleFontFamily === nextProps.toggleFontFamily &&
    prevProps.rotation === nextProps.rotation &&
    prevProps.rotatePage === nextProps.rotatePage &&
    prevProps.resetRotation === nextProps.resetRotation &&
    prevProps.onClose === nextProps.onClose
  );
};

export default React.memo(DisplayOptionsPanel, propsAreEqual);
