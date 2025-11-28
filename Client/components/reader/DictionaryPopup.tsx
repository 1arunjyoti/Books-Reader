'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Volume2, Loader2, Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface DictionaryPopupProps {
  text: string;
  onDismiss: () => void;
  position?: { x: number; y: number };
}

interface Definition {
  word: string;
  phonetic?: string;
  phonetics: Array<{
    text?: string;
    audio?: string;
  }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms: string[];
      antonyms: string[];
    }>;
    synonyms: string[];
    antonyms: string[];
  }>;
  sourceUrls: string[];
}

export default function DictionaryPopup({ text, onDismiss, position }: DictionaryPopupProps) {
  const [definition, setDefinition] = useState<Definition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchDefinition = async () => {
      if (!text) return;

      setLoading(true);
      setError(null);
      setDefinition(null);

      try {
        // Clean the text to get a single word if possible, or just use the selection
        const word = text.trim().split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, '');
        
        if (!word) {
            setError('Please select a valid word.');
            setLoading(false);
            return;
        }

        const response = await fetch(`/api/dictionary?word=${encodeURIComponent(word)}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch definition');
        }

        if (Array.isArray(data) && data.length > 0) {
          setDefinition(data[0]);
        } else {
          setError('No definition found.');
        }
      } catch (err) {
        logger.error('Dictionary error:', err);
        setError('Could not find definition.');
      } finally {
        setLoading(false);
      }
    };

    fetchDefinition();
  }, [text]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onDismiss();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onDismiss]);

  const playAudio = () => {
    if (definition?.phonetics) {
      // Find the first phonetic with a non-empty audio URL
      const audioSrc = definition.phonetics.find(p => p.audio && p.audio.length > 0)?.audio;
      
      if (audioSrc) {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        
        // Ensure protocol is present if missing
        const validSrc = audioSrc.startsWith('//') ? `https:${audioSrc}` : audioSrc;
        
        const audio = new Audio(validSrc);
        audioRef.current = audio;
        audio.play().catch(e => logger.error("Audio play error", e));
      }
    }
  };

  const hasAudio = definition?.phonetics?.some(p => p.audio && p.audio.length > 0);

  // Calculate position styles
  const style: React.CSSProperties = position
    ? {
        position: 'fixed',
        left: Math.min(Math.max(position.x, 20), window.innerWidth - 340), // Keep within bounds
        top: Math.min(Math.max(position.y + 20, 20), window.innerHeight - 400),
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };

  return (
    <div
      ref={popupRef}
      style={style}
      className="z-50 w-80 max-h-[400px] flex flex-col bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <Book className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Dictionary
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-6 w-6 p-0 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <span className="text-xs">Looking up...</span>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-sm text-red-500 mb-1">{error}</p>
            <p className="text-xs text-gray-400">Try selecting a single word.</p>
          </div>
        ) : definition ? (
          <div className="space-y-4">
            {/* Word & Phonetic */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {definition.word}
                </h3>
                {definition.phonetic && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {definition.phonetic}
                  </p>
                )}
              </div>
              {hasAudio && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={playAudio}
                  className="rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Meanings */}
            <div className="space-y-4">
              {definition.meanings.map((meaning, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                      {meaning.partOfSpeech}
                    </span>
                    <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
                  </div>
                  <ul className="space-y-2">
                    {meaning.definitions.slice(0, 3).map((def, dIdx) => (
                      <li key={dIdx} className="text-sm text-gray-700 dark:text-gray-300 pl-2 border-l-2 border-gray-100 dark:border-gray-800">
                        <p>{def.definition}</p>
                        {def.example && (
                          <p className="text-xs text-gray-500 mt-0.5 italic">
                            &quot;{def.example}&quot;
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
