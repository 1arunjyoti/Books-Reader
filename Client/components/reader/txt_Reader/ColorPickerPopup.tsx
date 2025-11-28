'use client';

import { useState, useEffect, useRef } from 'react';

interface ColorOption {
  name: string;
  color: string;
  hex: string;
}

interface ColorPickerPopupProps {
  x: number;
  y: number;
  selectionHeight?: number;
  onColorSelect: (color: string, hex: string) => void;
  onDismiss: () => void;
}

const HIGHLIGHT_COLORS: ColorOption[] = [
  { name: 'Yellow', color: 'yellow', hex: '#ffff00' },
  { name: 'Green', color: 'green', hex: '#00ff00' },
  { name: 'Pink', color: 'pink', hex: '#ff69b4' },
  { name: 'Blue', color: 'blue', hex: '#87ceeb' },
  { name: 'Orange', color: 'orange', hex: '#ffa500' },
  { name: 'Purple', color: 'purple', hex: '#dda0dd' },
];

const POPUP_OFFSET = 16; // Distance from text
const POPUP_HEIGHT = 48; // Approximate height of popup

export default function ColorPickerPopup({
  x,
  y,
  selectionHeight = 20,
  onColorSelect,
  onDismiss,
}: ColorPickerPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  useEffect(() => {
    // Check if mobile
    const mobileCheck = window.innerWidth < 768;
    setIsMobile(mobileCheck);

    if (mobileCheck) {
      // Mobile: Center the popup horizontally, position below with safe margin
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Center horizontally with padding
      const padding = 16;
      const centerLeft = viewportWidth / 2;
      
      // Position below selection with offset, or above if not enough space
      const spaceBelow = viewportHeight - (y + selectionHeight + POPUP_OFFSET);
      
      setPosition({
        left: centerLeft,
        top: spaceBelow > 120 ? y + selectionHeight + POPUP_OFFSET : Math.max(padding, y - 120 - POPUP_OFFSET),
      });
    } else {
      // Desktop: Original behavior
      const spaceAbove = y - POPUP_OFFSET - POPUP_HEIGHT;
      
      if (spaceAbove < 0) {
        setPosition({
          left: x,
          top: y + selectionHeight + POPUP_OFFSET,
        });
      } else {
        setPosition({
          left: x,
          top: y - POPUP_OFFSET - POPUP_HEIGHT,
        });
      }
    }
  }, [y, selectionHeight, x]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onDismiss}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Popup */}
      <div
        ref={popupRef}
        className={`fixed z-50 rounded-full shadow-lg border ${
          isMobile 
            ? 'bg-white/95 dark:bg-gray-800/95 border-gray-200 dark:border-gray-700 px-3 py-2' 
            : 'bg-white/95 dark:bg-gray-800/95 border-gray-200 dark:border-gray-700 px-3 py-2'
        }`}
        style={{
          left: `${position.left}px`,
          top: `${position.top}px`,
          transform: isMobile ? 'translate(-50%, 0)' : 'translateX(-50%)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          {!isMobile && (
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Highlight</span>
          )}
          {HIGHLIGHT_COLORS.map((colorOption) => (
            <button
              key={colorOption.hex}
              onClick={() => onColorSelect(colorOption.color, colorOption.hex)}
              title={colorOption.name}
              type="button"
              className={`rounded-full border border-white dark:border-gray-600 shadow focus:outline-none focus:ring-2 focus:ring-blue-500 transition-transform ${
                isMobile 
                  ? 'h-8 w-8 active:scale-95 touch-none' 
                  : 'h-6 w-6 hover:scale-110'
              }`}
              style={{
                backgroundColor: colorOption.hex,
                opacity: 0.85,
              }}
              aria-label={`Highlight with ${colorOption.name}`}
            />
          ))}
          <button
            type="button"
            onClick={onDismiss}
            className="ml-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => onColorSelect('translate', 'translate')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-languages"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>
            Translate
          </button>
          <button
            type="button"
            onClick={() => onColorSelect('define', 'define')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            Define
          </button>
        </div>
      </div>
    </>
  );
}

