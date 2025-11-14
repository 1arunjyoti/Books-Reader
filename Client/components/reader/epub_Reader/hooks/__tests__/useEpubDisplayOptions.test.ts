/**
 * Unit tests for useEpubDisplayOptions hook
 * Tests display customization: fonts, colors, layout, rotation, fullscreen
 */

import { renderHook, act } from '@testing-library/react';
import { useEpubDisplayOptions } from '../useEpubDisplayOptions';
import type { Rendition } from 'epubjs';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

interface MockRendition {
  themes: {
    default: jest.Mock;
    fontSize: jest.Mock;
    override: jest.Mock;
    register: jest.Mock;
  };
  manager: {
    container: {
      querySelector: jest.Mock;
    };
  };
}

describe('useEpubDisplayOptions', () => {
  let mockRendition: MockRendition;
  let renditionRef: React.MutableRefObject<Rendition | undefined>;
  const bookId = 'test-book-123';
  let onFontChange: jest.Mock;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();

    onFontChange = jest.fn();

    // Mock Fullscreen API
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      value: null,
    });
    document.documentElement.requestFullscreen = jest.fn().mockResolvedValue(undefined);
    document.exitFullscreen = jest.fn().mockResolvedValue(undefined);

    // Create mock iframe and document
    const mockBody = {
      style: {
        transform: '',
        fontFamily: '',
        fontSize: '',
        lineHeight: '',
        backgroundColor: '',
        color: '',
      },
    };

    const mockIframe = {
      contentDocument: {
        body: mockBody,
      },
    };

    mockRendition = {
      themes: {
        default: jest.fn(),
        fontSize: jest.fn(),
        override: jest.fn(),
        register: jest.fn(),
      },
      manager: {
        container: {
          querySelector: jest.fn().mockReturnValue(mockIframe),
        },
      },
    };

    renditionRef = {
      current: mockRendition as unknown as Rendition,
    } as React.MutableRefObject<Rendition | undefined>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default values when localStorage is empty', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      expect(result.current.fontSize).toBe(100);
      expect(result.current.fontFamily).toBe('serif');
      expect(result.current.lineHeight).toBe(1.5);
      expect(result.current.rotation).toBe(0);
      expect(result.current.colorFilter).toBe('none');
      expect(result.current.isFullscreen).toBe(false);
      expect(result.current.showColorFilter).toBe(false);
      expect(result.current.showDisplayOptions).toBe(false);
    });

    it('should load saved values from localStorage', () => {
      localStorageMock.setItem('epub-fontSize', '120');
      localStorageMock.setItem('epub-fontFamily', 'sans-serif');
      localStorageMock.setItem('epub-lineHeight', '1.8');
      localStorageMock.setItem(`epub-rotation-${bookId}`, '90');

      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      expect(result.current.fontSize).toBe(120);
      expect(result.current.fontFamily).toBe('sans-serif');
      expect(result.current.lineHeight).toBe(1.8);
      expect(result.current.rotation).toBe(90);
    });
  });

  describe('Font Size Management', () => {
    it('should increase font size', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.increaseFontSize();
      });

      expect(result.current.fontSize).toBe(110);
    });

    it('should decrease font size', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.decreaseFontSize();
      });

      expect(result.current.fontSize).toBe(90);
    });

    it('should not decrease font size below 50', () => {
      localStorageMock.setItem('epub-fontSize', '50');

      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.decreaseFontSize();
      });

      expect(result.current.fontSize).toBe(50);
    });

    it('should not increase font size above 200', () => {
      localStorageMock.setItem('epub-fontSize', '200');

      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.increaseFontSize();
      });

      expect(result.current.fontSize).toBe(200);
    });

    it('should persist font size to localStorage', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.increaseFontSize();
      });

      expect(localStorageMock.getItem('epub-fontSize')).toBe('110');
    });

    it('should apply font size to rendition', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.increaseFontSize();
      });

      expect(mockRendition.themes.fontSize).toHaveBeenCalledWith('110%');
    });
  });

  describe('Font Family Management', () => {
    it('should toggle font family from serif to sans-serif', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.toggleFontFamily();
      });

      expect(result.current.fontFamily).toBe('sans-serif');
    });

    it('should toggle font family from sans-serif to serif', () => {
      localStorageMock.setItem('epub-fontFamily', 'sans-serif');

      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.toggleFontFamily();
      });

      expect(result.current.fontFamily).toBe('serif');
    });

    it('should persist font family to localStorage', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.toggleFontFamily();
      });

      expect(localStorageMock.getItem('epub-fontFamily')).toBe('sans-serif');
    });

    it('should apply font family to rendition', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      // Clear initial call
      mockRendition.themes.default.mockClear();

      act(() => {
        result.current.toggleFontFamily();
      });

      expect(mockRendition.themes.default).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            'font-family': 'Arial, sans-serif',
          }),
        })
      );
    });
  });

  describe('Line Height Management', () => {
    it('should increase line height', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.increaseLineHeight();
      });

      expect(result.current.lineHeight).toBe(1.6);
    });

    it('should decrease line height', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.decreaseLineHeight();
      });

      expect(result.current.lineHeight).toBe(1.4);
    });

    it('should not decrease line height below 1.0', () => {
      localStorageMock.setItem('epub-lineHeight', '1.0');

      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.decreaseLineHeight();
      });

      expect(result.current.lineHeight).toBe(1.0);
    });

    it('should not increase line height above 2.5', () => {
      localStorageMock.setItem('epub-lineHeight', '2.5');

      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.increaseLineHeight();
      });

      expect(result.current.lineHeight).toBe(2.5);
    });

    it('should persist line height to localStorage', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.increaseLineHeight();
      });

      expect(localStorageMock.getItem('epub-lineHeight')).toBe('1.6');
    });

    it('should apply line height to rendition', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      // Clear initial call
      mockRendition.themes.default.mockClear();

      act(() => {
        result.current.increaseLineHeight();
      });

      expect(mockRendition.themes.default).toHaveBeenCalledWith(
        expect.objectContaining({
          p: expect.objectContaining({
            'line-height': expect.stringContaining('1.6'),
          }),
        })
      );
    });
  });

  describe('Color Filter Management', () => {
    it('should set sepia color filter', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.setColorFilter('sepia');
      });

      expect(result.current.colorFilter).toBe('sepia');
    });

    it('should apply sepia color theme to rendition', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.setColorFilter('sepia');
      });

      // Clear any initial calls
      mockRendition.themes.override.mockClear();

      // Now apply the theme after state update
      act(() => {
        result.current.applyColorTheme(mockRendition as unknown as Rendition);
      });

      expect(mockRendition.themes.override).toHaveBeenCalledWith('background', '#f4ecd8');
      expect(mockRendition.themes.override).toHaveBeenCalledWith('color', '#5b4636');
    });

    it('should set dark color filter', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.setColorFilter('dark');
      });

      expect(result.current.colorFilter).toBe('dark');
    });

    it('should apply dark color theme to rendition', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.setColorFilter('dark');
      });

      // Clear any initial calls
      mockRendition.themes.override.mockClear();

      // Now apply the theme after state update
      act(() => {
        result.current.applyColorTheme(mockRendition as unknown as Rendition);
      });

      expect(mockRendition.themes.override).toHaveBeenCalledWith('background', '#1a1a1a');
      expect(mockRendition.themes.override).toHaveBeenCalledWith('color', '#e0e0e0');
    });

    it('should set custom color filter', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.setCustomBgColor('#f0f0f0');
        result.current.setColorFilter('custom');
      });

      expect(result.current.colorFilter).toBe('custom');
      expect(result.current.customBgColor).toBe('#f0f0f0');
    });

    it('should apply custom color theme to rendition', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.setCustomBgColor('#f0f0f0');
        result.current.setColorFilter('custom');
      });

      // Clear any initial calls
      mockRendition.themes.override.mockClear();

      // Now apply the theme after state update
      act(() => {
        result.current.applyColorTheme(mockRendition as unknown as Rendition);
      });

      expect(mockRendition.themes.override).toHaveBeenCalledWith('background', '#f0f0f0');
    });

    it('should set color filter to none', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      // First apply a filter
      act(() => {
        result.current.setColorFilter('sepia');
      });

      // Then remove it
      act(() => {
        result.current.setColorFilter('none');
      });

      expect(result.current.colorFilter).toBe('none');
    });

    it('should apply none color theme to rendition', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.setColorFilter('none');
        result.current.applyColorTheme(mockRendition as unknown as Rendition);
      });

      expect(mockRendition.themes.override).toHaveBeenCalledWith('background', '#ffffff');
      expect(mockRendition.themes.override).toHaveBeenCalledWith('color', '#000000');
    });

    it('should toggle color filter panel', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.toggleColorFilter();
      });

      expect(result.current.showColorFilter).toBe(true);

      act(() => {
        result.current.toggleColorFilter();
      });

      expect(result.current.showColorFilter).toBe(false);
    });
  });

  describe('Rotation Management', () => {
    it('should rotate page 90 degrees clockwise', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.rotatePage();
      });

      expect(result.current.rotation).toBe(90);
    });

    it('should rotate page 180 degrees after two rotations', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.rotatePage();
        result.current.rotatePage();
      });

      expect(result.current.rotation).toBe(180);
    });

    it('should rotate page 270 degrees after three rotations', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.rotatePage();
        result.current.rotatePage();
        result.current.rotatePage();
      });

      expect(result.current.rotation).toBe(270);
    });

    it('should cycle back to 0 degrees after 360 degrees', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.rotatePage();
        result.current.rotatePage();
        result.current.rotatePage();
        result.current.rotatePage();
      });

      expect(result.current.rotation).toBe(0);
    });

    it('should reset rotation to 0', () => {
      localStorageMock.setItem(`epub-rotation-${bookId}`, '90');

      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.resetRotation();
      });

      expect(result.current.rotation).toBe(0);
    });

    it('should persist rotation to localStorage with bookId', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.rotatePage();
      });

      expect(localStorageMock.getItem(`epub-rotation-${bookId}`)).toBe('90');
    });

    it('should apply rotation transform to iframe body', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      const mockIframe = mockRendition.manager.container.querySelector();

      act(() => {
        result.current.rotatePage();
      });

      // Give time for the effect to run
      expect(mockIframe.contentDocument.body.style.transform).toBe('rotate(90deg)');
    });

    it('should directly set rotation with setRotation', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.setRotation(270);
      });

      expect(result.current.rotation).toBe(270);
    });
  });

  describe('Fullscreen Management', () => {
    it('should toggle fullscreen on', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.toggleFullscreen();
      });

      expect(result.current.isFullscreen).toBe(true);
      expect(document.documentElement.requestFullscreen).toHaveBeenCalled();
    });

    it('should toggle fullscreen off', () => {
      // Mock fullscreenElement as set (fullscreen is active)
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: document.documentElement,
      });

      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.toggleFullscreen();
      });

      expect(result.current.isFullscreen).toBe(false);
      expect(document.exitFullscreen).toHaveBeenCalled();

      // Reset for other tests
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: null,
      });
    });
  });

  describe('Display Options Panel', () => {
    it('should toggle display options panel', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.toggleDisplayOptions();
      });

      expect(result.current.showDisplayOptions).toBe(true);

      act(() => {
        result.current.toggleDisplayOptions();
      });

      expect(result.current.showDisplayOptions).toBe(false);
    });
  });

  describe('Font Change Callback', () => {
    it('should call onFontChange callback when font size changes', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.increaseFontSize();
      });

      // Wait for debounced callback
      setTimeout(() => {
        expect(onFontChange).toHaveBeenCalled();
      }, 500);
    });

    it('should call onFontChange callback when font family changes', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.toggleFontFamily();
      });

      // Wait for debounced callback
      setTimeout(() => {
        expect(onFontChange).toHaveBeenCalled();
      }, 500);
    });

    it('should call onFontChange callback when line height changes', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.increaseLineHeight();
      });

      // Wait for debounced callback
      setTimeout(() => {
        expect(onFontChange).toHaveBeenCalled();
      }, 500);
    });
  });

  describe('Page Layout', () => {
    it('should initialize with single page layout', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      expect(result.current.pageLayout).toBe('single');
    });

    it('should toggle page layout to double', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.setPageLayout('double');
      });

      expect(result.current.pageLayout).toBe('double');
    });

    it('should toggle page layout back to single', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.setPageLayout('double');
      });

      act(() => {
        result.current.setPageLayout('single');
      });

      expect(result.current.pageLayout).toBe('single');
    });
  });

  describe('Custom Background Color', () => {
    it('should update custom background color', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      act(() => {
        result.current.setCustomBgColor('#123456');
      });

      expect(result.current.customBgColor).toBe('#123456');
    });

    it('should initialize with white background', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      expect(result.current.customBgColor).toBe('#ffffff');
    });
  });

  describe('No Rendition Handling', () => {
    it('should handle font size changes gracefully when rendition is undefined', () => {
      renditionRef.current = undefined;

      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      expect(() => {
        act(() => {
          result.current.increaseFontSize();
        });
      }).not.toThrow();

      expect(result.current.fontSize).toBe(110);
    });

    it('should handle color filter changes gracefully when rendition is undefined', () => {
      renditionRef.current = undefined;

      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      expect(() => {
        act(() => {
          result.current.setColorFilter('sepia');
        });
      }).not.toThrow();

      expect(result.current.colorFilter).toBe('sepia');
    });

    it('should handle applyColorTheme gracefully when rendition is undefined', () => {
      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      expect(() => {
        act(() => {
          result.current.applyColorTheme(undefined as unknown as Rendition);
        });
      }).not.toThrow();
    });

    it('should handle applyFontSettings gracefully when rendition is undefined', () => {
      renditionRef.current = undefined;

      const { result } = renderHook(() =>
        useEpubDisplayOptions({
          renditionRef,
          bookId,
          onFontChange,
        })
      );

      expect(() => {
        act(() => {
          result.current.applyFontSettings();
        });
      }).not.toThrow();
    });
  });
});
