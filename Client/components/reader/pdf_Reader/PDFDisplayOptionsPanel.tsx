"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Palette, ZoomOut, ZoomIn, RotateCw, Settings2 } from 'lucide-react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

interface PDFDisplayOptionsPanelProps {
  colorFilter: 'none' | 'sepia' | 'dark' | 'custom';
  customBgColor: string;
  setColorFilter: (v: 'none' | 'sepia' | 'dark' | 'custom') => void;
  setCustomBgColor: (c: string) => void;

  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;

  rotation: number;
  onRotate: () => void;
  onResetRotation: () => void;

  onClose: () => void;
}

function PDFDisplayOptionsPanel({
  colorFilter,
  customBgColor,
  setColorFilter,
  setCustomBgColor,
  scale,
  onZoomIn,
  onZoomOut,
  rotation,
  onRotate,
  onResetRotation,
  onClose,
}: PDFDisplayOptionsPanelProps) {
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
      className="absolute top-0 right-0 bottom-0 w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg z-20 flex flex-col overflow-y-auto"
      ref={panelRef}
    >
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
              Reading Themes
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

        {/* Zoom Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ZoomOut className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Zoom
            </h3>
          </div>
          <div className="flex items-center justify-between gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={onZoomOut}
              className="h-8 w-8 p-0"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onZoomIn}
              className="h-8 w-8 p-0"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Rotation Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <RotateCw className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Rotation
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={onRotate}
              className="w-full px-3 py-2 rounded-md text-sm font-medium transition-colors bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2"
            >
              <RotateCw className="h-4 w-4" />
              Rotate Page ({rotation}°)
            </button>
            {rotation !== 0 && (
              <button
                onClick={onResetRotation}
                className="w-full px-3 py-2 rounded-md text-sm font-medium transition-colors bg-gray-50 dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300"
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

const propsAreEqual = (prevProps: PDFDisplayOptionsPanelProps, nextProps: PDFDisplayOptionsPanelProps) => {
  return (
    prevProps.colorFilter === nextProps.colorFilter &&
    prevProps.customBgColor === nextProps.customBgColor &&
    prevProps.setColorFilter === nextProps.setColorFilter &&
    prevProps.setCustomBgColor === nextProps.setCustomBgColor &&
    prevProps.scale === nextProps.scale &&
    prevProps.onZoomIn === nextProps.onZoomIn &&
    prevProps.onZoomOut === nextProps.onZoomOut &&
    prevProps.rotation === nextProps.rotation &&
    prevProps.onRotate === nextProps.onRotate &&
    prevProps.onResetRotation === nextProps.onResetRotation &&
    prevProps.onClose === nextProps.onClose
  );
};

export default React.memo(PDFDisplayOptionsPanel, propsAreEqual);
