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
    <div className="absolute top-0 right-0 bottom-0 w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg z-20 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Text-to-Speech</h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center" aria-label="Close TTS panel">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Error Display */}
        {ttsError && (
          <div className="p-3 rounded text-sm text-red-700 bg-red-100 dark:bg-red-900/50 dark:text-red-300">
            Error: {sanitizeErrorMessage(ttsError)}
          </div>
        )}

        {/* Voice Selection */}
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block font-medium">
            Voice
          </label>
          {voicesLoading ? (
            <select
              disabled
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600"
            >
              <option>Loading voices...</option>
            </select>
          ) : (
            <select
              value={selectedVoice?.name || ''}
              onChange={(e) => {
                const voice = availableVoices.find((v) => v.name === e.target.value);
                setSelectedVoice(voice || null);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {availableVoices.map((voice, index) => (
                <option key={index} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Speech Rate */}
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block font-medium">
            Speed: {speechRate.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={speechRate}
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0.5x</span>
            <span>1.0x</span>
            <span>1.5x</span>
          </div>
        </div>

        {/* Speech Pitch */}
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block font-medium">
            Pitch: {speechPitch.toFixed(1)}
          </label>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={speechPitch}
            onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Low</span>
            <span>Normal</span>
            <span>High</span>
          </div>
        </div>

        {/* Speech Volume */}
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block font-medium">
            Volume: {Math.round(speechVolume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={speechVolume}
            onChange={(e) => setSpeechVolume(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
          <Button
            onClick={toggleTextToSpeech}
            className="flex-1"
            variant={isSpeaking && !isPaused ? 'secondary' : 'default'}
          >
            {!isSpeaking ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start
              </>
            ) : isPaused ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            )}
          </Button>
          {isSpeaking && (
            <Button onClick={stopTextToSpeech} variant="destructive" className="flex-1">
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          )}
        </div>

        {/* Status */}
        {isSpeaking && (
          <div className="text-xs text-center text-gray-600 dark:text-gray-400">
            {isPaused ? '⏸️ Paused' : '▶️ Reading...'}
          </div>
        )}
      </div>
    </div>
  );
}
