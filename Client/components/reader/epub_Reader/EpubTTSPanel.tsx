'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, X } from 'lucide-react';
import { sanitizeErrorMessage } from '@/lib/sanitize-text';

interface Props {
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
}

export default function EpubTTSPanel({
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
}: Props) {
  return (
    <div className="absolute top-16 right-0 bottom-0 w-80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-l border-gray-200/50 dark:border-gray-700/50 shadow-2xl z-20 flex flex-col overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Text-to-Speech</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose} 
          className="h-8 w-8 p-0 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-full transition-colors" 
          aria-label="Close TTS panel"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Error Display */}
        {ttsError && (
          <div className="p-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-100 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-300 animate-in fade-in slide-in-from-top-2">
            Error: {sanitizeErrorMessage(ttsError)}
          </div>
        )}

        {/* Voice Selection */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wider">
            Voice
          </label>
          {voicesLoading ? (
            <div className="relative">
              <select
                disabled
                className="w-full px-3 py-2.5 text-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 appearance-none cursor-not-allowed"
              >
                <option>Loading voices...</option>
              </select>
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const voice = availableVoices.find((v) => v.name === e.target.value);
                  setSelectedVoice(voice || null);
                }}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
              >
                {availableVoices.map((voice, index) => (
                  <option key={index} value={voice.name} className="bg-white dark:bg-gray-800">
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          )}
        </div>

        {/* Speech Rate */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Speed
            </label>
            <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
              {speechRate.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={speechRate}
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
            <span>Slow</span>
            <span>Normal</span>
            <span>Fast</span>
          </div>
        </div>

        {/* Speech Pitch */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Pitch
            </label>
            <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
              {speechPitch.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={speechPitch}
            onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:accent-purple-500"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
            <span>Low</span>
            <span>Normal</span>
            <span>High</span>
          </div>
        </div>

        {/* Speech Volume */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Volume
            </label>
            <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
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
            className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-600 dark:accent-green-500"
          />
        </div>

        {/* Playback Controls */}
        <div className="flex gap-3 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <Button
            onClick={toggleTextToSpeech}
            className={`flex-1 transition-all shadow-sm ${
              isSpeaking && !isPaused 
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0'
            }`}
          >
            {!isSpeaking ? (
              <>
                <Play className="h-4 w-4 mr-2 fill-current" />
                Start Reading
              </>
            ) : isPaused ? (
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
          {isSpeaking && (
            <Button 
              onClick={stopTextToSpeech} 
              variant="outline" 
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <Square className="h-4 w-4 mr-2 fill-current" />
              Stop
            </Button>
          )}
        </div>

        {/* Status */}
        {isSpeaking && (
          <div className="flex items-center justify-center gap-2 py-2 px-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
            <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-green-500 animate-pulse'}`} />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {isPaused ? 'Paused' : 'Reading aloud...'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
