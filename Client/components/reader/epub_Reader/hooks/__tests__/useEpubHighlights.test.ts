/**
 * Unit tests for useEpubHighlights hook
 * Tests highlight CRUD operations, text selection, and annotation rendering
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useEpubHighlights } from '../useEpubHighlights';
import * as highlightsApi from '@/lib/highlights-api';
import type { Rendition } from 'epubjs';
import type { EpubHighlight } from '@/types/highlights';

// Mock the highlights API
jest.mock('@/lib/highlights-api');

// Mock the AuthToken context
const mockGetAccessToken = jest.fn();
jest.mock('@/contexts/AuthTokenContext', () => ({
  useAuthToken: () => ({
    getAccessToken: mockGetAccessToken,
  }),
}));

// Mock sanitize-text
jest.mock('@/lib/sanitize-text', () => ({
  sanitizeText: (text: string) => text.trim(),
}));

interface MockRendition {
  annotations: {
    add: jest.Mock;
    remove: jest.Mock;
    highlight: jest.Mock;
  };
  on: jest.Mock;
  off: jest.Mock;
  getRange: jest.Mock;
}

describe('useEpubHighlights', () => {
  const mockBookId = 'book-123';
  const mockAccessToken = 'test-access-token';

  const mockHighlights: EpubHighlight[] = [
    {
      id: 'highlight-1',
      cfiRange: 'epubcfi(/6/4[chap01ref]!/4/2/1:0,/4/2/1:100)',
      text: 'This is a highlighted text',
      color: 'yellow',
      hex: '#FFFF00',
      note: 'Test note',
      pageNumber: 10,
      source: 'EPUB',
      createdAt: new Date('2024-01-01').toISOString(),
      updatedAt: new Date('2024-01-01').toISOString(),
    },
    {
      id: 'highlight-2',
      cfiRange: 'epubcfi(/6/6[chap02ref]!/4/2/1:0,/4/2/1:50)',
      text: 'Another highlighted section',
      color: 'blue',
      hex: '#0000FF',
      note: undefined,
      pageNumber: 20,
      source: 'EPUB',
      createdAt: new Date('2024-01-02').toISOString(),
      updatedAt: new Date('2024-01-02').toISOString(),
    },
  ];

  let mockRendition: MockRendition;
  let renditionRef: React.MutableRefObject<Rendition | undefined>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccessToken.mockResolvedValue(mockAccessToken);

    // Create mock rendition with annotations API
    mockRendition = {
      annotations: {
        add: jest.fn(),
        remove: jest.fn(),
        highlight: jest.fn(),
      },
      on: jest.fn(),
      off: jest.fn(),
      getRange: jest.fn(() => ({
        getBoundingClientRect: () => ({
          left: 100,
          top: 200,
          right: 300,
          bottom: 250,
          width: 200,
          height: 50,
        }),
      })),
    };

    renditionRef = {
      current: mockRendition as unknown as Rendition,
    } as React.MutableRefObject<Rendition | undefined>;

    // Mock API responses
    (highlightsApi.fetchHighlights as jest.Mock).mockResolvedValue(mockHighlights);
    (highlightsApi.createHighlight as jest.Mock).mockResolvedValue(mockHighlights[0]);
    (highlightsApi.updateHighlight as jest.Mock).mockResolvedValue(mockHighlights[0]);
    (highlightsApi.deleteHighlight as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Initialization and Loading', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() =>
        useEpubHighlights({
          bookId: mockBookId,
          renditionRef,
        })
      );

      expect(result.current.highlights).toEqual([]);
      expect(result.current.isLoadingHighlights).toBe(true);
      expect(result.current.pendingSelection).toBeNull();
      expect(result.current.editingHighlight).toBeNull();
    });

    it('should load highlights on mount', async () => {
      const { result } = renderHook(() =>
        useEpubHighlights({
          bookId: mockBookId,
          renditionRef,
        })
      );

      // Call loadHighlights explicitly
      await act(async () => {
        await result.current.loadHighlights();
      });

      await waitFor(() => {
        expect(result.current.isLoadingHighlights).toBe(false);
      });

      expect(highlightsApi.fetchHighlights).toHaveBeenCalledWith(mockBookId, mockAccessToken);
      expect(result.current.highlights).toEqual(mockHighlights);
    });

    it('should handle loading error gracefully', async () => {
      const onError = jest.fn();
      const error = new Error('Failed to load highlights');
      (highlightsApi.fetchHighlights as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() =>
        useEpubHighlights({
          bookId: mockBookId,
          renditionRef,
          onError,
        })
      );

      // Call loadHighlights explicitly
      await act(async () => {
        await result.current.loadHighlights();
      });

      await waitFor(() => {
        expect(result.current.isLoadingHighlights).toBe(false);
      });

      expect(onError).toHaveBeenCalledWith('Failed to load highlights. Some highlights may not be visible.');
    });
  });

  describe('Text Selection', () => {
    it('should handle text selection', async () => {
      const { result } = renderHook(() =>
        useEpubHighlights({
          bookId: mockBookId,
          renditionRef,
        })
      );

      const mockSelection = {
        text: 'Selected text',
        cfiRange: 'epubcfi(/6/8!/4/2/1:0,/4/2/1:13)',
        x: 150,
        y: 250,
        height: 40,
      };

      act(() => {
        result.current.setPendingSelection(mockSelection);
      });

      expect(result.current.pendingSelection).toEqual(mockSelection);
    });

    it('should clear pending selection', async () => {
      const { result } = renderHook(() =>
        useEpubHighlights({
          bookId: mockBookId,
          renditionRef,
        })
      );

      const mockSelection = {
        text: 'Selected text',
        cfiRange: 'epubcfi(/6/8!/4/2/1:0,/4/2/1:13)',
        x: 150,
        y: 250,
        height: 40,
      };

      act(() => {
        result.current.setPendingSelection(mockSelection);
      });

      expect(result.current.pendingSelection).toEqual(mockSelection);

      act(() => {
        result.current.setPendingSelection(null);
      });

      expect(result.current.pendingSelection).toBeNull();
    });
  });

  describe('Creating Highlights', () => {
    it('should create a highlight successfully', async () => {
      const onSuccess = jest.fn();
      const { result } = renderHook(() =>
        useEpubHighlights({
          bookId: mockBookId,
          renditionRef,
          onSuccess,
        })
      );

      const mockSelection = {
        text: 'New highlight text',
        cfiRange: 'epubcfi(/6/8!/4/2/1:0,/4/2/1:13)',
        x: 150,
        y: 250,
        height: 40,
      };

      act(() => {
        result.current.setPendingSelection(mockSelection);
      });

      const colorInfo = {
        name: 'green',
        color: 'Green',
        hex: '#00FF00',
      };

      await act(async () => {
        await result.current.createHighlight(colorInfo, 15);
      });

      expect(highlightsApi.createHighlight).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledWith('Highlight created');
    });

    it('should handle create highlight error', async () => {
      const onError = jest.fn();
      const error = new Error('Failed to create highlight');
      (highlightsApi.createHighlight as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() =>
        useEpubHighlights({
          bookId: mockBookId,
          renditionRef,
          onError,
        })
      );

      const mockSelection = {
        text: 'New highlight text',
        cfiRange: 'epubcfi(/6/8!/4/2/1:0,/4/2/1:13)',
        x: 150,
        y: 250,
        height: 40,
      };

      act(() => {
        result.current.setPendingSelection(mockSelection);
      });

      const colorInfo = {
        name: 'green',
        color: 'Green',
        hex: '#00FF00',
      };

      await act(async () => {
        await result.current.createHighlight(colorInfo, 15);
      });

      expect(onError).toHaveBeenCalledWith('Failed to create highlight');
    });
  });

  describe('Updating Highlights', () => {
    it('should update highlight color successfully', async () => {
      const onSuccess = jest.fn();
      const { result } = renderHook(() =>
        useEpubHighlights({
          bookId: mockBookId,
          renditionRef,
          onSuccess,
        })
      );

      // Load highlights first
      await act(async () => {
        await result.current.loadHighlights();
      });

      const colorInfo = {
        name: 'red',
        color: 'red',
        hex: '#FF0000',
      };

      await act(async () => {
        await result.current.updateHighlightColor('highlight-1', colorInfo);
      });

      expect(highlightsApi.updateHighlight).toHaveBeenCalledWith(
        'highlight-1',
        { color: 'red', hex: '#FF0000' },
        mockAccessToken
      );
      expect(onSuccess).toHaveBeenCalledWith('Highlight color updated');
    });

    it('should handle update highlight error', async () => {
      const onError = jest.fn();
      const error = new Error('Failed to update highlight');
      (highlightsApi.updateHighlight as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() =>
        useEpubHighlights({
          bookId: mockBookId,
          renditionRef,
          onError,
        })
      );

      // Load highlights first
      await act(async () => {
        await result.current.loadHighlights();
      });

      const colorInfo = {
        name: 'red',
        color: 'Red',
        hex: '#FF0000',
      };

      await act(async () => {
        await result.current.updateHighlightColor('highlight-1', colorInfo);
      });

      expect(onError).toHaveBeenCalledWith('Failed to update highlight color');
    });

    it('should save highlight note successfully', async () => {
      const onSuccess = jest.fn();
      const { result } = renderHook(() =>
        useEpubHighlights({
          bookId: mockBookId,
          renditionRef,
          onSuccess,
        })
      );

      await act(async () => {
        await result.current.saveHighlightNote('highlight-1', 'Updated note');
      });

      expect(highlightsApi.updateHighlight).toHaveBeenCalledWith(
        'highlight-1',
        { note: 'Updated note' },
        mockAccessToken
      );
      expect(onSuccess).toHaveBeenCalledWith('Note saved');
    });
  });

  describe('Deleting Highlights', () => {
    it('should delete a highlight successfully', async () => {
      const onSuccess = jest.fn();
      const { result } = renderHook(() =>
        useEpubHighlights({
          bookId: mockBookId,
          renditionRef,
          onSuccess,
        })
      );

      // Load highlights first
      await act(async () => {
        await result.current.loadHighlights();
      });

      await act(async () => {
        await result.current.removeHighlight('highlight-1', mockHighlights[0].cfiRange);
      });

      expect(highlightsApi.deleteHighlight).toHaveBeenCalledWith('highlight-1', mockAccessToken);
      expect(mockRendition.annotations.remove).toHaveBeenCalledWith(
        mockHighlights[0].cfiRange,
        'highlight'
      );
      expect(onSuccess).toHaveBeenCalledWith('Highlight removed');
    });

    it('should handle delete highlight error', async () => {
      const onError = jest.fn();
      const error = new Error('Failed to delete highlight');
      (highlightsApi.deleteHighlight as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() =>
        useEpubHighlights({
          bookId: mockBookId,
          renditionRef,
          onError,
        })
      );

      // Load highlights first
      await act(async () => {
        await result.current.loadHighlights();
      });

      await act(async () => {
        await result.current.removeHighlight('highlight-1', mockHighlights[0].cfiRange);
      });

      expect(onError).toHaveBeenCalledWith('Failed to remove highlight. Please try again.');
    });
  });

  describe('Highlight Navigation', () => {
    it('should navigate to a highlight', async () => {
      const { result } = renderHook(() =>
        useEpubHighlights({
          bookId: mockBookId,
          renditionRef,
        })
      );

      // Load highlights first
      await act(async () => {
        await result.current.loadHighlights();
      });

      const displayMock = jest.fn().mockResolvedValue(undefined);
      (mockRendition as unknown as { display: jest.Mock }).display = displayMock;

      await act(async () => {
        result.current.jumpToHighlight(mockHighlights[0].cfiRange);
      });

      expect(displayMock).toHaveBeenCalledWith(mockHighlights[0].cfiRange);
    });
  });

  describe('Editing State Management', () => {
    it('should set editing highlight', async () => {
      const { result } = renderHook(() =>
        useEpubHighlights({
          bookId: mockBookId,
          renditionRef,
        })
      );

      const editingInfo = {
        id: 'highlight-1',
        cfiRange: mockHighlights[0].cfiRange,
        x: 150,
        y: 250,
        height: 40,
      };

      act(() => {
        result.current.setEditingHighlight(editingInfo);
      });

      expect(result.current.editingHighlight).toEqual(editingInfo);
    });

    it('should initiate color change for highlight', async () => {
      const { result } = renderHook(() =>
        useEpubHighlights({
          bookId: mockBookId,
          renditionRef,
        })
      );

      act(() => {
        result.current.initiateColorChange('highlight-1', mockHighlights[0].cfiRange);
      });

      expect(result.current.editingHighlight).not.toBeNull();
      expect(result.current.editingHighlight?.id).toBe('highlight-1');
    });
  });

  describe('Color Filtering', () => {
    it('should filter highlights by color', async () => {
      const { result } = renderHook(() =>
        useEpubHighlights({
          bookId: mockBookId,
          renditionRef,
        })
      );

      // Load highlights first
      await act(async () => {
        await result.current.loadHighlights();
      });

      const yellowHighlights = result.current.highlights.filter((h) => h.color === 'yellow');
      expect(yellowHighlights).toHaveLength(1);
      expect(yellowHighlights[0].id).toBe('highlight-1');
    });
  });

  describe('Annotation Rendering', () => {
    it('should apply highlights to rendition', async () => {
      const { result } = renderHook(() =>
        useEpubHighlights({
          bookId: mockBookId,
          renditionRef,
        })
      );

      // Load highlights first
      await act(async () => {
        await result.current.loadHighlights();
      });

      // Call applyHighlights
      act(() => {
        result.current.applyHighlights();
      });

      await waitFor(() => {
        expect(mockRendition.annotations.add).toHaveBeenCalled();
      });
    });

    it('should reapply highlights after font changes', async () => {
      const { result } = renderHook(() =>
        useEpubHighlights({
          bookId: mockBookId,
          renditionRef,
        })
      );

      // Load highlights first
      await act(async () => {
        await result.current.loadHighlights();
      });

      // Apply highlights first
      act(() => {
        result.current.applyHighlights();
      });

      const initialCallCount = mockRendition.annotations.add.mock.calls.length;

      act(() => {
        result.current.reapplyHighlights();
      });

      await waitFor(() => {
        expect(mockRendition.annotations.add.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });
  });
});

