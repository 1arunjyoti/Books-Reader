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
      className="absolute top-0 right-0 bottom-0 w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg z-20 flex flex-col overflow-y-auto"
      ref={panelRef}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Text-to-Speech</h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Error Display */}
        {ttsError && (
          <div className="p-3 rounded text-sm text-red-700 bg-red-100 dark:bg-red-900/50 dark:text-red-300">
            {ttsError}
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

        {/* Page Info */}
        <div className="text-xs text-center text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-600">
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
