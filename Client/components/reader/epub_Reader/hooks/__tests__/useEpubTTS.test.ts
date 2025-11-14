/**
 * Unit tests for useEpubTTS hook
 * Tests text-to-speech functionality, voice selection, and playback controls
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useEpubTTS } from '../useEpubTTS';
import type { Rendition } from 'epubjs';

// Mock speech synthesis
const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => [
    { name: 'Voice 1', lang: 'en-US', default: true, localService: true, voiceURI: 'voice1' },
    { name: 'Voice 2', lang: 'en-GB', default: false, localService: true, voiceURI: 'voice2' },
  ]),
  onvoiceschanged: null,
};

interface MockRendition {
  getContents: jest.Mock;
  next: jest.Mock;
  prev: jest.Mock;
  manager: {
    container: {
      querySelector: jest.Mock;
    };
  };
}

describe('useEpubTTS', () => {
  let mockRendition: MockRendition;
  let renditionRef: React.MutableRefObject<Rendition | undefined>;
  const mockSafeNavigate = jest.fn((fn: () => void) => {
    fn();
    return Promise.resolve();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock window.speechSynthesis
    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      value: mockSpeechSynthesis,
    });

    // Track the last utterance created
    type MockUtterance = {
      text: string;
      voice: SpeechSynthesisVoice | null;
      rate: number;
      pitch: number;
      volume: number;
      onend: (() => void) | null;
      onerror: (() => void) | null;
      onpause: (() => void) | null;
      onresume: (() => void) | null;
      onstart: (() => void) | null;
    };

    let lastUtterance: MockUtterance | null = null;

    // Mock SpeechSynthesisUtterance
    global.SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => {
      lastUtterance = {
        text,
        voice: null,
        rate: 1,
        pitch: 1,
        volume: 1,
        onend: null,
        onerror: null,
        onpause: null,
        onresume: null,
        onstart: null,
      };
      return lastUtterance;
    }) as unknown as typeof SpeechSynthesisUtterance;

    // Mock speak to trigger onstart callback
    mockSpeechSynthesis.speak.mockImplementation((utterance: MockUtterance) => {
      if (utterance.onstart) {
        setTimeout(() => utterance.onstart?.(), 0);
      }
    });

    // Mock pause to trigger onpause callback
    mockSpeechSynthesis.pause.mockImplementation(() => {
      if (lastUtterance?.onpause) {
        setTimeout(() => lastUtterance?.onpause?.(), 0);
      }
    });

    // Mock resume to trigger onresume callback
    mockSpeechSynthesis.resume.mockImplementation(() => {
      if (lastUtterance?.onresume) {
        setTimeout(() => lastUtterance?.onresume?.(), 0);
      }
    });

    // Create mock iframe with content
    const mockIframe = {
      contentDocument: {
        body: {
          innerText: 'This is a test text for reading.',
          textContent: 'This is a test text for reading.',
        },
      },
    };

    // Create mock rendition with manager structure
    mockRendition = {
      getContents: jest.fn(() => [
        {
          document: {
            body: {
              textContent: 'This is a test text for reading.',
            },
          },
        },
      ]),
      next: jest.fn().mockResolvedValue(undefined),
      prev: jest.fn().mockResolvedValue(undefined),
      manager: {
        container: {
          querySelector: jest.fn(() => mockIframe),
        },
      },
    };

    renditionRef = {
      current: mockRendition as unknown as Rendition,
    } as React.MutableRefObject<Rendition | undefined>;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useEpubTTS());

      expect(result.current.isSpeaking).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.ttsError).toBeNull();
      expect(result.current.speechRate).toBe(1.0);
      expect(result.current.speechPitch).toBe(1.0);
      expect(result.current.speechVolume).toBe(1.0);
      expect(result.current.showTTSControls).toBe(false);
    });

    it('should load available voices', async () => {
      const { result } = renderHook(() => useEpubTTS());

      await waitFor(() => {
        expect(result.current.availableVoices.length).toBeGreaterThan(0);
      });

      expect(result.current.availableVoices).toHaveLength(2);
      expect(result.current.selectedVoice).toBeTruthy();
    });
  });

  describe('Voice Selection', () => {
    it('should select a voice', async () => {
      const { result } = renderHook(() => useEpubTTS());

      await waitFor(() => {
        expect(result.current.availableVoices.length).toBeGreaterThan(0);
      });

      const newVoice = result.current.availableVoices[1];

      act(() => {
        result.current.setSelectedVoice(newVoice);
      });

      expect(result.current.selectedVoice).toEqual(newVoice);
    });
  });

  describe('Speech Parameters', () => {
    it('should update speech rate', () => {
      const { result } = renderHook(() => useEpubTTS());

      act(() => {
        result.current.setSpeechRate(1.5);
      });

      expect(result.current.speechRate).toBe(1.5);
    });

    it('should update speech pitch', () => {
      const { result } = renderHook(() => useEpubTTS());

      act(() => {
        result.current.setSpeechPitch(1.2);
      });

      expect(result.current.speechPitch).toBe(1.2);
    });

    it('should update speech volume', () => {
      const { result } = renderHook(() => useEpubTTS());

      act(() => {
        result.current.setSpeechVolume(0.8);
      });

      expect(result.current.speechVolume).toBe(0.8);
    });
  });

  describe('TTS Controls Visibility', () => {
    it('should toggle TTS controls panel', () => {
      const { result } = renderHook(() => useEpubTTS());

      expect(result.current.showTTSControls).toBe(false);

      act(() => {
        result.current.setShowTTSControls(true);
      });

      expect(result.current.showTTSControls).toBe(true);

      act(() => {
        result.current.setShowTTSControls(false);
      });

      expect(result.current.showTTSControls).toBe(false);
    });
  });

  describe('Speech Playback', () => {
    it('should start speaking with rendition', async () => {
      const onSuccess = jest.fn();
      const { result } = renderHook(() =>
        useEpubTTS({
          renditionRef,
          safeNavigate: mockSafeNavigate,
          onSuccess,
        })
      );

      await waitFor(() => {
        expect(result.current.availableVoices.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await result.current.startSpeaking();
      });

      expect(mockRendition.manager.container.querySelector).toHaveBeenCalledWith('iframe');
      expect(global.SpeechSynthesisUtterance).toHaveBeenCalled();
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      
      // Wait for the onstart callback to trigger
      await waitFor(() => {
        expect(result.current.isSpeaking).toBe(true);
      });
    });

    it('should handle speaking without rendition', async () => {
      const onError = jest.fn();
      const { result } = renderHook(() =>
        useEpubTTS({
          onError,
        })
      );

      await waitFor(() => {
        expect(result.current.availableVoices.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await result.current.startSpeaking();
      });

      // Should not throw error, just return silently when no rendition
      expect(result.current.isSpeaking).toBe(false);
    });

    it('should stop speaking', async () => {
      const { result } = renderHook(() =>
        useEpubTTS({
          renditionRef,
          safeNavigate: mockSafeNavigate,
        })
      );

      await waitFor(() => {
        expect(result.current.availableVoices.length).toBeGreaterThan(0);
      });

      // Start speaking first
      await act(async () => {
        await result.current.startSpeaking();
      });

      await waitFor(() => {
        expect(result.current.isSpeaking).toBe(true);
      });

      // Stop speaking
      act(() => {
        result.current.stopSpeaking();
      });

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
      expect(result.current.isSpeaking).toBe(false);
      expect(result.current.isPaused).toBe(false);
    });

    it('should pause speaking', async () => {
      const { result } = renderHook(() =>
        useEpubTTS({
          renditionRef,
          safeNavigate: mockSafeNavigate,
        })
      );

      await waitFor(() => {
        expect(result.current.availableVoices.length).toBeGreaterThan(0);
      });

      // Start speaking first
      await act(async () => {
        await result.current.startSpeaking();
      });

      await waitFor(() => {
        expect(result.current.isSpeaking).toBe(true);
      });

      // Pause speaking
      await act(async () => {
        await result.current.pauseSpeaking();
      });

      await waitFor(() => {
        expect(mockSpeechSynthesis.pause).toHaveBeenCalled();
        expect(result.current.isPaused).toBe(true);
      });
    });

    it('should resume speaking', async () => {
      const { result } = renderHook(() =>
        useEpubTTS({
          renditionRef,
          safeNavigate: mockSafeNavigate,
        })
      );

      await waitFor(() => {
        expect(result.current.availableVoices.length).toBeGreaterThan(0);
      });

      // Start and pause first
      await act(async () => {
        await result.current.startSpeaking();
      });

      await waitFor(() => {
        expect(result.current.isSpeaking).toBe(true);
      });

      await act(async () => {
        await result.current.pauseSpeaking();
      });

      await waitFor(() => {
        expect(result.current.isPaused).toBe(true);
      });

      // Resume speaking
      await act(async () => {
        await result.current.resumeSpeaking();
      });

      await waitFor(() => {
        expect(mockSpeechSynthesis.resume).toHaveBeenCalled();
        expect(result.current.isPaused).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle empty text content', async () => {
      const onError = jest.fn();
      const emptyIframe = {
        contentDocument: {
          body: {
            innerText: '   ',
            textContent: '   ',
          },
        },
      };

      const emptyRendition = {
        getContents: jest.fn(() => [
          {
            document: {
              body: {
                textContent: '   ',
              },
            },
          },
        ]),
        manager: {
          container: {
            querySelector: jest.fn(() => emptyIframe),
          },
        },
      };

      const emptyRenditionRef = {
        current: emptyRendition as unknown as Rendition,
      } as React.MutableRefObject<Rendition | undefined>;

      const { result } = renderHook(() =>
        useEpubTTS({
          renditionRef: emptyRenditionRef,
          onError,
        })
      );

      await waitFor(() => {
        expect(result.current.availableVoices.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await result.current.startSpeaking();
      });

      expect(onError).toHaveBeenCalledWith('No text found on current page');
    });
  });

  describe('Cleanup', () => {
    it('should stop speaking on unmount', async () => {
      const { result, unmount } = renderHook(() =>
        useEpubTTS({
          renditionRef,
          safeNavigate: mockSafeNavigate,
        })
      );

      await waitFor(() => {
        expect(result.current.availableVoices.length).toBeGreaterThan(0);
      });

      // Start speaking
      await act(async () => {
        await result.current.startSpeaking();
      });

      // Unmount component
      unmount();

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });
  });
});
