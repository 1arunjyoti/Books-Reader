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
        className="absolute inset-0 bg-black/20 dark:bg-black/40 z-10 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute top-16 right-0 bottom-0 w-80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-l border-gray-200/50 dark:border-gray-700/50 shadow-2xl z-20 flex flex-col overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            More Options
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 bg-gray-100/50 dark:bg-gray-700/50 hover:bg-gray-200/50 dark:hover:bg-gray-600/50 rounded-full flex items-center justify-center transition-colors"
            aria-label="Close options"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Site Theme Toggle */}
          <div className="flex items-center justify-between p-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 rounded-lg border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50 transition-all">
            <div className="flex items-center">
              <Settings className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm font-medium">Site Theme</span>
            </div>
            <ThemeSwitcher />
          </div>

          {/* Zoom Settings Group */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-1">Zoom Settings</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between w-full py-2 px-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onZoomOut}
                  className="h-8 w-8 p-0 hover:bg-white dark:hover:bg-gray-700 rounded-md shadow-sm transition-all"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-mono font-medium text-blue-600 dark:text-blue-400">{Math.round(scale * 100)}%</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onZoomIn}
                  className="h-8 w-8 p-0 hover:bg-white dark:hover:bg-gray-700 rounded-md shadow-sm transition-all"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Display Settings Group */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-1">Display Settings</h3>
            <div className="space-y-2">
              <Button
                variant="ghost"
                onClick={() => {
                  onToggleThumbnails();
                  onClose();
                }}
                className="w-full justify-between py-6 px-4 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50 rounded-xl transition-all group"
              >
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 mr-3 group-hover:scale-110 transition-transform">
                    <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="font-medium">{showThumbnails ? 'Hide Thumbnails' : 'Page Thumbnails'}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  onCycleColorFilter();
                }}
                className="w-full justify-between py-6 px-4 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50 rounded-xl transition-all group"
              >
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-900/20 mr-3 group-hover:scale-110 transition-transform">
                    <Palette className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                  </div>
                  <span className="font-medium">Theme: {colorFilter.charAt(0).toUpperCase() + colorFilter.slice(1)}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Button>

              <div className="flex items-center justify-between w-full py-2 px-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDecreaseRotation}
                  className="h-8 w-8 p-0 hover:bg-white dark:hover:bg-gray-700 rounded-md shadow-sm transition-all"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-sm font-mono font-medium text-gray-600 dark:text-gray-300">{rotation}°</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRotate}
                    className="h-8 w-8 p-0 hover:bg-white dark:hover:bg-gray-700 rounded-md shadow-sm transition-all"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  {rotation !== 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onResetRotation}
                      className="h-8 w-8 p-0 hover:bg-white dark:hover:bg-gray-700 rounded-md shadow-sm transition-all text-blue-600 dark:text-blue-400"
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
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-1">Interaction & Media</h3>
            <div className="space-y-2">
              <Button
                variant="ghost"
                onClick={() => {
                  onToggleTTS();
                  onClose();
                }}
                className="w-full justify-between py-6 px-4 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50 rounded-xl transition-all group"
              >
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 mr-3 group-hover:scale-110 transition-transform">
                    <Volume2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="font-medium">{showTTS ? 'Stop Reading' : 'Read Aloud'}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  onToggleTextSelection(!enableTextSelection);
                  onClose();
                }}
                className={`w-full justify-start py-6 px-4 rounded-xl transition-all group border ${
                  enableTextSelection 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                    : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/50 border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50'
                }`}
              >
                <div className={`p-2 rounded-lg mr-3 group-hover:scale-110 transition-transform ${
                  enableTextSelection ? 'bg-blue-100 dark:bg-blue-800' : 'bg-blue-50 dark:bg-blue-900/20'
                }`}>
                  <Type className={`h-4 w-4 ${enableTextSelection ? 'text-blue-700 dark:text-blue-300' : 'text-blue-600 dark:text-blue-400'}`} />
                </div>
                <span className={`font-medium ${enableTextSelection ? 'text-blue-700 dark:text-blue-300' : ''}`}>
                  Text Selection {enableTextSelection ? '(Enabled)' : ''}
                </span>
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  onToggleReadingMode(!readingMode);
                  onClose();
                }}
                className={`w-full justify-start py-6 px-4 rounded-xl transition-all group border ${
                  readingMode 
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' 
                    : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/50 border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50'
                }`}
              >
                <div className={`p-2 rounded-lg mr-3 group-hover:scale-110 transition-transform ${
                  readingMode ? 'bg-amber-100 dark:bg-amber-800' : 'bg-amber-50 dark:bg-amber-900/20'
                }`}>
                  {readingMode ? (
                    <EyeOff className={`h-4 w-4 ${readingMode ? 'text-amber-700 dark:text-amber-300' : 'text-amber-600 dark:text-amber-400'}`} />
                  ) : (
                    <Eye className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  )}
                </div>
                <span className={`font-medium ${readingMode ? 'text-amber-700 dark:text-amber-300' : ''}`}>
                  {readingMode ? 'Exit Reading Mode' : 'Reading Mode'}
                </span>
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  onToggleFullscreen();
                  onClose();
                }}
                className={`w-full justify-start py-6 px-4 rounded-xl transition-all group border ${
                  isFullscreen 
                    ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
                    : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/50 border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50'
                }`}
              >
                <div className={`p-2 rounded-lg mr-3 group-hover:scale-110 transition-transform ${
                  isFullscreen ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  {isFullscreen ? (
                    <Minimize className={`h-4 w-4 ${isFullscreen ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`} />
                  ) : (
                    <Maximize className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  )}
                </div>
                <span className={`font-medium ${isFullscreen ? 'text-gray-900 dark:text-gray-100' : ''}`}>
                  {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </span>
              </Button>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
