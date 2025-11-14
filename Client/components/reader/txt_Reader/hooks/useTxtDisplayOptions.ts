import { useState, useMemo } from 'react';
import { useValueAdjuster } from '@/hooks/useValueAdjuster';

type ColorFilter = 'none' | 'sepia' | 'dark' | 'custom';
type TextAlign = 'left' | 'center' | 'right' | 'justify';
type FontFamily = 'serif' | 'sans-serif' | 'monospace';

interface UseTxtDisplayOptionsReturn {
  // Font settings
  fontSize: number;
  setFontSize: (size: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  fontFamily: FontFamily;
  setFontFamily: (family: FontFamily) => void;
  lineHeight: number;
  setLineHeight: (height: number) => void;
  increaseLineHeight: () => void;
  decreaseLineHeight: () => void;
  textAlign: TextAlign;
  setTextAlign: (align: TextAlign) => void;

  // Color settings
  colorFilter: ColorFilter;
  setColorFilter: (filter: ColorFilter) => void;
  customBgColor: string;
  setCustomBgColor: (color: string) => void;
  customTextColor: string;
  setCustomTextColor: (color: string) => void;

  // Fullscreen
  isFullscreen: boolean;
  toggleFullscreen: () => void;

  // Computed styles
  getBackgroundColor: string;
  getTextColor: string;
}

/**
 * Custom hook for TXT reader display options
 * Handles font settings, colors, layout, and fullscreen
 */
export function useTxtDisplayOptions(): UseTxtDisplayOptionsReturn {
  // Font states
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState<FontFamily>('serif');
  const [lineHeight, setLineHeight] = useState(1.6);
  const [textAlign, setTextAlign] = useState<TextAlign>('left');

  // Color states
  const [colorFilter, setColorFilter] = useState<ColorFilter>('none');
  const [customBgColor, setCustomBgColor] = useState('#ffffff');
  const [customTextColor, setCustomTextColor] = useState('#000000');

  // Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Font adjusters
  const { increase: increaseFontSize, decrease: decreaseFontSize } = useValueAdjuster(
    setFontSize,
    2,
    10,
    32
  );

  const { increase: increaseLineHeight, decrease: decreaseLineHeight } = useValueAdjuster(
    setLineHeight,
    0.1,
    1.0,
    2.5
  );

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Get background color based on filter (memoized)
  const getBackgroundColor = useMemo(() => {
    switch (colorFilter) {
      case 'sepia':
        return '#f4ecd8';
      case 'dark':
        return '#1a1a1a';
      case 'custom':
        return customBgColor;
      default:
        return '#ffffff';
    }
  }, [colorFilter, customBgColor]);

  // Get text color based on filter (memoized)
  const getTextColor = useMemo(() => {
    switch (colorFilter) {
      case 'sepia':
        return '#5c4a3a';
      case 'dark':
        return '#e0e0e0';
      case 'custom':
        return customTextColor;
      default:
        return '#000000';
    }
  }, [colorFilter, customTextColor]);

  return {
    fontSize,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    fontFamily,
    setFontFamily,
    lineHeight,
    setLineHeight,
    increaseLineHeight,
    decreaseLineHeight,
    textAlign,
    setTextAlign,
    colorFilter,
    setColorFilter,
    customBgColor,
    setCustomBgColor,
    customTextColor,
    setCustomTextColor,
    isFullscreen,
    toggleFullscreen,
    getBackgroundColor,
    getTextColor,
  };
}
