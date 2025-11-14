/**
 * TXT Display Options Hook Unit Tests
 * Tests the useTxtDisplayOptions custom hook
 */

import { renderHook, act } from '@testing-library/react';
import { useTxtDisplayOptions } from '@/components/reader/txt_Reader/hooks/useTxtDisplayOptions';
import '@testing-library/jest-dom';

describe('useTxtDisplayOptions', () => {
  beforeEach(() => {
    // Mock fullscreen API
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      value: null,
    });
    document.documentElement.requestFullscreen = jest.fn();
    document.exitFullscreen = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());

      expect(result.current.fontSize).toBe(18);
      expect(result.current.fontFamily).toBe('serif');
      expect(result.current.lineHeight).toBe(1.6);
      expect(result.current.textAlign).toBe('left');
      expect(result.current.colorFilter).toBe('none');
      expect(result.current.customBgColor).toBe('#ffffff');
      expect(result.current.customTextColor).toBe('#000000');
      expect(result.current.isFullscreen).toBe(false);
    });
  });

  describe('Font Size Management', () => {
    it('should increase font size', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());
      const initialSize = result.current.fontSize;

      act(() => {
        result.current.increaseFontSize();
      });

      expect(result.current.fontSize).toBe(initialSize + 2);
    });

    it('should decrease font size', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());
      const initialSize = result.current.fontSize;

      act(() => {
        result.current.decreaseFontSize();
      });

      expect(result.current.fontSize).toBe(initialSize - 2);
    });

    it('should not exceed maximum font size (32px)', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());

      // Set to near max
      act(() => {
        result.current.setFontSize(31);
      });

      // Try to increase beyond max
      act(() => {
        result.current.increaseFontSize();
        result.current.increaseFontSize();
        result.current.increaseFontSize();
      });

      expect(result.current.fontSize).toBeLessThanOrEqual(32);
    });

    it('should not go below minimum font size (10px)', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());

      // Set to near min
      act(() => {
        result.current.setFontSize(11);
      });

      // Try to decrease below min
      act(() => {
        result.current.decreaseFontSize();
        result.current.decreaseFontSize();
        result.current.decreaseFontSize();
      });

      expect(result.current.fontSize).toBeGreaterThanOrEqual(10);
    });

    it('should allow manual font size setting', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());

      act(() => {
        result.current.setFontSize(24);
      });

      expect(result.current.fontSize).toBe(24);
    });
  });

  describe('Line Height Management', () => {
    it('should increase line height', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());
      const initialHeight = result.current.lineHeight;

      act(() => {
        result.current.increaseLineHeight();
      });

      expect(result.current.lineHeight).toBeCloseTo(initialHeight + 0.1, 1);
    });

    it('should decrease line height', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());
      const initialHeight = result.current.lineHeight;

      act(() => {
        result.current.decreaseLineHeight();
      });

      expect(result.current.lineHeight).toBeCloseTo(initialHeight - 0.1, 1);
    });

    it('should not exceed maximum line height (2.5)', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());

      act(() => {
        result.current.setLineHeight(2.4);
      });

      act(() => {
        result.current.increaseLineHeight();
        result.current.increaseLineHeight();
      });

      expect(result.current.lineHeight).toBeLessThanOrEqual(2.5);
    });

    it('should not go below minimum line height (1.0)', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());

      act(() => {
        result.current.setLineHeight(1.1);
      });

      act(() => {
        result.current.decreaseLineHeight();
        result.current.decreaseLineHeight();
      });

      expect(result.current.lineHeight).toBeGreaterThanOrEqual(1.0);
    });
  });

  describe('Font Family Management', () => {
    it('should allow setting font family', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());

      act(() => {
        result.current.setFontFamily('sans-serif');
      });

      expect(result.current.fontFamily).toBe('sans-serif');

      act(() => {
        result.current.setFontFamily('monospace');
      });

      expect(result.current.fontFamily).toBe('monospace');
    });
  });

  describe('Text Align Management', () => {
    it('should allow setting text alignment', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());

      act(() => {
        result.current.setTextAlign('center');
      });

      expect(result.current.textAlign).toBe('center');

      act(() => {
        result.current.setTextAlign('justify');
      });

      expect(result.current.textAlign).toBe('justify');

      act(() => {
        result.current.setTextAlign('right');
      });

      expect(result.current.textAlign).toBe('right');
    });
  });

  describe('Color Filter Management', () => {
    it('should allow changing color filter', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());

      act(() => {
        result.current.setColorFilter('sepia');
      });

      expect(result.current.colorFilter).toBe('sepia');

      act(() => {
        result.current.setColorFilter('dark');
      });

      expect(result.current.colorFilter).toBe('dark');
    });

    it('should return correct background color for sepia filter', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());

      act(() => {
        result.current.setColorFilter('sepia');
      });

      expect(result.current.getBackgroundColor).toBe('#f4ecd8');
    });

    it('should return correct background color for dark filter', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());

      act(() => {
        result.current.setColorFilter('dark');
      });

      expect(result.current.getBackgroundColor).toBe('#1a1a1a');
    });

    it('should return custom background color when filter is custom', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());
      const customColor = '#ff0000';

      act(() => {
        result.current.setCustomBgColor(customColor);
        result.current.setColorFilter('custom');
      });

      expect(result.current.getBackgroundColor).toBe(customColor);
    });

    it('should return white background for none filter', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());

      act(() => {
        result.current.setColorFilter('none');
      });

      expect(result.current.getBackgroundColor).toBe('#ffffff');
    });
  });

  describe('Text Color Management', () => {
    it('should return correct text color for dark mode', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());

      act(() => {
        result.current.setColorFilter('dark');
      });

      expect(result.current.getTextColor).toBe('#e0e0e0');
    });

    it('should return correct text color for sepia mode', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());

      act(() => {
        result.current.setColorFilter('sepia');
      });

      expect(result.current.getTextColor).toBe('#5c4a3a');
    });

    it('should return custom text color when filter is custom', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());
      const customTextColor = '#00ff00';

      act(() => {
        result.current.setCustomTextColor(customTextColor);
        result.current.setColorFilter('custom');
      });

      expect(result.current.getTextColor).toBe(customTextColor);
    });

    it('should return black text for none filter', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());

      act(() => {
        result.current.setColorFilter('none');
      });

      expect(result.current.getTextColor).toBe('#000000');
    });
  });

  describe('Fullscreen Management', () => {
    it('should toggle fullscreen mode', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());

      act(() => {
        result.current.toggleFullscreen();
      });

      expect(document.documentElement.requestFullscreen).toHaveBeenCalled();
      expect(result.current.isFullscreen).toBe(true);
    });

    it('should exit fullscreen when already in fullscreen', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());

      // Set up fullscreen state
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: document.documentElement,
      });

      act(() => {
        result.current.toggleFullscreen();
      });

      expect(document.exitFullscreen).toHaveBeenCalled();
    });
  });

  describe('Custom Colors', () => {
    it('should allow setting custom background color', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());
      const customColor = '#123456';

      act(() => {
        result.current.setCustomBgColor(customColor);
      });

      expect(result.current.customBgColor).toBe(customColor);
    });

    it('should allow setting custom text color', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());
      const customColor = '#654321';

      act(() => {
        result.current.setCustomTextColor(customColor);
      });

      expect(result.current.customTextColor).toBe(customColor);
    });
  });

  describe('Computed Styles Memoization', () => {
    it('should memoize background color based on filter', () => {
      const { result, rerender } = renderHook(() => useTxtDisplayOptions());

      const initialBgColor = result.current.getBackgroundColor;

      // Rerender without changing filter
      rerender();

      expect(result.current.getBackgroundColor).toBe(initialBgColor);
    });

    it('should update background color when filter changes', () => {
      const { result } = renderHook(() => useTxtDisplayOptions());

      const initialBgColor = result.current.getBackgroundColor;

      act(() => {
        result.current.setColorFilter('sepia');
      });

      expect(result.current.getBackgroundColor).not.toBe(initialBgColor);
      expect(result.current.getBackgroundColor).toBe('#f4ecd8');
    });
  });
});
