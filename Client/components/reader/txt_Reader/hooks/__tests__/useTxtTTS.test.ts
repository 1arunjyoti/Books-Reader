/**
 * TXT Text-to-Speech Hook Unit Tests
 * Tests the useTxtTTS custom hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useTxtTTS } from '@/components/reader/txt_Reader/hooks/useTxtTTS';
import '@testing-library/jest-dom';
import { MutableRefObject } from 'react';

// Mock SpeechSynthesis API
const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => [
    { name: 'Voice 1', lang: 'en-US' } as SpeechSynthesisVoice,
    { name: 'Voice 2', lang: 'en-GB' } as SpeechSynthesisVoice,
  ]),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  pending: false,
  speaking: false,
  paused: false,
};

// Mock SpeechSynthesisUtterance
class MockSpeechSynthesisUtterance {
  text: string;
  rate: number;
  pitch: number;
  volume: number;
  voice: SpeechSynthesisVoice | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;

  constructor(text: string) {
    this.text = text;
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
    this.voice = null;
    this.onstart = null;
    this.onend = null;
    this.onerror = null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance as any;

describe('useTxtTTS', () => {
  const mockSections = [
    'First section of text to read.',
    'Second section of text to read.',
    'Third section of text to read.',
  ];

  const mockSectionRefs: MutableRefObject<(HTMLDivElement | null)[]> = {
    current: [
      document.createElement('div'),
      document.createElement('div'),
      document.createElement('div'),
    ],
  };

  beforeEach(() => {
    // Mock window.speechSynthesis
    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      value: mockSpeechSynthesis,
    });

    // Mock scrollIntoView
    mockSectionRefs.current.forEach((div) => {
      if (div) {
        div.scrollIntoView = jest.fn();
      }
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default TTS settings', () => {
      const { result } = renderHook(() =>
        useTxtTTS({
          sections: mockSections,
          currentSection: 0,
          sectionRefs: mockSectionRefs,
        })
      );

      expect(result.current.speechRate).toBe(1.0);
      expect(result.current.speechPitch).toBe(1.0);
      expect(result.current.speechVolume).toBe(1.0);
      expect(result.current.isSpeaking).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.ttsError).toBe(null);
    });

    it('should load available voices', async () => {
      const { result } = renderHook(() =>
        useTxtTTS({
          sections: mockSections,
          currentSection: 0,
          sectionRefs: mockSectionRefs,
        })
      );

      await waitFor(() => {
        expect(result.current.voicesLoading).toBe(false);
      });

      expect(result.current.availableVoices.length).toBeGreaterThan(0);
    });

    it('should select first voice by default', async () => {
      const { result } = renderHook(() =>
        useTxtTTS({
          sections: mockSections,
          currentSection: 0,
          sectionRefs: mockSectionRefs,
        })
      );

      await waitFor(() => {
        expect(result.current.selectedVoice).not.toBe(null);
      });

      expect(result.current.selectedVoice?.name).toBe('Voice 1');
    });
  });

  describe('Voice Management', () => {
    it('should allow changing selected voice', async () => {
      const { result } = renderHook(() =>
        useTxtTTS({
          sections: mockSections,
          currentSection: 0,
          sectionRefs: mockSectionRefs,
        })
      );

      await waitFor(() => {
        expect(result.current.availableVoices.length).toBeGreaterThan(0);
      });

      const newVoice = result.current.availableVoices[1];

      act(() => {
        result.current.setSelectedVoice(newVoice);
      });

      expect(result.current.selectedVoice).toBe(newVoice);
    });
  });

  describe('Speech Settings', () => {
    it('should allow changing speech rate', () => {
      const { result } = renderHook(() =>
        useTxtTTS({
          sections: mockSections,
          currentSection: 0,
          sectionRefs: mockSectionRefs,
        })
      );

      act(() => {
        result.current.setSpeechRate(1.5);
      });

      expect(result.current.speechRate).toBe(1.5);
    });

    it('should allow changing speech pitch', () => {
      const { result } = renderHook(() =>
        useTxtTTS({
          sections: mockSections,
          currentSection: 0,
          sectionRefs: mockSectionRefs,
        })
      );

      act(() => {
        result.current.setSpeechPitch(0.8);
      });

      expect(result.current.speechPitch).toBe(0.8);
    });

    it('should allow changing speech volume', () => {
      const { result } = renderHook(() =>
        useTxtTTS({
          sections: mockSections,
          currentSection: 0,
          sectionRefs: mockSectionRefs,
        })
      );

      act(() => {
        result.current.setSpeechVolume(0.5);
      });

      expect(result.current.speechVolume).toBe(0.5);
    });
  });

  describe('Speech Playback', () => {
    it('should start speaking when toggled', () => {
      const { result } = renderHook(() =>
        useTxtTTS({
          sections: mockSections,
          currentSection: 0,
          sectionRefs: mockSectionRefs,
        })
      );

      act(() => {
        result.current.toggleTextToSpeech();
      });

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should pause when speaking', () => {
      const { result } = renderHook(() =>
        useTxtTTS({
          sections: mockSections,
          currentSection: 0,
          sectionRefs: mockSectionRefs,
        })
      );

      // Start speaking
      act(() => {
        result.current.toggleTextToSpeech();
      });

      // Simulate speaking state
      act(() => {
        // Manually set speaking state (in real usage, this would be set by utterance.onstart)
        const mockUtterance = (mockSpeechSynthesis.speak as jest.Mock).mock.calls[0][0];
        if (mockUtterance && mockUtterance.onstart) {
          mockUtterance.onstart();
        }
      });

      // Pause
      act(() => {
        result.current.toggleTextToSpeech();
      });

      expect(mockSpeechSynthesis.pause).toHaveBeenCalled();
    });

    it('should resume when paused', () => {
      const { result } = renderHook(() =>
        useTxtTTS({
          sections: mockSections,
          currentSection: 0,
          sectionRefs: mockSectionRefs,
        })
      );

      // Start speaking
      act(() => {
        result.current.toggleTextToSpeech();
      });

      // Simulate speaking state
      act(() => {
        const mockUtterance = (mockSpeechSynthesis.speak as jest.Mock).mock.calls[0][0];
        if (mockUtterance && mockUtterance.onstart) {
          mockUtterance.onstart();
        }
      });

      // Pause
      act(() => {
        result.current.toggleTextToSpeech();
      });

      // Resume
      act(() => {
        result.current.toggleTextToSpeech();
      });

      expect(mockSpeechSynthesis.resume).toHaveBeenCalled();
    });

    it('should stop speech', () => {
      const { result } = renderHook(() =>
        useTxtTTS({
          sections: mockSections,
          currentSection: 0,
          sectionRefs: mockSectionRefs,
        })
      );

      // Start speaking
      act(() => {
        result.current.toggleTextToSpeech();
      });

      // Stop
      act(() => {
        result.current.stopTextToSpeech();
      });

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
      expect(result.current.isSpeaking).toBe(false);
      expect(result.current.isPaused).toBe(false);
    });

    it('should use current speech settings when starting', () => {
      const { result } = renderHook(() =>
        useTxtTTS({
          sections: mockSections,
          currentSection: 0,
          sectionRefs: mockSectionRefs,
        })
      );

      // Set custom settings
      act(() => {
        result.current.setSpeechRate(1.5);
        result.current.setSpeechPitch(0.8);
        result.current.setSpeechVolume(0.6);
      });

      // Start speaking
      act(() => {
        result.current.toggleTextToSpeech();
      });

      const utterance = (mockSpeechSynthesis.speak as jest.Mock).mock.calls[0][0];
      expect(utterance.rate).toBe(1.5);
      expect(utterance.pitch).toBe(0.8);
      expect(utterance.volume).toBe(0.6);
    });

    it('should read current section text', () => {
      const { result } = renderHook(() =>
        useTxtTTS({
          sections: mockSections,
          currentSection: 1,
          sectionRefs: mockSectionRefs,
        })
      );

      act(() => {
        result.current.toggleTextToSpeech();
      });

      const utterance = (mockSpeechSynthesis.speak as jest.Mock).mock.calls[0][0];
      expect(utterance.text).toBe(mockSections[1]);
    });
  });

  describe('Error Handling', () => {
    it('should handle TTS errors', () => {
      const { result } = renderHook(() =>
        useTxtTTS({
          sections: mockSections,
          currentSection: 0,
          sectionRefs: mockSectionRefs,
        })
      );

      act(() => {
        result.current.toggleTextToSpeech();
      });

      // Simulate error
      const utterance = (mockSpeechSynthesis.speak as jest.Mock).mock.calls[0][0];
      act(() => {
        if (utterance && utterance.onerror) {
          utterance.onerror({ error: 'network' });
        }
      });

      expect(result.current.ttsError).toContain('network');
      expect(result.current.isSpeaking).toBe(false);
    });

    it('should ignore canceled errors', () => {
      const { result } = renderHook(() =>
        useTxtTTS({
          sections: mockSections,
          currentSection: 0,
          sectionRefs: mockSectionRefs,
        })
      );

      act(() => {
        result.current.toggleTextToSpeech();
      });

      // Simulate cancel error
      const utterance = (mockSpeechSynthesis.speak as jest.Mock).mock.calls[0][0];
      act(() => {
        if (utterance && utterance.onerror) {
          utterance.onerror({ error: 'canceled' });
        }
      });

      expect(result.current.ttsError).toBe(null);
    });

    it('should ignore interrupted errors', () => {
      const { result } = renderHook(() =>
        useTxtTTS({
          sections: mockSections,
          currentSection: 0,
          sectionRefs: mockSectionRefs,
        })
      );

      act(() => {
        result.current.toggleTextToSpeech();
      });

      // Simulate interrupted error
      const utterance = (mockSpeechSynthesis.speak as jest.Mock).mock.calls[0][0];
      act(() => {
        if (utterance && utterance.onerror) {
          utterance.onerror({ error: 'interrupted' });
        }
      });

      expect(result.current.ttsError).toBe(null);
    });

    it('should clear error when stopping manually', () => {
      const { result } = renderHook(() =>
        useTxtTTS({
          sections: mockSections,
          currentSection: 0,
          sectionRefs: mockSectionRefs,
        })
      );

      act(() => {
        result.current.toggleTextToSpeech();
      });

      // Simulate error
      const utterance = (mockSpeechSynthesis.speak as jest.Mock).mock.calls[0][0];
      act(() => {
        if (utterance && utterance.onerror) {
          utterance.onerror({ error: 'network' });
        }
      });

      expect(result.current.ttsError).not.toBe(null);

      // Stop TTS
      act(() => {
        result.current.stopTextToSpeech();
      });

      expect(result.current.ttsError).toBe(null);
    });
  });

  describe('Auto-advance', () => {
    it('should advance to next section when finished', () => {
      const { result } = renderHook(() =>
        useTxtTTS({
          sections: mockSections,
          currentSection: 0,
          sectionRefs: mockSectionRefs,
        })
      );

      act(() => {
        result.current.toggleTextToSpeech();
      });

      // Simulate completion
      const utterance = (mockSpeechSynthesis.speak as jest.Mock).mock.calls[0][0];
      act(() => {
        if (utterance && utterance.onend) {
          utterance.onend();
        }
      });

      // Should scroll to next section
      expect(mockSectionRefs.current[1]?.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });
    });

    it('should not advance beyond last section', () => {
      const { result } = renderHook(() =>
        useTxtTTS({
          sections: mockSections,
          currentSection: 2, // Last section
          sectionRefs: mockSectionRefs,
        })
      );

      act(() => {
        result.current.toggleTextToSpeech();
      });

      // Simulate completion
      const utterance = (mockSpeechSynthesis.speak as jest.Mock).mock.calls[0][0];
      act(() => {
        if (utterance && utterance.onend) {
          utterance.onend();
        }
      });

      // Should not try to scroll beyond sections
      expect(mockSectionRefs.current[2]?.scrollIntoView).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cancel speech on unmount', () => {
      const { unmount } = renderHook(() =>
        useTxtTTS({
          sections: mockSections,
          currentSection: 0,
          sectionRefs: mockSectionRefs,
        })
      );

      unmount();

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });
  });

  describe('Voice Change Listener', () => {
    it('should listen for voice changes', () => {
      renderHook(() =>
        useTxtTTS({
          sections: mockSections,
          currentSection: 0,
          sectionRefs: mockSectionRefs,
        })
      );

      expect(mockSpeechSynthesis.addEventListener).toHaveBeenCalledWith(
        'voiceschanged',
        expect.any(Function)
      );
    });

    it('should remove voice change listener on unmount', () => {
      const { unmount } = renderHook(() =>
        useTxtTTS({
          sections: mockSections,
          currentSection: 0,
          sectionRefs: mockSectionRefs,
        })
      );

      unmount();

      expect(mockSpeechSynthesis.removeEventListener).toHaveBeenCalledWith(
        'voiceschanged',
        expect.any(Function)
      );
    });
  });
});
