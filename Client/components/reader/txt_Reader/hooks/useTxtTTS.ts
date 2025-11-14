import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTxtTTSOptions {
  sections: string[];
  currentSection: number;
  sectionRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

interface UseTxtTTSReturn {
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: (voice: SpeechSynthesisVoice | null) => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  speechPitch: number;
  setSpeechPitch: (pitch: number) => void;
  speechVolume: number;
  setSpeechVolume: (volume: number) => void;
  isSpeaking: boolean;
  isPaused: boolean;
  toggleTextToSpeech: () => void;
  stopTextToSpeech: () => void;
  ttsError: string | null;
  voicesLoading: boolean;
}

/**
 * Custom hook for Text-to-Speech functionality
 * Handles voice management, playback controls, and TTS settings
 */
export function useTxtTTS({
  sections,
  currentSection,
  sectionRefs,
}: UseTxtTTSOptions): UseTxtTTSReturn {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [speechVolume, setSpeechVolume] = useState(1.0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [ttsError, setTtsError] = useState<string | null>(null);

  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize TTS
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis;

      const loadVoices = () => {
        const voices = speechSynthesisRef.current?.getVoices() || [];
        setAvailableVoices(voices);
        if (voices.length > 0 && !selectedVoice) {
          setSelectedVoice(voices[0]);
        }
        setVoicesLoading(false);
      };

      loadVoices();
      speechSynthesisRef.current?.addEventListener('voiceschanged', loadVoices);

      return () => {
        speechSynthesisRef.current?.removeEventListener('voiceschanged', loadVoices);
        speechSynthesisRef.current?.cancel();
      };
    }
  }, [selectedVoice]);

  // Toggle text-to-speech playback
  const toggleTextToSpeech = useCallback(() => {
    if (!speechSynthesisRef.current || !sections[currentSection]) return;

    if (isSpeaking && !isPaused) {
      // Pause
      speechSynthesisRef.current.pause();
      setIsPaused(true);
    } else if (isPaused) {
      // Resume
      speechSynthesisRef.current.resume();
      setIsPaused(false);
    } else {
      // Start new
      const text = sections[currentSection];
      const utterance = new SpeechSynthesisUtterance(text);
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
        setIsSpeaking(false);
        setIsPaused(false);
        // Auto-advance to next section if available
        if (currentSection < sections.length - 1) {
          const nextSection = currentSection + 1;
          sectionRefs.current[nextSection]?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      };

      utterance.onerror = (event) => {
        // Ignore "canceled" error (user clicked stop button)
        if (event.error === 'canceled' || event.error === 'interrupted') {
          setIsSpeaking(false);
          setIsPaused(false);
          return;
        }
        setTtsError(`TTS Error: ${event.error}`);
        setIsSpeaking(false);
        setIsPaused(false);
      };

      currentUtteranceRef.current = utterance;
      speechSynthesisRef.current.speak(utterance);
    }
  }, [isSpeaking, isPaused, sections, currentSection, speechRate, speechPitch, speechVolume, selectedVoice, sectionRefs]);

  const stopTextToSpeech = useCallback(() => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setTtsError(null); // Clear any error when manually stopping
    }
  }, []);

  return {
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
    ttsError,
    voicesLoading,
  };
}
