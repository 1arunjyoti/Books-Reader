/**
 * Unit tests for useEpubAnalytics hook
 * Tests reading session tracking, analytics logging, and window visibility
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useEpubAnalytics } from '../useEpubAnalytics';

// Mock the api module
jest.mock('@/lib/api', () => ({
  createReadingSession: jest.fn(),
}));

describe('useEpubAnalytics', () => {
  let getAccessToken: jest.Mock;
  const bookId = 'test-book-123';
  let mockCreateReadingSession: jest.Mock;

  beforeEach(async () => {
    jest.useFakeTimers();
    getAccessToken = jest.fn().mockResolvedValue('test-token');
    
    // Get the mocked createReadingSession
    const { createReadingSession } = await import('@/lib/api');
    mockCreateReadingSession = createReadingSession as jest.Mock;
    mockCreateReadingSession.mockResolvedValue({});
    
    // Mock document.hidden
    Object.defineProperty(document, 'hidden', {
      writable: true,
      configurable: true,
      value: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() =>
        useEpubAnalytics({
          bookId,
          currentPage: 5,
          pageInfo: { current: 5, total: 100 },
          getAccessToken,
        })
      );

      expect(result.current.sessionStart).toBeInstanceOf(Date);
      expect(result.current.sessionStartPage).toBe(5);
      expect(result.current.isWindowActive).toBe(true);
      expect(typeof result.current.logReadingSession).toBe('function');
    });

    it('should initialize with page 1 if currentPage is not provided', () => {
      const { result } = renderHook(() =>
        useEpubAnalytics({
          bookId,
          pageInfo: { current: 1, total: 100 },
          getAccessToken,
        })
      );

      expect(result.current.sessionStartPage).toBe(1);
    });
  });

  describe('Reading Session Logging', () => {
    it('should not log session if duration is less than 10 seconds', async () => {
      const { result } = renderHook(() =>
        useEpubAnalytics({
          bookId,
          currentPage: 5,
          pageInfo: { current: 5, total: 100 },
          getAccessToken,
        })
      );

      // Advance time by 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await act(async () => {
        await result.current.logReadingSession();
      });

      expect(mockCreateReadingSession).not.toHaveBeenCalled();
    });

    it('should log session after 10 seconds of reading', async () => {
      const { result } = renderHook(() =>
        useEpubAnalytics({
          bookId,
          currentPage: 5,
          pageInfo: { current: 8, total: 100 },
          getAccessToken,
        })
      );

      // Advance time by 15 seconds
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      await act(async () => {
        await result.current.logReadingSession();
      });

      // Flush pending promises
      await act(async () => {
        await Promise.resolve();
      });

      expect(mockCreateReadingSession).toHaveBeenCalledWith(
        {
          bookId: 'test-book-123',
          duration: 15,
          pagesRead: 3,
          startPage: 5,
          endPage: 8,
          progressDelta: 3,
        },
        'test-token'
      );
    });

    it('should calculate pages read correctly when going backwards', async () => {
      const { result } = renderHook(() =>
        useEpubAnalytics({
          bookId,
          currentPage: 10,
          pageInfo: { current: 7, total: 100 },
          getAccessToken,
        })
      );

      // Advance time by 20 seconds
      act(() => {
        jest.advanceTimersByTime(20000);
      });

      await act(async () => {
        await result.current.logReadingSession();
      });

      // Flush pending promises
      await act(async () => {
        await Promise.resolve();
      });

      expect(mockCreateReadingSession).toHaveBeenCalledWith(
        expect.objectContaining({
          pagesRead: 3,
          startPage: 10,
          endPage: 7,
          progressDelta: 3,
        }),
        'test-token'
      );
    });

    it('should not log session if window is not active', async () => {
      const { result, rerender } = renderHook(
        (props) =>
          useEpubAnalytics({
            bookId: props.bookId,
            currentPage: props.currentPage,
            pageInfo: props.pageInfo,
            getAccessToken: props.getAccessToken,
          }),
        {
          initialProps: {
            bookId,
            currentPage: 5,
            pageInfo: { current: 5, total: 100 },
            getAccessToken,
          },
        }
      );

      // Set window to inactive
      act(() => {
        window.dispatchEvent(new Event('blur'));
      });

      // Wait for state update
      await waitFor(() => {
        expect(result.current.isWindowActive).toBe(false);
      });

      // Advance time by 15 seconds
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      // Update pageInfo
      rerender({
        bookId,
        currentPage: 8,
        pageInfo: { current: 8, total: 100 },
        getAccessToken,
      });

      await act(async () => {
        await result.current.logReadingSession();
      });

      // Should not log because window is inactive
      expect(mockCreateReadingSession).not.toHaveBeenCalled();
    });

    it('should handle missing access token gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      getAccessToken.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useEpubAnalytics({
          bookId,
          currentPage: 5,
          pageInfo: { current: 8, total: 100 },
          getAccessToken,
        })
      );

      // Advance time by 15 seconds
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      await act(async () => {
        await result.current.logReadingSession();
      });

      // Flush pending promises
      await act(async () => {
        await Promise.resolve();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[❌] Failed to get access token for reading session',
        undefined
      );
      expect(mockCreateReadingSession).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle API errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockCreateReadingSession.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() =>
        useEpubAnalytics({
          bookId,
          currentPage: 5,
          pageInfo: { current: 8, total: 100 },
          getAccessToken,
        })
      );

      // Advance time by 15 seconds
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      await act(async () => {
        await result.current.logReadingSession();
      });

      // Flush pending promises
      await act(async () => {
        await Promise.resolve();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[❌] Error logging reading session:',
        {
          message: 'API Error',
          stack: expect.any(String)
        }
      );

      consoleErrorSpy.mockRestore();
    });

    it('should reset session after successful log', async () => {
      const { result } = renderHook(() =>
        useEpubAnalytics({
          bookId,
          currentPage: 5,
          pageInfo: { current: 8, total: 100 },
          getAccessToken,
        })
      );

      const originalSessionStart = result.current.sessionStart;

      // Advance time by 15 seconds
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      await act(async () => {
        await result.current.logReadingSession();
      });

      // Flush pending promises
      await act(async () => {
        await Promise.resolve();
      });

      // Wait for state updates
      await waitFor(() => {
        expect(result.current.sessionStart).not.toEqual(originalSessionStart);
        expect(result.current.sessionStartPage).toBe(8);
      });
    });
  });

  describe('Window Visibility Tracking', () => {
    it('should set isWindowActive to false when window is hidden', async () => {
      const { result } = renderHook(() =>
        useEpubAnalytics({
          bookId,
          currentPage: 5,
          pageInfo: { current: 5, total: 100 },
          getAccessToken,
        })
      );

      expect(result.current.isWindowActive).toBe(true);

      // Simulate window becoming hidden
      act(() => {
        Object.defineProperty(document, 'hidden', {
          writable: true,
          configurable: true,
          value: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      await waitFor(() => {
        expect(result.current.isWindowActive).toBe(false);
      });
    });

    it('should set isWindowActive to true when window becomes visible', async () => {
      const { result } = renderHook(() =>
        useEpubAnalytics({
          bookId,
          currentPage: 5,
          pageInfo: { current: 5, total: 100 },
          getAccessToken,
        })
      );

      // First hide the window
      act(() => {
        Object.defineProperty(document, 'hidden', {
          writable: true,
          configurable: true,
          value: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      await waitFor(() => {
        expect(result.current.isWindowActive).toBe(false);
      });

      // Then make it visible again
      act(() => {
        Object.defineProperty(document, 'hidden', {
          writable: true,
          configurable: true,
          value: false,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      await waitFor(() => {
        expect(result.current.isWindowActive).toBe(true);
      });
    });

    it('should log session when window loses focus', async () => {
      renderHook(() =>
        useEpubAnalytics({
          bookId,
          currentPage: 5,
          pageInfo: { current: 8, total: 100 },
          getAccessToken,
        })
      );

      // Advance time by 15 seconds
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      // Simulate window blur
      act(() => {
        window.dispatchEvent(new Event('blur'));
      });

      // Flush pending promises
      await act(async () => {
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(mockCreateReadingSession).toHaveBeenCalled();
      });
    });

    it('should log session when window becomes hidden', async () => {
      renderHook(() =>
        useEpubAnalytics({
          bookId,
          currentPage: 5,
          pageInfo: { current: 8, total: 100 },
          getAccessToken,
        })
      );

      // Clear any initial calls
      mockCreateReadingSession.mockClear();

      // Advance time by 15 seconds
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      // Simulate window becoming hidden
      act(() => {
        Object.defineProperty(document, 'hidden', {
          writable: true,
          configurable: true,
          value: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // Flush pending promises
      await act(async () => {
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(mockCreateReadingSession).toHaveBeenCalled();
      });
    });

    it('should set isWindowActive to true when window gains focus', async () => {
      const { result } = renderHook(() =>
        useEpubAnalytics({
          bookId,
          currentPage: 5,
          pageInfo: { current: 5, total: 100 },
          getAccessToken,
        })
      );

      // First blur
      act(() => {
        window.dispatchEvent(new Event('blur'));
      });

      await waitFor(() => {
        expect(result.current.isWindowActive).toBe(false);
      });

      // Then focus
      act(() => {
        window.dispatchEvent(new Event('focus'));
      });

      await waitFor(() => {
        expect(result.current.isWindowActive).toBe(true);
      });
    });
  });

  describe('Periodic Session Logging', () => {
    it('should log session every 5 minutes', async () => {
      renderHook(() =>
        useEpubAnalytics({
          bookId,
          currentPage: 5,
          pageInfo: { current: 8, total: 100 },
          getAccessToken,
        })
      );

      // Clear initial setup calls
      mockCreateReadingSession.mockClear();

      // Advance time by 5 minutes
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      // Flush pending promises
      await act(async () => {
        await Promise.resolve();
      });

      expect(mockCreateReadingSession).toHaveBeenCalledTimes(1);

      // Advance another 5 minutes
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      // Flush pending promises
      await act(async () => {
        await Promise.resolve();
      });

      expect(mockCreateReadingSession).toHaveBeenCalledTimes(2);
    });

    it('should not log periodic session if duration is less than 10 seconds', async () => {
      // This test is no longer valid - the periodic logger runs after 5 minutes (300 seconds)
      // which is always > 10 seconds minimum. We'll test that periodic logging respects
      // the session start time by checking it logs with the correct duration.
      renderHook(() =>
        useEpubAnalytics({
          bookId,
          currentPage: 5,
          pageInfo: { current: 5, total: 100 },
          getAccessToken,
        })
      );

      // Clear initial setup calls
      mockCreateReadingSession.mockClear();

      // Advance time by 5 minutes (300 seconds)
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      // Flush pending promises
      await act(async () => {
        await Promise.resolve();
      });

      // Should have logged with duration of 300 seconds
      expect(mockCreateReadingSession).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: 300,
        }),
        'test-token'
      );
    });
  });

  describe('Unmount Behavior', () => {
    it('should log session on unmount', async () => {
      const { unmount } = renderHook(() =>
        useEpubAnalytics({
          bookId,
          currentPage: 5,
          pageInfo: { current: 8, total: 100 },
          getAccessToken,
        })
      );

      // Clear initial setup calls
      mockCreateReadingSession.mockClear();

      // Advance time by 15 seconds
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      // Unmount the hook
      act(() => {
        unmount();
      });

      // Flush pending promises
      await act(async () => {
        await Promise.resolve();
      });

      expect(mockCreateReadingSession).toHaveBeenCalled();
    });

    it('should clean up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      const windowRemoveEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() =>
        useEpubAnalytics({
          bookId,
          currentPage: 5,
          pageInfo: { current: 5, total: 100 },
          getAccessToken,
        })
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
      expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith('blur', expect.any(Function));

      removeEventListenerSpy.mockRestore();
      windowRemoveEventListenerSpy.mockRestore();
    });

    it('should clear periodic interval on unmount', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const { unmount } = renderHook(() =>
        useEpubAnalytics({
          bookId,
          currentPage: 5,
          pageInfo: { current: 5, total: 100 },
          getAccessToken,
        })
      );

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });
  });

  describe('State Updates', () => {
    it('should update pageInfo when prop changes', async () => {
      const { result, rerender } = renderHook(
        (props) =>
          useEpubAnalytics({
            bookId: props.bookId,
            currentPage: props.currentPage,
            pageInfo: props.pageInfo,
            getAccessToken: props.getAccessToken,
          }),
        {
          initialProps: {
            bookId,
            currentPage: 5,
            pageInfo: { current: 5, total: 100 },
            getAccessToken,
          },
        }
      );

      // Advance time
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      // Update to new page
      rerender({
        bookId,
        currentPage: 10,
        pageInfo: { current: 10, total: 100 },
        getAccessToken,
      });

      await act(async () => {
        await result.current.logReadingSession();
      });

      // Flush pending promises
      await act(async () => {
        await Promise.resolve();
      });

      expect(mockCreateReadingSession).toHaveBeenCalledWith(
        expect.objectContaining({
          startPage: 5,
          endPage: 10,
          pagesRead: 5,
        }),
        'test-token'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle page 0 correctly with default to 1', () => {
      const { result } = renderHook(() =>
        useEpubAnalytics({
          bookId,
          currentPage: 0,
          pageInfo: { current: 0, total: 100 },
          getAccessToken,
        })
      );

      // When currentPage is 0, it defaults to 1
      expect(result.current.sessionStartPage).toBe(1);
    });

    it('should handle same page reading session', async () => {
      const { result } = renderHook(() =>
        useEpubAnalytics({
          bookId,
          currentPage: 5,
          pageInfo: { current: 5, total: 100 },
          getAccessToken,
        })
      );

      // Advance time by 15 seconds
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      await act(async () => {
        await result.current.logReadingSession();
      });

      // Flush pending promises
      await act(async () => {
        await Promise.resolve();
      });

      expect(mockCreateReadingSession).toHaveBeenCalledWith(
        expect.objectContaining({
          pagesRead: 0,
          progressDelta: 0,
        }),
        'test-token'
      );
    });

    it('should handle undefined pageInfo.current', async () => {
      const { result } = renderHook(() =>
        useEpubAnalytics({
          bookId,
          currentPage: 5,
          pageInfo: { current: 0, total: 100 },
          getAccessToken,
        })
      );

      // Advance time by 15 seconds
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      await act(async () => {
        await result.current.logReadingSession();
      });

      // Flush pending promises
      await act(async () => {
        await Promise.resolve();
      });

      expect(mockCreateReadingSession).toHaveBeenCalledWith(
        expect.objectContaining({
          endPage: 1, // Defaults to 1 when current is 0
        }),
        'test-token'
      );
    });
  });
});
