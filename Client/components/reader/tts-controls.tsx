"use client";

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, FastForward, Rewind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PDFDocumentProxy = any;

interface TTSControlsProps {
  pdfDoc: PDFDocumentProxy | null;
  currentPage: number;
  numPages: number;
  onPageChange?: (page: number) => void;
}

export default function TTSControls({
  pdfDoc,
  currentPage,
  numPages,
  onPageChange,
}: TTSControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [currentText, setCurrentText] = useState('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
  }, []);

  const extractPageText = async (pageNum: number): Promise<string> => {
    if (!pdfDoc) return '';
    
    try {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item: { str?: string }) => item.str || '')
        .join(' ');
      return text;
    } catch (err) {
      console.error('Error extracting text:', err);
      return '';
    }
  };

  const speak = async () => {
    if (!isSupported || !pdfDoc) return;

    const text = await extractPageText(currentPage);
    if (!text) {
      alert('No text found on this page');
      return;
    }

    setCurrentText(text);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.volume = volume;
    
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      
      // Auto-advance to next page if available
      if (currentPage < numPages && onPageChange) {
        onPageChange(currentPage + 1);
        // Auto-play next page after a short delay
        setTimeout(() => speak(), 500);
      }
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pause = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resume = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentText('');
  };

  const handleRateChange = (value: number[]) => {
    const newRate = value[0];
    setRate(newRate);
    
    // Update current utterance if speaking
    if (utteranceRef.current && isPlaying) {
      utteranceRef.current.rate = newRate;
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    
    // Update current utterance if speaking
    if (utteranceRef.current && isPlaying) {
      utteranceRef.current.volume = newVolume;
    }
  };

  const goToPreviousPage = () => {
    stop();
    if (currentPage > 1 && onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    stop();
    if (currentPage < numPages && onPageChange) {
      onPageChange(currentPage + 1);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Text-to-speech is not supported in your browser
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Volume2 className="h-4 w-4" />
          Read Aloud
        </h3>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPreviousPage}
          disabled={currentPage <= 1 || isPlaying}
          title="Previous page"
          className=''
        >
          <Rewind className="h-5 w-5" />
        </Button>

        {!isPlaying ? (
          <Button
            variant="outline"
            onClick={speak}
            size="lg"
            className="rounded-full h-12 w-12"
            title="Play"
          >
            <Play className="h-6 w-6" />
          </Button>
        ) : isPaused ? (
          <Button
            variant="outline"
            onClick={resume}
            size="lg"
            className="rounded-full h-12 w-12"
            title="Resume"
          >
            <Play className="h-6 w-6" />
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={pause}
            size="lg"
            className="rounded-full h-12 w-12"
            title="Pause"
          >
            <Pause className="h-6 w-6" />
          </Button>
        )}

        <Button
          variant="outline"
          size="lg"
          onClick={stop}
          disabled={!isPlaying}
          className="rounded-full h-12 w-12"
          title="Stop"
        >
          <Square className="h-5 w-5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={goToNextPage}
          disabled={currentPage >= numPages || isPlaying}
          title="Next page"
        >
          <FastForward className="h-5 w-5" />
        </Button>
      </div>

      {/* Speed Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-600 dark:text-gray-400">
            Speed
          </label>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {rate.toFixed(1)}x
          </span>
        </div>
        <Slider
          value={[rate]}
          onValueChange={handleRateChange}
          min={0.5}
          max={2}
          step={0.1}
          className="w-full"
        />
      </div>

      {/* Volume Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-600 dark:text-gray-400">
            Volume
          </label>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {Math.round(volume * 100)}%
          </span>
        </div>
        <Slider
          value={[volume]}
          onValueChange={handleVolumeChange}
          min={0}
          max={1}
          step={0.1}
          className="w-full"
        />
      </div>

      {/* Current Text Preview */}
      {currentText && (
        <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
          {currentText}
        </div>
      )}
    </div>
  );
}
