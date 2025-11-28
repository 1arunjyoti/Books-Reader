"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { Play, Pause, Square, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PDFDocumentProxy = any;

interface PDFTTSPanelProps {
  pdfDoc: PDFDocumentProxy | null;
  currentPage: number;
  numPages: number;
  onPageChange?: (page: number) => void;
  onClose: () => void;
}

function PDFTTSPanel({
  pdfDoc,
  currentPage,
  numPages,
  onPageChange,
  onClose,
}: PDFTTSPanelProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const [speechPitch, setSpeechPitch] = useState(1);
  const [speechVolume, setSpeechVolume] = useState(1);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isIntentionallyStoppingRef = useRef(false);
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stopDelayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Text cache: Map<pageNumber, extractedText>
  // Cache up to 20 pages of extracted text to avoid re-extraction
  const textCacheRef = useRef<Map<number, string>>(new Map());

  // Check browser support and load voices
  useEffect(() => {
    const supported = 'speechSynthesis' in window;
    setIsSupported(supported);

    if (!supported) {
      setVoicesLoading(false);
      return;
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        setSelectedVoice(voices[0]);
        setVoicesLoading(false);
      }
    };

    // Load voices immediately if available
    if (window.speechSynthesis.getVoices().length > 0) {
      loadVoices();
    }

    // Listen for voices loaded event
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Check speech synthesis state when panel opens
  useEffect(() => {
    if (isSupported && window.speechSynthesis) {
      const isSpeakingNow = window.speechSynthesis.speaking;
      const isPausedNow = window.speechSynthesis.paused;
      
      if (isSpeakingNow) {
        setIsSpeaking(true);
        setIsPaused(isPausedNow);
      }
    }
  }, [isSupported]);

  // Memoize onClose to prevent recreation on every render
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

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

  // Cleanup text cache and timeouts on unmount
  useEffect(() => {
    const cache = textCacheRef.current;
    const autoAdvanceTimeout = autoAdvanceTimeoutRef.current;
    const stopDelayTimeout = stopDelayTimeoutRef.current;
    
    return () => {
      // Clear any pending timeouts
      if (autoAdvanceTimeout) {
        clearTimeout(autoAdvanceTimeout);
      }
      if (stopDelayTimeout) {
        clearTimeout(stopDelayTimeout);
      }
      // Clear text cache
      cache.clear();
    };
  }, []);

  const extractPageText = useCallback(async (pageNum: number): Promise<string> => {
    if (!pdfDoc) return '';

    // Check cache first
    const cached = textCacheRef.current.get(pageNum);
    if (cached !== undefined) {
      return cached;
    }

    // Not in cache - extract text
    let page = null;
    try {
      page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item: { str?: string }) => item.str || '')
        .join(' ');

      // Add to cache with LRU eviction
      const TEXT_CACHE_SIZE = 20; // Cache up to 20 pages
      if (textCacheRef.current.size >= TEXT_CACHE_SIZE) {
        // Remove the oldest entry (first entry in the Map)
        const firstKey = textCacheRef.current.keys().next().value;
        if (firstKey !== undefined) {
          textCacheRef.current.delete(firstKey);
        }
      }
      
      textCacheRef.current.set(pageNum, text);
      return text;
    } catch (err) {
      logger.error('Error extracting text from page:', err);
      setTtsError('Failed to extract text from page');
      return '';
    } finally {
      // Always free page resources to prevent memory leaks
      if (page && typeof page.cleanup === 'function') {
        page.cleanup();
      }
    }
  }, [pdfDoc]);

  const toggleTextToSpeech = async () => {
    if (!isSupported) {
      setTtsError('Text-to-speech is not supported');
      return;
    }

    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    setTtsError(null);
    const text = await extractPageText(currentPage);

    if (!text.trim()) {
      setTtsError('No text found on this page');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.volume = speechVolume;

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);

      // Auto-advance to next page if available
      if (currentPage < numPages && onPageChange) {
        onPageChange(currentPage + 1);
        // Auto-play next page after a short delay
        autoAdvanceTimeoutRef.current = setTimeout(() => {
          const nextUtterance = new SpeechSynthesisUtterance('');
          nextUtterance.voice = selectedVoice;
          nextUtterance.rate = speechRate;
          nextUtterance.pitch = speechPitch;
          nextUtterance.volume = speechVolume;

          // Extract and speak next page
          extractPageText(currentPage + 1).then((nextText) => {
            if (nextText.trim()) {
              nextUtterance.text = nextText;
              window.speechSynthesis.speak(nextUtterance);
              setIsSpeaking(true);
              setIsPaused(false);
              utteranceRef.current = nextUtterance;
            }
          });
        }, 500);
      }
    };

    utterance.onerror = (event) => {
      // Ignore "interrupted" errors that occur when intentionally stopping
      if (event.error === 'interrupted' && isIntentionallyStoppingRef.current) {
        return;
      }
      setTtsError(`Speech error: ${event.error}`);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
  };

  const stopTextToSpeech = () => {
    // Clear auto-advance timeout if it exists
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    
    isIntentionallyStoppingRef.current = true;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    // Reset the flag after a brief delay to allow the cancel to complete
    stopDelayTimeoutRef.current = setTimeout(() => {
      isIntentionallyStoppingRef.current = false;
    }, 100);
  };

  if (!isSupported) {
    return (
      <div
        className="absolute top-0 right-0 bottom-0 w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg z-20 flex flex-col"
        ref={panelRef}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Text-to-Speech</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Text-to-speech is not supported in your browser
          </p>
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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Text-to-Speech</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose} 
          className="h-8 w-8 p-0 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Error Display */}
        {ttsError && (
          <div className="p-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-100 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-300 animate-in fade-in slide-in-from-top-2">
            {ttsError}
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

        {/* Page Info */}
        <div className="text-xs text-center text-gray-400 dark:text-gray-500 pt-2">
          Page {currentPage} of {numPages}
        </div>
      </div>
    </div>
  );
}

const propsAreEqual = (prevProps: PDFTTSPanelProps, nextProps: PDFTTSPanelProps) => {
  return (
    prevProps.pdfDoc === nextProps.pdfDoc &&
    prevProps.currentPage === nextProps.currentPage &&
    prevProps.numPages === nextProps.numPages &&
    prevProps.onPageChange === nextProps.onPageChange &&
    prevProps.onClose === nextProps.onClose
  );
};

export default React.memo(PDFTTSPanel, propsAreEqual);
