/**
 * TXT Keyboard Shortcuts Hook Unit Tests
 * Tests the useTxtKeyboardShortcuts custom hook
 */

import { renderHook } from '@testing-library/react';
import { useTxtKeyboardShortcuts } from '@/components/reader/txt_Reader/hooks/useTxtKeyboardShortcuts';
import '@testing-library/jest-dom';

describe('useTxtKeyboardShortcuts', () => {
  const mockOnColorSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.getSelection
    Object.defineProperty(window, 'getSelection', {
      writable: true,
      value: jest.fn(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Shortcut Registration', () => {
    it('should register keyboard event listener when enabled', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      renderHook(() =>
        useTxtKeyboardShortcuts({
          enableTextSelection: true,
          onColorSelect: mockOnColorSelect,
        })
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should not register listener when disabled', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      renderHook(() =>
        useTxtKeyboardShortcuts({
          enableTextSelection: false,
          onColorSelect: mockOnColorSelect,
        })
      );

      // Should not have registered keydown listener
      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    it('should remove listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() =>
        useTxtKeyboardShortcuts({
          enableTextSelection: true,
          onColorSelect: mockOnColorSelect,
        })
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('Color Selection Shortcuts', () => {
    const createKeyboardEvent = (key: string, ctrlKey = true) => {
      return new KeyboardEvent('keydown', {
        key,
        ctrlKey,
        bubbles: true,
      });
    };

    const mockSelection = (hasSelection: boolean, text = 'selected text') => {
      const mockGetSelection = window.getSelection as jest.Mock;
      mockGetSelection.mockReturnValue(
        hasSelection
          ? {
              isCollapsed: false,
              toString: () => text,
            }
          : {
              isCollapsed: true,
              toString: () => '',
            }
      );
    };

    it('should trigger yellow highlight on Ctrl+1', () => {
      renderHook(() =>
        useTxtKeyboardShortcuts({
          enableTextSelection: true,
          onColorSelect: mockOnColorSelect,
        })
      );

      mockSelection(true);
      const event = createKeyboardEvent('1');
      window.dispatchEvent(event);

      expect(mockOnColorSelect).toHaveBeenCalledWith('yellow', '#FFEB3B');
    });

    it('should trigger green highlight on Ctrl+2', () => {
      renderHook(() =>
        useTxtKeyboardShortcuts({
          enableTextSelection: true,
          onColorSelect: mockOnColorSelect,
        })
      );

      mockSelection(true);
      const event = createKeyboardEvent('2');
      window.dispatchEvent(event);

      expect(mockOnColorSelect).toHaveBeenCalledWith('green', '#4CAF50');
    });

    it('should trigger pink highlight on Ctrl+3', () => {
      renderHook(() =>
        useTxtKeyboardShortcuts({
          enableTextSelection: true,
          onColorSelect: mockOnColorSelect,
        })
      );

      mockSelection(true);
      const event = createKeyboardEvent('3');
      window.dispatchEvent(event);

      expect(mockOnColorSelect).toHaveBeenCalledWith('pink', '#E91E63');
    });

    it('should trigger blue highlight on Ctrl+4', () => {
      renderHook(() =>
        useTxtKeyboardShortcuts({
          enableTextSelection: true,
          onColorSelect: mockOnColorSelect,
        })
      );

      mockSelection(true);
      const event = createKeyboardEvent('4');
      window.dispatchEvent(event);

      expect(mockOnColorSelect).toHaveBeenCalledWith('blue', '#2196F3');
    });

    it('should trigger orange highlight on Ctrl+5', () => {
      renderHook(() =>
        useTxtKeyboardShortcuts({
          enableTextSelection: true,
          onColorSelect: mockOnColorSelect,
        })
      );

      mockSelection(true);
      const event = createKeyboardEvent('5');
      window.dispatchEvent(event);

      expect(mockOnColorSelect).toHaveBeenCalledWith('orange', '#FF9800');
    });

    it('should trigger purple highlight on Ctrl+6', () => {
      renderHook(() =>
        useTxtKeyboardShortcuts({
          enableTextSelection: true,
          onColorSelect: mockOnColorSelect,
        })
      );

      mockSelection(true);
      const event = createKeyboardEvent('6');
      window.dispatchEvent(event);

      expect(mockOnColorSelect).toHaveBeenCalledWith('purple', '#9C27B0');
    });
  });

  describe('Selection Validation', () => {
    const createKeyboardEvent = (key: string, ctrlKey = true) => {
      return new KeyboardEvent('keydown', {
        key,
        ctrlKey,
        bubbles: true,
      });
    };

    it('should not trigger without text selection', () => {
      renderHook(() =>
        useTxtKeyboardShortcuts({
          enableTextSelection: true,
          onColorSelect: mockOnColorSelect,
        })
      );

      // Mock no selection
      const mockGetSelection = window.getSelection as jest.Mock;
      mockGetSelection.mockReturnValue({
        isCollapsed: true,
        toString: () => '',
      });

      const event = createKeyboardEvent('1');
      window.dispatchEvent(event);

      expect(mockOnColorSelect).not.toHaveBeenCalled();
    });

    it('should not trigger with empty selection', () => {
      renderHook(() =>
        useTxtKeyboardShortcuts({
          enableTextSelection: true,
          onColorSelect: mockOnColorSelect,
        })
      );

      // Mock empty selection (whitespace only)
      const mockGetSelection = window.getSelection as jest.Mock;
      mockGetSelection.mockReturnValue({
        isCollapsed: false,
        toString: () => '   ',
      });

      const event = createKeyboardEvent('1');
      window.dispatchEvent(event);

      expect(mockOnColorSelect).not.toHaveBeenCalled();
    });

    it('should not trigger without Ctrl key', () => {
      renderHook(() =>
        useTxtKeyboardShortcuts({
          enableTextSelection: true,
          onColorSelect: mockOnColorSelect,
        })
      );

      const mockGetSelection = window.getSelection as jest.Mock;
      mockGetSelection.mockReturnValue({
        isCollapsed: false,
        toString: () => 'selected text',
      });

      const event = createKeyboardEvent('1', false);
      window.dispatchEvent(event);

      expect(mockOnColorSelect).not.toHaveBeenCalled();
    });

    it('should require non-empty trimmed text', () => {
      renderHook(() =>
        useTxtKeyboardShortcuts({
          enableTextSelection: true,
          onColorSelect: mockOnColorSelect,
        })
      );

      const mockGetSelection = window.getSelection as jest.Mock;
      mockGetSelection.mockReturnValue({
        isCollapsed: false,
        toString: () => '  \n\t  ',
      });

      const event = createKeyboardEvent('1');
      window.dispatchEvent(event);

      expect(mockOnColorSelect).not.toHaveBeenCalled();
    });
  });

  describe('Non-shortcut Keys', () => {
    const createKeyboardEvent = (key: string, ctrlKey = true) => {
      return new KeyboardEvent('keydown', {
        key,
        ctrlKey,
        bubbles: true,
      });
    };

    it('should not trigger on Ctrl+7', () => {
      renderHook(() =>
        useTxtKeyboardShortcuts({
          enableTextSelection: true,
          onColorSelect: mockOnColorSelect,
        })
      );

      const mockGetSelection = window.getSelection as jest.Mock;
      mockGetSelection.mockReturnValue({
        isCollapsed: false,
        toString: () => 'selected text',
      });

      const event = createKeyboardEvent('7');
      window.dispatchEvent(event);

      expect(mockOnColorSelect).not.toHaveBeenCalled();
    });

    it('should not trigger on Ctrl+A', () => {
      renderHook(() =>
        useTxtKeyboardShortcuts({
          enableTextSelection: true,
          onColorSelect: mockOnColorSelect,
        })
      );

      const mockGetSelection = window.getSelection as jest.Mock;
      mockGetSelection.mockReturnValue({
        isCollapsed: false,
        toString: () => 'selected text',
      });

      const event = createKeyboardEvent('a');
      window.dispatchEvent(event);

      expect(mockOnColorSelect).not.toHaveBeenCalled();
    });

    it('should not trigger on other number keys', () => {
      renderHook(() =>
        useTxtKeyboardShortcuts({
          enableTextSelection: true,
          onColorSelect: mockOnColorSelect,
        })
      );

      const mockGetSelection = window.getSelection as jest.Mock;
      mockGetSelection.mockReturnValue({
        isCollapsed: false,
        toString: () => 'selected text',
      });

      const event = createKeyboardEvent('0');
      window.dispatchEvent(event);

      expect(mockOnColorSelect).not.toHaveBeenCalled();
    });
  });

  describe('Event Prevention', () => {
    it('should prevent default browser behavior on valid shortcut', () => {
      renderHook(() =>
        useTxtKeyboardShortcuts({
          enableTextSelection: true,
          onColorSelect: mockOnColorSelect,
        })
      );

      const mockGetSelection = window.getSelection as jest.Mock;
      mockGetSelection.mockReturnValue({
        isCollapsed: false,
        toString: () => 'selected text',
      });

      const event = new KeyboardEvent('keydown', {
        key: '1',
        ctrlKey: true,
        bubbles: true,
      });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Re-registration on Enable Toggle', () => {
    it('should re-register listener when enabled changes', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { rerender } = renderHook(
        ({ enableTextSelection }) =>
          useTxtKeyboardShortcuts({
            enableTextSelection,
            onColorSelect: mockOnColorSelect,
          }),
        { initialProps: { enableTextSelection: false } }
      );

      expect(addEventListenerSpy).not.toHaveBeenCalled();

      // Enable
      rerender({ enableTextSelection: true });

      expect(addEventListenerSpy).toHaveBeenCalled();

      // Disable again
      rerender({ enableTextSelection: false });

      expect(removeEventListenerSpy).toHaveBeenCalled();
    });
  });
});
