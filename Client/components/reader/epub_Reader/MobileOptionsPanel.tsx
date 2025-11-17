"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  ChevronRight,
  Plus,
  Minus,
  Type,
  Book,
  Paintbrush,
  Volume2,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  Settings,
  X,
  RefreshCw,
} from 'lucide-react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

// Type definitions for the hook returns
interface DisplayOptionsHook {
  fontSize: number;
  fontFamily: 'serif' | 'sans-serif';
  lineHeight: number;
  pageLayout: 'single' | 'double';
  rotation: number;
  colorFilter: 'none' | 'sepia' | 'dark' | 'custom';
  customBgColor: string;
  isFullscreen: boolean;
  showColorFilter: boolean;
  showDisplayOptions: boolean;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  increaseLineHeight: () => void;
  decreaseLineHeight: () => void;
  toggleFullscreen: () => void;
  toggleFontFamily: () => void;
  togglePageLayout: () => void;
  rotatePage: () => void;
  resetRotation: () => void;
  toggleColorFilter: () => void;
  cycleColorFilter: () => void;
  toggleDisplayOptions: () => void;
}

interface TTSHook {
  isSpeaking: boolean;
  isPaused: boolean;
  ttsError: string | null;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  availableVoices: SpeechSynthesisVoice[];
  voicesLoading: boolean;
  selectedVoice: SpeechSynthesisVoice | null;
  showTTSControls: boolean;
  setSpeechRate: (rate: number) => void;
  setSpeechPitch: (pitch: number) => void;
  setSpeechVolume: (volume: number) => void;
  setSelectedVoice: (voice: SpeechSynthesisVoice | null) => void;
  setShowTTSControls: (show: boolean) => void;
  startSpeaking: () => void;
  pauseSpeaking: () => void;
  resumeSpeaking: () => void;
  stopSpeaking: () => void;
  toggleTTSControls: () => void;
}

interface MobileOptionsPanelProps {
  showMobileOptions: boolean;
  onClose: () => void;
  displayOptions: DisplayOptionsHook;
  tts: TTSHook;
  enableTextSelection: boolean;
  setEnableTextSelection: (value: boolean) => void;
  readingMode: boolean;
  setReadingMode: (value: boolean) => void;
  decreaseRotation: () => void;
}

export default function MobileOptionsPanel({
  showMobileOptions,
  onClose,
  displayOptions,
  tts,
  enableTextSelection,
  setEnableTextSelection,
  readingMode,
  setReadingMode,
  decreaseRotation,
}: MobileOptionsPanelProps) {
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

          {/* Text Settings Group */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Text Settings</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between w-full py-3 px-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => displayOptions.decreaseFontSize()}
                  className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">Font Size ({displayOptions.fontSize}%)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => displayOptions.increaseFontSize()}
                  className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between w-full py-3 px-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => displayOptions.decreaseLineHeight()}
                  className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">Line Height ({displayOptions.lineHeight.toFixed(1)})</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => displayOptions.increaseLineHeight()}
                  className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={() => { displayOptions.toggleFontFamily(); onClose(); }}
                className="w-full justify-between py-3 px-4 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center">
                  <Type className="h-4 w-4 mr-2" />
                  <span>Font: {displayOptions.fontFamily === 'serif' ? 'Serif' : 'Sans-serif'}</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Display Settings Group */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Display Settings</h3>
            <div className="space-y-2">
              <Button
                variant="ghost"
                onClick={() => { displayOptions.togglePageLayout(); onClose(); }}
                className="w-full justify-between py-3 px-4 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center">
                  <Book className="h-4 w-4 mr-2" />
                  <span>{displayOptions.pageLayout === 'single' ? 'Single Page' : 'Double Page'}</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => { displayOptions.cycleColorFilter(); }}
                className="w-full justify-between py-3 px-4 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center">
                  <Paintbrush className="h-4 w-4 mr-2" />
                  <span>Theme: {displayOptions.colorFilter.charAt(0).toUpperCase() + displayOptions.colorFilter.slice(1)}</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="flex items-center justify-between w-full py-3 px-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={decreaseRotation}
                  className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">Rotation ({displayOptions.rotation}°)</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => displayOptions.rotatePage()}
                    className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  {displayOptions.rotation !== 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => displayOptions.resetRotation()}
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
                onClick={() => { tts.toggleTTSControls(); onClose(); }}
                className="w-full justify-between py-3 px-4 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center">
                  <Volume2 className="h-4 w-4 mr-2" />
                  <span>Text-to-Speech</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                onClick={() => { setEnableTextSelection(!enableTextSelection); onClose(); }}
                className={`w-full justify-start py-3 px-4 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  enableTextSelection ? 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : ''
                }`}
              >
                <Type className="h-4 w-4 mr-2" />
                <span>Text Selection {enableTextSelection ? '(Enabled)' : ''}</span>
              </Button>

              <Button
                variant="ghost"
                onClick={() => { setReadingMode(!readingMode); onClose(); }}
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
                onClick={() => { displayOptions.toggleFullscreen(); onClose(); }}
                className={`w-full justify-start py-3 px-4 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  displayOptions.isFullscreen ? 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : ''
                }`}
              >
                {displayOptions.isFullscreen ? (
                  <><Minimize className="h-4 w-4 mr-2" /><span>Exit Fullscreen</span></>
                ) : (
                  <><Maximize className="h-4 w-4 mr-2" /><span>Enter Fullscreen</span></>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}