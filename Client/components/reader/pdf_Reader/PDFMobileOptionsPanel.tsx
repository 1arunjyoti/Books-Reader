"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Layers,
  Palette,
  Volume2,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  RefreshCw,
  Type,
  X,
  Settings,
  Minus,
  Plus,
} from 'lucide-react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

interface PDFMobileOptionsPanelProps {
  showMobileOptions: boolean;
  onClose: () => void;
  scale: number;
  rotation: number;
  enableTextSelection: boolean;
  readingMode: boolean;
  isFullscreen: boolean;
  showThumbnails: boolean;
  showTTS: boolean;
  colorFilter: 'none' | 'sepia' | 'dark' | 'custom';
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
  onResetRotation: () => void;
  onDecreaseRotation: () => void;
  onToggleThumbnails: () => void;
  onToggleTTS: () => void;
  onCycleColorFilter: () => void;
  onToggleTextSelection: (value: boolean) => void;
  onToggleReadingMode: (value: boolean) => void;
  onToggleFullscreen: () => void;
}

export default function PDFMobileOptionsPanel({
  showMobileOptions,
  onClose,
  scale,
  rotation,
  enableTextSelection,
  readingMode,
  isFullscreen,
  showThumbnails,
  showTTS,
  colorFilter,
  onZoomIn,
  onZoomOut,
  onRotate,
  onResetRotation,
  onDecreaseRotation,
  onToggleThumbnails,
  onToggleTTS,
  onCycleColorFilter,
  onToggleTextSelection,
  onToggleReadingMode,
  onToggleFullscreen,
}: PDFMobileOptionsPanelProps) {
  if (!showMobileOptions) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/20 dark:bg-black/40 z-10"
        onClick={onClose}
      />
      <div className="absolute top-0 right-0 bottom-0 w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg z-20 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            More Options
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center"
            aria-label="Close options"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Site Theme Toggle */}
          <div className="flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
            <div className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              <span>Site Theme</span>
            </div>
            <ThemeSwitcher />
          </div>

          {/* Zoom Settings Group */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Zoom Settings</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between w-full py-3 px-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onZoomOut}
                  className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">Zoom ({Math.round(scale * 100)}%)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onZoomIn}
                  className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Display Settings Group */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Display Settings</h3>
            <div className="space-y-2">
              <Button
                variant="ghost"
                onClick={() => {
                  onToggleThumbnails();
                  onClose();
                }}
                className="w-full justify-between py-3 px-4 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center">
                  <Layers className="h-4 w-4 mr-2" />
                  <span>{showThumbnails ? 'Hide Thumbnails' : 'Page Thumbnails'}</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  onCycleColorFilter();
                }}
                className="w-full justify-between py-3 px-4 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center">
                  <Palette className="h-4 w-4 mr-2" />
                  <span>Theme: {colorFilter.charAt(0).toUpperCase() + colorFilter.slice(1)}</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <div className="flex items-center justify-between w-full py-3 px-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDecreaseRotation}
                  className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">Rotation ({rotation}°)</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRotate}
                    className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  {rotation !== 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onResetRotation}
                      className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Interaction & Media Group */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Interaction & Media</h3>
            <div className="space-y-2">
              <Button
                variant="ghost"
                onClick={() => {
                  onToggleTTS();
                  onClose();
                }}
                className="w-full justify-between py-3 px-4 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center">
                  <Volume2 className="h-4 w-4 mr-2" />
                  <span>{showTTS ? 'Stop Reading' : 'Read Aloud'}</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  onToggleTextSelection(!enableTextSelection);
                  onClose();
                }}
                className={`w-full justify-start py-3 px-4 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  enableTextSelection ? 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : ''
                }`}
              >
                <Type className="h-4 w-4 mr-2" />
                <span>Text Selection {enableTextSelection ? '(Enabled)' : ''}</span>
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  onToggleReadingMode(!readingMode);
                  onClose();
                }}
                className={`w-full justify-start py-3 px-4 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  readingMode ? 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : ''
                }`}
              >
                {readingMode ? (
                  <><EyeOff className="h-4 w-4 mr-2" /><span>Exit Reading Mode</span></>
                ) : (
                  <><Eye className="h-4 w-4 mr-2" /><span>Reading Mode</span></>
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  onToggleFullscreen();
                  onClose();
                }}
                className={`w-full justify-start py-3 px-4 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  isFullscreen ? 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : ''
                }`}
              >
                {isFullscreen ? (
                  <><Minimize className="h-4 w-4 mr-2" /><span>Exit Fullscreen</span></>
                ) : (
                  <><Maximize className="h-4 w-4 mr-2" /><span>Fullscreen</span></>
                )}
              </Button>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
