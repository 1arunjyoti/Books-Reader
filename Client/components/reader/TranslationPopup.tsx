'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, RefreshCw, Languages } from 'lucide-react';
import { useMobileDetection } from '@/hooks/useMobileDetection';

interface TranslationPopupProps {
  text: string;
  onDismiss: () => void;
  position?: { x: number; y: number }; // Optional for fixed positioning
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'bn', name: 'Bengali' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ja', name: 'Japanese' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
];

export default function TranslationPopup({
  text,
  onDismiss,
  position,
}: TranslationPopupProps) {
  const [targetLang, setTargetLang] = useState('bn');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const isMobile = useMobileDetection();
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const translateText = async () => {
      if (!text) return;

      setIsLoading(true);
      setError(null);
      setTranslatedText('');

      let specificErrorSet = false;

      try {
        // Auto-detect source language by using 'Autodetect' as source
        const langPair = `Autodetect|${targetLang}`;
        const response = await fetch(
          `/api/translate?text=${encodeURIComponent(text)}&langpair=${langPair}`
        );

        if (!response.ok) {
          throw new Error('Translation failed');
        }

        const data = await response.json();

        if (data.responseStatus === 200) {
          setTranslatedText(data.responseData.translatedText);
        } else {
          const errorMessage = data.responseDetails || 'Translation error';
          if (errorMessage.includes('PLEASE SELECT TWO DISTINCT LANGUAGES')) {
            setError('Source and target languages are the same. Please select a different language.');
            specificErrorSet = true;
          } else {
            throw new Error(errorMessage);
          }
        }
      } catch (err) {
        console.error(err);
        // Don't overwrite specific error messages set above
        if (!specificErrorSet) {
            setError('Failed to translate. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    translateText();
  }, [text, targetLang]);

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate position styles
  const style: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        maxHeight: '80vh',
      }
    : position
    ? {
        position: 'fixed',
        left: Math.min(Math.max(position.x - 160, 10), window.innerWidth - 330), // Keep within bounds
        top: Math.min(Math.max(position.y + 20, 10), window.innerHeight - 300),
        zIndex: 50,
        width: '320px',
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 50,
        width: '320px',
      };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Popup */}
      <div
        ref={popupRef}
        className={`bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden ${
          isMobile ? 'rounded-t-2xl' : 'rounded-xl'
        }`}
        style={style}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <Languages className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Translation
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-4 overflow-y-auto max-h-[60vh]">
          {/* Original Text */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Original
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 italic border-l-2 border-gray-300 dark:border-gray-700 pl-3">
              &quot;{text}&quot;
            </p>
          </div>

          {/* Language Selector */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Translate to
            </label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="text-sm bg-gray-100 dark:bg-gray-800 border-none rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Result */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Result
              </label>
              {translatedText && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="min-h-[80px] bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 relative">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              ) : error ? (
                <p className="text-sm text-red-500">{error}</p>
              ) : (
                <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                  {translatedText}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer attribution for free API */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400 text-center">
          Translated by MyMemory
        </div>
      </div>
    </>
  );
}
