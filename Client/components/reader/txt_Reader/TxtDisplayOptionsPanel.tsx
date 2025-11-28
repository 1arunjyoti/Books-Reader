"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Palette, ZoomOut, ZoomIn, Type, AlignLeft, Settings2 } from 'lucide-react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

interface TxtDisplayOptionsPanelProps {
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
  
  fontFamily: 'serif' | 'sans-serif' | 'monospace';
  toggleFontFamily: () => void;
  
  textAlign: 'left' | 'center' | 'justify';
  cycleTextAlign: () => void;
  
  onClose: () => void;
}

export default function TxtDisplayOptionsPanel({
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
  fontFamily,
  toggleFontFamily,
  textAlign,
  cycleTextAlign,
  onClose,
}: TxtDisplayOptionsPanelProps) {
  return (
    <div className="absolute top-16 right-0 bottom-0 w-80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-l border-gray-200 dark:border-gray-700 shadow-2xl z-20 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Display Options
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 bg-gray-300 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full flex items-center justify-center"
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
              Color Theme
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
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[3rem] text-center">
              {fontSize}px
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={increaseFontSize}
              className="h-8 w-8 p-0"
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
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Font Family Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Type className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Font Style
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
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
              Sans
            </button>
            <button
              onClick={() => fontFamily !== 'monospace' && toggleFontFamily()}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                fontFamily === 'monospace'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
              style={{ fontFamily: 'Courier New, monospace' }}
            >
              Mono
            </button>
          </div>
        </div>

        {/* Text Alignment Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlignLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Text Alignment
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => textAlign !== 'left' && cycleTextAlign()}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                textAlign === 'left'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              Left
            </button>
            <button
              onClick={() => textAlign !== 'center' && cycleTextAlign()}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                textAlign === 'center'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              Center
            </button>
            <button
              onClick={() => textAlign !== 'justify' && cycleTextAlign()}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                textAlign === 'justify'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              Justify
            </button>
          </div>
        </div>

        {/* Reset Button */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setColorFilter('none');
              // Note: Font size, line height, font family, and text align resets
              // should be handled by the parent component
            }}
          >
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
}
