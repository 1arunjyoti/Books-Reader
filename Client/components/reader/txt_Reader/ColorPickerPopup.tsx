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
      </div>
    </>
  );
}

