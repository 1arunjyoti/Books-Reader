import React, { useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, X, Volume2, AlertCircle, Loader2 } from 'lucide-react';
import { sanitizeErrorMessage } from '@/lib/sanitize-text';

interface TxtTTSPanelProps {
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: (v: SpeechSynthesisVoice | null) => void;
  speechRate: number;
  setSpeechRate: (n: number) => void;
  speechPitch: number;
  setSpeechPitch: (n: number) => void;
  speechVolume: number;
  setSpeechVolume: (n: number) => void;
  isSpeaking: boolean;
  isPaused: boolean;
  toggleTextToSpeech: () => void;
  stopTextToSpeech: () => void;
  onClose: () => void;
  ttsError?: string | null;
  voicesLoading?: boolean;
  currentSection: number;
  totalSections: number;
}

export default function TxtTTSPanel({
  availableVoices,
  selectedVoice,
  setSelectedVoice,
  speechRate,
  setSpeechRate,
  speechPitch,
  setSpeechPitch,
  speechVolume,
  setSpeechVolume,
  isSpeaking,
  isPaused,
  toggleTextToSpeech,
  stopTextToSpeech,
  onClose,
  ttsError,
  voicesLoading,
  currentSection,
  totalSections,
}: TxtTTSPanelProps) {
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

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  if (!isSupported) {
    return (
      <div 
        className="absolute top-16 right-0 bottom-0 w-80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-l border-gray-200/50 dark:border-gray-700/50 shadow-2xl z-20 flex flex-col"
        ref={panelRef}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Text-to-Speech</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Text-to-speech is not supported in your browser
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="absolute top-16 right-0 bottom-0 w-80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-l border-gray-200/50 dark:border-gray-700/50 shadow-2xl z-20 flex flex-col overflow-y-auto custom-scrollbar"
      ref={panelRef}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-gray-500" />
          Text-to-Speech
        </h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose} 
          className="h-8 w-8 bg-gray-100/50 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Error Display */}
        {ttsError && (
          <div className="p-3 rounded-lg text-xs font-medium text-red-700 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{sanitizeErrorMessage(ttsError)}</span>
          </div>
        )}

        {/* Section Info */}
        <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">Current Progress</div>
          <div className="flex items-end justify-between">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentSection + 1} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/ {totalSections}</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Section
            </div>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-900/50 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-300" 
              style={{ width: `${((currentSection + 1) / totalSections) * 100}%` }}
            />
          </div>
        </div>

        {/* Voice Selection */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Voice Selection
          </label>
          {voicesLoading ? (
            <div className="flex items-center gap-2 p-3 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading voices...
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const voice = availableVoices.find((v) => v.name === e.target.value);
                  setSelectedVoice(voice || null);
                }}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
              >
                {availableVoices.map((voice, index) => (
                  <option key={index} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <ChevronDownIcon className="h-4 w-4" />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6 pt-2">
          {/* Speech Rate */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Speed
              </label>
              <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                {speechRate.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-medium uppercase">
              <span>Slow</span>
              <span>Normal</span>
              <span>Fast</span>
            </div>
          </div>

          {/* Speech Pitch */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Pitch
              </label>
              <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                {speechPitch.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speechPitch}
              onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-medium uppercase">
              <span>Low</span>
              <span>Normal</span>
              <span>High</span>
            </div>
          </div>

          {/* Speech Volume */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Volume
              </label>
              <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                {Math.round(speechVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={speechVolume}
              onChange={(e) => setSpeechVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>

        {/* Playback Controls */}
        <div className="pt-4 space-y-3">
          <div className="flex gap-3">
            {!isSpeaking ? (
              <Button 
                onClick={toggleTextToSpeech} 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:scale-[1.02]"
              >
                <Play className="h-4 w-4 mr-2 fill-current" />
                Start Reading
              </Button>
            ) : (
              <>
                <Button 
                  onClick={toggleTextToSpeech} 
                  variant="outline" 
                  className="flex-1 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                >
                  {isPaused ? (
                    <>
                      <Play className="h-4 w-4 mr-2 fill-current" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4 mr-2 fill-current" />
                      Pause
                    </>
                  )}
                </Button>
                <Button 
                  onClick={stopTextToSpeech} 
                  variant="destructive" 
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white shadow-sm"
                >
                  <Square className="h-4 w-4 mr-2 fill-current" />
                  Stop
                </Button>
              </>
            )}
          </div>

          {/* Status */}
          {isSpeaking && (
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 py-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg">
              {isPaused ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400"></span>
                  </span>
                  Paused
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  Reading in progress...
                </>
              )}
            </div>
          )}
        </div>

        {/* Info Note */}
        <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
            The reader will automatically continue to the next section when finished.
          </p>
        </div>
      </div>
    </div>
  );
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
