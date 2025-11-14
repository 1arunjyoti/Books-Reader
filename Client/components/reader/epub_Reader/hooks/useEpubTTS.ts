import { useState, useCallback, useRef, useEffect } from 'react';
import type { Rendition } from 'epubjs';
import { logger } from '@/lib/logger';

interface UseEpubTTSProps {
  renditionRef?: React.MutableRefObject<Rendition | undefined>;
  safeNavigate?: (navigationFn: () => void | Promise<void>) => Promise<void>;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function useEpubTTS({ renditionRef, safeNavigate, onSuccess, onError }: UseEpubTTSProps = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [speechVolume, setSpeechVolume] = useState(1.0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [showTTSControls, setShowTTSControls] = useState(false);
  
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load available voices
  useEffect(() => {
    if (typeof window === 'undefined') return;

    speechSynthesisRef.current = window.speechSynthesis;

    const loadVoices = () => {
      const voices = speechSynthesisRef.current?.getVoices() || [];
      setAvailableVoices(voices);
      setVoicesLoading(false);
      
      if (!selectedVoice && voices.length > 0) {
        setSelectedVoice(voices[0]);
      }
    };

    setVoicesLoading(true);
    loadVoices();

    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.onvoiceschanged = loadVoices;
    }

    return () => {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.onvoiceschanged = null;
      }
    };
  }, [selectedVoice]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      currentUtteranceRef.current = null;
    }
  }, []);

  // Stop TTS on component unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  // Start speaking text (matching original implementation with auto-pagination)
  const startSpeaking = useCallback(() => {
    if (!renditionRef?.current) return;

    // Get the current page text
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const manager = (renditionRef.current as any).manager;
    const iframe = manager?.container?.querySelector('iframe') as HTMLIFrameElement;
    
    if (!iframe?.contentDocument) {
      logger.error('Cannot access iframe content for TTS');
      setTtsError('Cannot access page content');
      onError?.('Cannot access page content');
      return;
    }

    const bodyText = iframe.contentDocument.body.innerText || iframe.contentDocument.body.textContent || '';
    
    if (!bodyText.trim()) {
      logger.error('No text found to read');
      setTtsError('No text found on current page');
      onError?.('No text found on current page');
      return;
    }

    if (!speechSynthesisRef.current) {
      setTtsError('Speech synthesis not available');
      onError?.('Speech synthesis not available');
      return;
    }

    // Clear previous TTS errors
    setTtsError(null);

    // Stop any ongoing speech
    speechSynthesisRef.current.cancel();

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(bodyText);
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.volume = speechVolume;
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      // TTS CONTINUOUS READING FIX: Check if we can go to next page
      // Get current page info to check if there are more pages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const book = renditionRef.current?.book as any;
      let canContinue = false;
      
      if (book?.locations && renditionRef.current) {
        try {
          const currentLocation = renditionRef.current.location;
          const currentCfi = currentLocation?.start?.cfi;
          
          if (currentCfi) {
            const currentPage = book.locations.locationFromCfi(currentCfi);
            const totalPages = book.locations.length();
            
            // Check if there's a next page
            canContinue = currentPage < totalPages - 1;
          }
        } catch (error) {
          console.warn('Error checking page continuation:', error);
        }
      }
      
      if (canContinue && renditionRef.current && safeNavigate) {
        // Move to next page and continue reading
        console.log('📖 TTS: Moving to next page and continuing...');
        
        // RACE CONDITION FIX: Use safeNavigate for TTS auto-pagination
        safeNavigate(async () => {
          if (renditionRef.current) {
            renditionRef.current.next();
            
            // Wait for the page to render before continuing TTS
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (speechSynthesisRef.current) {
              startSpeaking();
            }
          }
        });
      } else {
        // Reached end of book or can't continue
        logger.log('TTS: Reached end of book');
        setIsSpeaking(false);
        setIsPaused(false);
      }
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    utterance.onerror = () => {
      // Silently handle errors without showing to user
      setIsSpeaking(false);
      setIsPaused(false);
      setTtsError(null);
    };

    currentUtteranceRef.current = utterance;
    try {
      speechSynthesisRef.current.speak(utterance);
      onSuccess?.('Text-to-speech started');
    } catch (err) {
      logger.error('Error calling speechSynthesis.speak:', err);
      const errorMessage = String((err as Error).message || err);
      setTtsError(errorMessage);
      onError?.(`TTS error: ${errorMessage}`);
    }
  }, [renditionRef, safeNavigate, speechRate, speechPitch, speechVolume, selectedVoice, onSuccess, onError]);

  // Pause speaking
  const pauseSpeaking = useCallback(() => {
    if (speechSynthesisRef.current && isSpeaking && !isPaused) {
      speechSynthesisRef.current.pause();
      setIsPaused(true);
      onSuccess?.('Text-to-speech paused');
    }
  }, [isSpeaking, isPaused, onSuccess]);

  // Resume speaking
  const resumeSpeaking = useCallback(() => {
    if (speechSynthesisRef.current && isSpeaking && isPaused) {
      speechSynthesisRef.current.resume();
      setIsPaused(false);
      onSuccess?.('Text-to-speech resumed');
    }
  }, [isSpeaking, isPaused, onSuccess]);

  // Toggle TTS controls panel
  const toggleTTSControls = useCallback(() => {
    setShowTTSControls((prev) => !prev);
  }, []);

  return {
    // State
    isSpeaking,
    isPaused,
    ttsError,
    speechRate,
    speechPitch,
    speechVolume,
    availableVoices,
    voicesLoading,
    selectedVoice,
    showTTSControls,
    
    // Setters
    setSpeechRate,
    setSpeechPitch,
    setSpeechVolume,
    setSelectedVoice,
    setShowTTSControls,
    
    // Actions
    startSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    stopSpeaking,
    toggleTTSControls,
  };
}
