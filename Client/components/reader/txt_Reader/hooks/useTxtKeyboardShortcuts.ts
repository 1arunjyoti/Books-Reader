import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  color: string;
  hex: string;
}

interface UseTxtKeyboardShortcutsOptions {
  enableTextSelection: boolean;
  onColorSelect: (color: string, hex: string) => void;
}

const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { key: '1', color: 'yellow', hex: '#FFEB3B' },
  { key: '2', color: 'green', hex: '#4CAF50' },
  { key: '3', color: 'pink', hex: '#E91E63' },
  { key: '4', color: 'blue', hex: '#2196F3' },
  { key: '5', color: 'orange', hex: '#FF9800' },
  { key: '6', color: 'purple', hex: '#9C27B0' },
];

/**
 * Custom hook for keyboard shortcuts in TXT reader
 * Handles Ctrl+1-6 quick highlight shortcuts
 */
export function useTxtKeyboardShortcuts({
  enableTextSelection,
  onColorSelect,
}: UseTxtKeyboardShortcutsOptions): void {
  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Check if user has text selected
    const selection = window.getSelection();
    const hasSelection = selection && !selection.isCollapsed && selection.toString().trim().length > 0;

    if (!hasSelection || !e.ctrlKey) return;

    // Find matching shortcut
    const shortcut = KEYBOARD_SHORTCUTS.find(s => s.key === e.key);
    if (shortcut) {
      e.preventDefault();
      onColorSelect(shortcut.color, shortcut.hex);
    }
  }, [onColorSelect]);

  useEffect(() => {
    if (!enableTextSelection) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enableTextSelection, handleKeyDown]);
}
