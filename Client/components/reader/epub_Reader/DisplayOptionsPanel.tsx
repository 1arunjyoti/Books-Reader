"use client";

import React from 'react';
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

export default function DisplayOptionsPanel({
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
  return (
    <div className="absolute top-0 right-0 bottom-0 w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg z-20 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Display Options
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center"
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
        <div className='pt-4 border-t border-gray-200 dark:border-gray-600'>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Color Filters
            </h3>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => setColorFilter('none')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                colorFilter === 'none'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              None (Default)
            </button>
            <button
              onClick={() => setColorFilter('sepia')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                colorFilter === 'sepia'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Sepia (Warm)
            </button>
            <button
              onClick={() => setColorFilter('dark')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                colorFilter === 'dark'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Night Mode
            </button>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">
                Custom Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={customBgColor}
                  onChange={(e) => {
                    setCustomBgColor(e.target.value);
                    setColorFilter('custom');
                  }}
                  className="h-8 w-full rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Layout Options Section */}
        <div>
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
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                pageLayout === 'single'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              <RectangleVertical className="h-4 w-4" />
              Single
            </button>
            <button
              onClick={() => pageLayout !== 'double' && togglePageLayout()}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                pageLayout === 'double'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Columns2 className="h-4 w-4" />
              Double
            </button>
          </div>
        </div>

        {/* Page Rotation Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <RotateCw className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Rotation
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={rotatePage}
              className="w-full px-3 py-2 rounded-md text-sm font-medium transition-colors bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2"
            >
              <RotateCw className="h-4 w-4" />
              Rotate Page ({rotation}°)
            </button>
            {rotation !== 0 && (
              <button
                onClick={resetRotation}
                className="w-full px-3 py-2 rounded-md text-sm font-medium transition-colors bg-gray-50 dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300"
              >
                Reset Rotation
              </button>
            )}
          </div>
        </div>

        {/* Font Size Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ZoomOut className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Font Size
            </h3>
          </div>
          <div className="flex items-center justify-between gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={decreaseFontSize}
              className="h-8 w-8 p-0"
              title="Decrease font size"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[3rem] text-center">
              {fontSize}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={increaseFontSize}
              className="h-8 w-8 p-0"
              title="Increase font size"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Line Height Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Type className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Line Height
            </h3>
          </div>
          <div className="flex items-center justify-between gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={decreaseLineHeight}
              className="h-8 w-8 p-0"
              title="Decrease line height"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[3rem] text-center">
              {lineHeight.toFixed(1)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={increaseLineHeight}
              className="h-8 w-8 p-0"
              title="Increase line height"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Font Change Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Type className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Font
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => fontFamily !== 'serif' && toggleFontFamily()}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                fontFamily === 'serif'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Serif
            </button>
            <button
              onClick={() => fontFamily !== 'sans-serif' && toggleFontFamily()}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                fontFamily === 'sans-serif'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
              style={{ fontFamily: 'Arial, sans-serif' }}
            >
              Sans-serif
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
