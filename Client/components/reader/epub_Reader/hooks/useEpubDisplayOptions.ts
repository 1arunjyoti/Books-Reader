import { useState, useCallback, useEffect, useRef } from 'react';
import type { Rendition } from 'epubjs';

interface UseEpubDisplayOptionsProps {
  renditionRef: React.MutableRefObject<Rendition | undefined>;
  bookId: string;
  onFontChange?: () => void; // Callback for font changes (to reapply highlights)
}

export function useEpubDisplayOptions({ renditionRef, bookId, onFontChange }: UseEpubDisplayOptionsProps) {
  // Font size - initialize from localStorage
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('epub-fontSize');
      return saved ? parseInt(saved, 10) : 100;
    }
    return 100;
  });

  // Font family - initialize from localStorage
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans-serif'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('epub-fontFamily');
      return (saved === 'serif' || saved === 'sans-serif') ? saved : 'serif';
    }
    return 'serif';
  });

  // Line height - initialize from localStorage
  const [lineHeight, setLineHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('epub-lineHeight');
      return saved ? parseFloat(saved) : 1.5;
    }
    return 1.5;
  });

  // Page layout
  const [pageLayout, setPageLayout] = useState<'single' | 'double'>('single');

  // Page rotation - initialize from localStorage
  const [rotation, setRotation] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`epub-rotation-${bookId}`);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  // Color filter states
  const [colorFilter, setColorFilter] = useState<'none' | 'sepia' | 'dark' | 'custom'>('none');
  const [customBgColor, setCustomBgColor] = useState('#ffffff');

  // UI States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showColorFilter, setShowColorFilter] = useState(false);
  const [showDisplayOptions, setShowDisplayOptions] = useState(false);

  // PERFORMANCE FIX: Debounce font changes to prevent rapid highlight reapplication
  const fontChangeDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const fontChangeRafRef = useRef<number | null>(null);

  // Persist font size to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('epub-fontSize', String(fontSize));
    }
  }, [fontSize]);

  // Persist font family to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('epub-fontFamily', fontFamily);
    }
  }, [fontFamily]);

  // Persist line height to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('epub-lineHeight', String(lineHeight));
    }
  }, [lineHeight]);

  // Persist rotation to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`epub-rotation-${bookId}`, String(rotation));
    }
  }, [rotation, bookId]);

  // Apply rotation to rendition when it changes
  useEffect(() => {
    if (!renditionRef.current) return;

    const applyRotation = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const iframe = (renditionRef.current as any)?.manager?.container?.querySelector('iframe');
      if (iframe?.contentDocument?.body) {
        const body = iframe.contentDocument.body;
        body.style.transform = rotation === 0 ? '' : `rotate(${rotation}deg)`;
        body.style.transformOrigin = 'center center';
        
        if (rotation === 90 || rotation === 270) {
          body.style.width = '100vh';
          body.style.height = '100vw';
        } else {
          body.style.width = '';
          body.style.height = '';
        }
      }
    };

    applyRotation();
    const timer = setTimeout(applyRotation, 100);
    return () => clearTimeout(timer);
  }, [rotation, renditionRef]);

  // PERFORMANCE FIX: Debounced font changes with highlight reapplication
  // Prevents rapid highlight reapplication when user changes multiple font settings
  useEffect(() => {
    if (!renditionRef.current) return;

    // Apply font changes immediately for instant visual feedback
    renditionRef.current.themes.fontSize(`${fontSize}%`);
    renditionRef.current.themes.default({
      '::selection': {
        background: 'rgba(255, 255, 0, 0.3)',
      },
      p: {
        'line-height': `${lineHeight} !important`,
      },
      body: {
        'font-family': fontFamily === 'serif' ? 'Georgia, serif' : 'Arial, sans-serif',
      },
    });

    if (!onFontChange) return;

    // Clear any existing debounce timers and RAF callbacks
    if (fontChangeDebounceRef.current) {
      clearTimeout(fontChangeDebounceRef.current);
    }
    if (fontChangeRafRef.current) {
      cancelAnimationFrame(fontChangeRafRef.current);
    }

    // Debounce highlight reapplication to wait for user to finish adjusting
    fontChangeDebounceRef.current = setTimeout(() => {
      // Use requestAnimationFrame for smooth, non-blocking updates
      fontChangeRafRef.current = requestAnimationFrame(() => {
        // Trigger the callback to reapply highlights
        onFontChange();
      });
    }, 300); // Wait 300ms after last change before reapplying highlights

    // Cleanup function
    return () => {
      if (fontChangeDebounceRef.current) {
        clearTimeout(fontChangeDebounceRef.current);
      }
      if (fontChangeRafRef.current) {
        cancelAnimationFrame(fontChangeRafRef.current);
      }
    };
  }, [fontSize, fontFamily, lineHeight, onFontChange, renditionRef]);

  // Apply color theme to rendition (matching original implementation)
  const applyColorTheme = useCallback((rendition: Rendition) => {
    if (!rendition) return;

    if (colorFilter === 'none') {
      rendition.themes.override('background', '#ffffff');
      rendition.themes.override('color', '#000000');
    } else if (colorFilter === 'sepia') {
      rendition.themes.override('background', '#f4ecd8');
      rendition.themes.override('color', '#5b4636');
    } else if (colorFilter === 'dark') {
      rendition.themes.override('background', '#1a1a1a');
      rendition.themes.override('color', '#e0e0e0');
    } else if (colorFilter === 'custom') {
      rendition.themes.override('background', customBgColor);
    }
  }, [colorFilter, customBgColor]);

  // Apply font settings to rendition (matching original implementation)
  const applyFontSettings = useCallback(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;

    rendition.themes.fontSize(`${fontSize}%`);
    
    rendition.themes.default({
      body: {
        'font-family': fontFamily === 'serif' ? 'Georgia, serif' : 'Arial, sans-serif',
        'line-height': `${lineHeight}`,
      },
    });
  }, [renditionRef, fontSize, fontFamily, lineHeight]);

  // Increase font size
  const increaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.min(200, prev + 10));
  }, []);

  // Decrease font size
  const decreaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.max(50, prev - 10));
  }, []);

  // Increase line height
  const increaseLineHeight = useCallback(() => {
    setLineHeight((prev) => Math.min(2.5, prev + 0.1));
  }, []);

  // Decrease line height
  const decreaseLineHeight = useCallback(() => {
    setLineHeight((prev) => Math.max(1.0, prev - 0.1));
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Toggle font family
  const toggleFontFamily = useCallback(() => {
    setFontFamily((prev) => (prev === 'serif' ? 'sans-serif' : 'serif'));
  }, []);

  // Toggle page layout
  const togglePageLayout = useCallback(() => {
    setPageLayout((prev) => (prev === 'single' ? 'double' : 'single'));
  }, []);

  // Toggle color filter panel
  const toggleColorFilter = useCallback(() => {
    setShowColorFilter((prev) => !prev);
  }, []);

  // Toggle display options panel
  const toggleDisplayOptions = useCallback(() => {
    setShowDisplayOptions((prev) => !prev);
  }, []);

  // Rotate page 90 degrees clockwise
  const rotatePage = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  // Reset rotation to 0 degrees
  const resetRotation = useCallback(() => {
    setRotation(0);
  }, []);

  return {
    // State
    fontSize,
    fontFamily,
    lineHeight,
    pageLayout,
    rotation,
    colorFilter,
    customBgColor,
    isFullscreen,
    showColorFilter,
    showDisplayOptions,
    
    // Setters
    setFontSize,
    setFontFamily,
    setLineHeight,
    setPageLayout,
    setRotation,
    setColorFilter,
    setCustomBgColor,
    setShowColorFilter,
    setShowDisplayOptions,
    
    // Actions
    applyColorTheme,
    applyFontSettings,
    increaseFontSize,
    decreaseFontSize,
    increaseLineHeight,
    decreaseLineHeight,
    toggleFullscreen,
    toggleFontFamily,
    togglePageLayout,
    rotatePage,
    resetRotation,
    toggleColorFilter,
    toggleDisplayOptions,
  };
}
