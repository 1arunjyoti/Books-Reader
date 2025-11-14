/**
 * Integration tests for EPUB Reader Highlights
 * Tests the integration of highlights functionality with text selection, color management, and notes
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import '@testing-library/jest-dom';
import * as highlightsApi from '@/lib/highlights-api';
import { useEpubHighlights } from '@/components/reader/epub_Reader/hooks/useEpubHighlights';
import type { Rendition } from 'epubjs';

// Mock dependencies
jest.mock('@/lib/highlights-api');
jest.mock('@/contexts/AuthTokenContext', () => ({
  useAuthToken: () => ({
    getAccessToken: jest.fn().mockResolvedValue('mock-token'),
  }),
}));

// Mock Rendition
const createMockRendition = () => {
  const annotations = {
    add: jest.fn(),
    remove: jest.fn(),
    highlight: jest.fn(),
  };

  const on = jest.fn();
  const off = jest.fn();

  return {
    annotations,
    on,
    off,
    themes: {
      default: jest.fn(),
    },
  } as unknown as Rendition;
};

// Test wrapper with providers
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

interface WrapperProps {
  children: React.ReactNode;
}

const createWrapper = () => {
  const queryClient = createTestQueryClient();
  const Wrapper: React.FC<WrapperProps> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  return Wrapper;
};

describe('EPUB Reader Highlights Integration Tests', () => {
  const mockBookId = 'test-book-123';
  const mockAccessToken = 'mock-token';

  const mockHighlights = [
    {
      id: 'highlight-1',
      bookId: mockBookId,
      userId: 'user-123',
      text: 'This is a highlighted text sample',
      cfiRange: 'epubcfi(/6/4[chap01ref]!/4/2,/1:0,/1:33)',
      color: 'yellow',
      hex: '#ffff00',
      note: 'Important passage',
      source: 'EPUB' as const,
      createdAt: new Date('2024-01-01').toISOString(),
      updatedAt: new Date('2024-01-01').toISOString(),
    },
    {
      id: 'highlight-2',
      bookId: mockBookId,
      userId: 'user-123',
      text: 'Another highlighted section',
      cfiRange: 'epubcfi(/6/4[chap01ref]!/4/4,/1:0,/1:27)',
      color: 'green',
      hex: '#00ff00',
      note: null,
      source: 'EPUB' as const,
      createdAt: new Date('2024-01-02').toISOString(),
      updatedAt: new Date('2024-01-02').toISOString(),
    },
    {
      id: 'highlight-3',
      bookId: mockBookId,
      userId: 'user-123',
      text: 'Third highlight with pink color',
      cfiRange: 'epubcfi(/6/6[chap02ref]!/4/2,/1:0,/1:31)',
      color: 'pink',
      hex: '#ff69b4',
      note: 'Chapter 2 key point',
      source: 'EPUB' as const,
      createdAt: new Date('2024-01-03').toISOString(),
      updatedAt: new Date('2024-01-03').toISOString(),
    },
  ];

  let mockRendition: Rendition;
  let renditionRef: React.MutableRefObject<Rendition | undefined>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRendition = createMockRendition();
    renditionRef = { current: mockRendition };
    (highlightsApi.fetchHighlights as jest.Mock).mockResolvedValue(mockHighlights);
  });

  describe('Highlights Loading', () => {
    it('should load highlights successfully', async () => {
      const { result } = renderHook(
        () => useEpubHighlights({ 
          bookId: mockBookId, 
          renditionRef,
        }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoadingHighlights).toBe(true);

      await act(async () => {
        await result.current.loadHighlights();
      });

      await waitFor(() => {
        expect(result.current.highlights).toHaveLength(3);
        expect(result.current.isLoadingHighlights).toBe(false);
      });

      expect(highlightsApi.fetchHighlights).toHaveBeenCalledWith(mockBookId, mockAccessToken);
      
      // Verify highlights are in state
      expect(result.current.highlights[0].text).toBe('This is a highlighted text sample');
      expect(result.current.highlights[1].color).toBe('green');
      expect(result.current.highlights[2].hex).toBe('#ff69b4');
    });

    it('should handle loading errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const onError = jest.fn();
      
      (highlightsApi.fetchHighlights as jest.Mock).mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(
        () => useEpubHighlights({ 
          bookId: mockBookId, 
          renditionRef,
          onError,
        }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadHighlights();
      });

      await waitFor(() => {
        expect(result.current.isLoadingHighlights).toBe(false);
      });

      expect(result.current.highlights).toHaveLength(0);
      expect(consoleError).toHaveBeenCalled();
      
      consoleError.mockRestore();
    });

    it('should apply highlights to rendition after loading', async () => {
      const { result } = renderHook(
        () => useEpubHighlights({ 
          bookId: mockBookId, 
          renditionRef,
        }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadHighlights();
      });

      await waitFor(() => {
        expect(result.current.isLoadingHighlights).toBe(false);
      });

      // Wait for highlights to be applied
      await waitFor(() => {
        expect(mockRendition.annotations.add).toHaveBeenCalled();
      }, { timeout: 2000 });

      // Verify each highlight was added to rendition
      mockHighlights.forEach((highlight) => {
        expect(mockRendition.annotations.add).toHaveBeenCalledWith(
          'highlight',
          highlight.cfiRange,
          {},
          undefined,
          'hl',
          expect.objectContaining({
            fill: highlight.hex,
            'fill-opacity': '1',
          })
        );
      });
    });
  });

  describe('Highlight Creation', () => {
    it('should create a new highlight from text selection', async () => {
      const newHighlight = {
        id: 'highlight-4',
        bookId: mockBookId,
        userId: 'user-123',
        text: 'Newly selected text',
        cfiRange: 'epubcfi(/6/8[chap03ref]!/4/2,/1:0,/1:19)',
        color: 'blue',
        hex: '#87ceeb',
        note: null,
        source: 'EPUB' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (highlightsApi.createHighlight as jest.Mock).mockResolvedValue(newHighlight);

      const { result } = renderHook(
        () => useEpubHighlights({ 
          bookId: mockBookId, 
          renditionRef,
        }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadHighlights();
      });

      await waitFor(() => {
        expect(result.current.isLoadingHighlights).toBe(false);
      });

      // Set pending selection first
      act(() => {
        result.current.setPendingSelection({
          text: 'Newly selected text',
          cfiRange: 'epubcfi(/6/8[chap03ref]!/4/2,/1:0,/1:19)',
          x: 100,
          y: 200,
          height: 20,
        });
      });

      // Create highlight
      await act(async () => {
        await result.current.createHighlight(
          { name: 'Blue', color: 'blue', hex: '#87ceeb' },
          1
        );
      });

      await waitFor(() => {
        expect(result.current.highlights).toHaveLength(4);
      });

      expect(highlightsApi.createHighlight).toHaveBeenCalledWith(
        mockBookId,
        {
          text: 'Newly selected text',
          cfiRange: 'epubcfi(/6/8[chap03ref]!/4/2,/1:0,/1:19)',
          color: 'blue',
          hex: '#87ceeb',
          pageNumber: 1,
          source: 'EPUB',
        },
        mockAccessToken
      );

      // Verify the new highlight was added to rendition
      expect(mockRendition.annotations.add).toHaveBeenCalledWith(
        'highlight',
        newHighlight.cfiRange,
        {},
        undefined,
        'hl',
        expect.objectContaining({
          fill: newHighlight.hex,
          'fill-opacity': '1',
        })
      );
    });

    it('should create highlight with note', async () => {
      const newHighlight = {
        id: 'highlight-5',
        bookId: mockBookId,
        userId: 'user-123',
        text: 'Text with note',
        cfiRange: 'epubcfi(/6/10[chap04ref]!/4/2,/1:0,/1:14)',
        color: 'orange',
        hex: '#ffa500',
        note: 'This is my note',
        source: 'EPUB' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (highlightsApi.createHighlight as jest.Mock).mockResolvedValue(newHighlight);

      const { result } = renderHook(
        () => useEpubHighlights({ 
          bookId: mockBookId, 
          renditionRef,
        }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadHighlights();
      });

      await waitFor(() => {
        expect(result.current.isLoadingHighlights).toBe(false);
      });

      // Set pending selection first
      act(() => {
        result.current.setPendingSelection({
          text: 'Text with note',
          cfiRange: 'epubcfi(/6/10[chap04ref]!/4/2,/1:0,/1:14)',
          x: 100,
          y: 200,
          height: 20,
        });
      });

      // Create highlight
      await act(async () => {
        await result.current.createHighlight(
          { name: 'Orange', color: 'orange', hex: '#ffa500' },
          1
        );
      });

      await waitFor(() => {
        expect(result.current.highlights).toHaveLength(4);
      });

      // Now add note to the highlight
      const createdHighlight = result.current.highlights.find(h => h.id === 'highlight-5');
      if (createdHighlight) {
        await act(async () => {
          await result.current.saveHighlightNote(createdHighlight.id, 'This is my note');
        });
      }

      await waitFor(() => {
        const highlight = result.current.highlights.find(h => h.id === 'highlight-5');
        expect(highlight?.note).toBe('This is my note');
      });
    });

    it('should handle creation errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const onError = jest.fn();
      
      (highlightsApi.createHighlight as jest.Mock).mockRejectedValue(new Error('Creation failed'));

      const { result } = renderHook(
        () => useEpubHighlights({ 
          bookId: mockBookId, 
          renditionRef,
          onError,
        }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadHighlights();
      });

      await waitFor(() => {
        expect(result.current.isLoadingHighlights).toBe(false);
      });

      // Set pending selection first
      act(() => {
        result.current.setPendingSelection({
          text: 'Test text',
          cfiRange: 'epubcfi(/6/12[chap05ref]!/4/2,/1:0,/1:9)',
          x: 100,
          y: 200,
          height: 20,
        });
      });

      await act(async () => {
        await result.current.createHighlight(
          { name: 'Purple', color: 'purple', hex: '#dda0dd' },
          1
        );
      });

      expect(consoleError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith('Failed to create highlight');
      
      consoleError.mockRestore();
    });
  });

  describe('Highlight Deletion', () => {
    it('should delete a highlight successfully', async () => {
      (highlightsApi.deleteHighlight as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(
        () => useEpubHighlights({ 
          bookId: mockBookId, 
          renditionRef,
        }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadHighlights();
      });

      await waitFor(() => {
        expect(result.current.highlights).toHaveLength(3);
      });

      const highlightToDelete = result.current.highlights[0];

      await act(async () => {
        await result.current.removeHighlight(highlightToDelete.id, highlightToDelete.cfiRange);
      });

      await waitFor(() => {
        expect(result.current.highlights).toHaveLength(2);
      });

      expect(highlightsApi.deleteHighlight).toHaveBeenCalledWith(
        highlightToDelete.id,
        mockAccessToken
      );

      // Verify highlight was removed from rendition
      expect(mockRendition.annotations.remove).toHaveBeenCalledWith(
        highlightToDelete.cfiRange,
        'highlight'
      );
    });

    it('should handle deletion errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const onError = jest.fn();
      
      (highlightsApi.deleteHighlight as jest.Mock).mockRejectedValue(new Error('Deletion failed'));

      const { result } = renderHook(
        () => useEpubHighlights({ 
          bookId: mockBookId, 
          renditionRef,
          onError,
        }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadHighlights();
      });

      await waitFor(() => {
        expect(result.current.highlights).toHaveLength(3);
      });

      const highlightToDelete = result.current.highlights[0];

      await act(async () => {
        try {
          await result.current.removeHighlight(highlightToDelete.id, highlightToDelete.cfiRange);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
          // Expected to fail
        }
      });

      expect(consoleError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith('Failed to remove highlight. Please try again.');
      
      consoleError.mockRestore();
    });
  });

  describe('Highlight Color Change', () => {
    it('should change highlight color successfully', async () => {
      const updatedHighlight = {
        ...mockHighlights[0],
        color: 'purple',
        hex: '#dda0dd',
        updatedAt: new Date().toISOString(),
      };

      (highlightsApi.updateHighlight as jest.Mock).mockResolvedValue(updatedHighlight);

      const { result } = renderHook(
        () => useEpubHighlights({ 
          bookId: mockBookId, 
          renditionRef,
        }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadHighlights();
      });

      await waitFor(() => {
        expect(result.current.highlights).toHaveLength(3);
      });

      const highlightToUpdate = result.current.highlights[0];

      await act(async () => {
        await result.current.updateHighlightColor(
          highlightToUpdate.id,
          { name: 'Purple', color: 'purple', hex: '#dda0dd' }
        );
      });

      await waitFor(() => {
        const updated = result.current.highlights.find(h => h.id === highlightToUpdate.id);
        expect(updated?.color).toBe('purple');
        expect(updated?.hex).toBe('#dda0dd');
      });

      expect(highlightsApi.updateHighlight).toHaveBeenCalledWith(
        highlightToUpdate.id,
        { color: 'purple', hex: '#dda0dd' },
        mockAccessToken
      );

      // Verify old highlight was removed and new one added
      expect(mockRendition.annotations.remove).toHaveBeenCalledWith(
        highlightToUpdate.cfiRange,
        'highlight'
      );
      
      expect(mockRendition.annotations.add).toHaveBeenCalledWith(
        'highlight',
        highlightToUpdate.cfiRange,
        {},
        undefined,
        'hl',
        expect.objectContaining({
          fill: '#dda0dd',
          'fill-opacity': '1',
        })
      );
    });

    it('should handle color change errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const onError = jest.fn();
      
      (highlightsApi.updateHighlight as jest.Mock).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(
        () => useEpubHighlights({ 
          bookId: mockBookId, 
          renditionRef,
          onError,
        }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadHighlights();
      });

      await waitFor(() => {
        expect(result.current.highlights).toHaveLength(3);
      });

      const highlightToUpdate = result.current.highlights[0];
      const originalColor = highlightToUpdate.color;

      await act(async () => {
        await result.current.updateHighlightColor(
          highlightToUpdate.id,
          { name: 'Blue', color: 'blue', hex: '#87ceeb' }
        );
      });

      // Color should not change on error
      const unchanged = result.current.highlights.find(h => h.id === highlightToUpdate.id);
      expect(unchanged?.color).toBe(originalColor);

      expect(consoleError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith('Failed to update highlight color');
      
      consoleError.mockRestore();
    });
  });

  describe('Highlight Note Management', () => {
    it('should save a note to a highlight', async () => {
      const updatedHighlight = {
        ...mockHighlights[1],
        note: 'New note added',
        updatedAt: new Date().toISOString(),
      };

      (highlightsApi.updateHighlight as jest.Mock).mockResolvedValue(updatedHighlight);

      const { result } = renderHook(
        () => useEpubHighlights({ 
          bookId: mockBookId, 
          renditionRef,
        }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadHighlights();
      });

      await waitFor(() => {
        expect(result.current.highlights).toHaveLength(3);
      });

      const highlightToUpdate = result.current.highlights[1];

      await act(async () => {
        await result.current.saveHighlightNote(highlightToUpdate.id, 'New note added');
      });

      await waitFor(() => {
        const updated = result.current.highlights.find(h => h.id === highlightToUpdate.id);
        expect(updated?.note).toBe('New note added');
      });

      expect(highlightsApi.updateHighlight).toHaveBeenCalledWith(
        highlightToUpdate.id,
        { note: 'New note added' },
        mockAccessToken
      );
    });

    it('should update an existing note', async () => {
      const updatedHighlight = {
        ...mockHighlights[0],
        note: 'Updated note text',
        updatedAt: new Date().toISOString(),
      };

      (highlightsApi.updateHighlight as jest.Mock).mockResolvedValue(updatedHighlight);

      const { result } = renderHook(
        () => useEpubHighlights({ 
          bookId: mockBookId, 
          renditionRef,
        }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadHighlights();
      });

      await waitFor(() => {
        expect(result.current.highlights).toHaveLength(3);
      });

      const highlightToUpdate = result.current.highlights[0];

      await act(async () => {
        await result.current.saveHighlightNote(highlightToUpdate.id, 'Updated note text');
      });

      await waitFor(() => {
        const updated = result.current.highlights.find(h => h.id === highlightToUpdate.id);
        expect(updated?.note).toBe('Updated note text');
      });
    });

    it('should remove a note by setting it to empty string', async () => {
      const updatedHighlight = {
        ...mockHighlights[0],
        note: null,
        updatedAt: new Date().toISOString(),
      };

      (highlightsApi.updateHighlight as jest.Mock).mockResolvedValue(updatedHighlight);

      const { result } = renderHook(
        () => useEpubHighlights({ 
          bookId: mockBookId, 
          renditionRef,
        }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadHighlights();
      });

      await waitFor(() => {
        expect(result.current.highlights).toHaveLength(3);
      });

      const highlightToUpdate = result.current.highlights[0];

      await act(async () => {
        await result.current.saveHighlightNote(highlightToUpdate.id, '');
      });

      await waitFor(() => {
        const updated = result.current.highlights.find(h => h.id === highlightToUpdate.id);
        expect(updated?.note).toBe('');
      });
    });

    it('should handle note update errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const onError = jest.fn();
      
      (highlightsApi.updateHighlight as jest.Mock).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(
        () => useEpubHighlights({ 
          bookId: mockBookId, 
          renditionRef,
          onError,
        }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadHighlights();
      });

      await waitFor(() => {
        expect(result.current.highlights).toHaveLength(3);
      });

      const highlightToUpdate = result.current.highlights[0];
      const originalNote = highlightToUpdate.note;

      await act(async () => {
        await result.current.saveHighlightNote(highlightToUpdate.id, 'Failed note');
      });

      // Note should not change on error
      const unchanged = result.current.highlights.find(h => h.id === highlightToUpdate.id);
      expect(unchanged?.note).toBe(originalNote);

      expect(consoleError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith('Failed to save note');
      
      consoleError.mockRestore();
    });
  });

  describe('Highlight Navigation', () => {
    it('should provide function to jump to highlight', async () => {
      const { result } = renderHook(
        () => useEpubHighlights({ 
          bookId: mockBookId, 
          renditionRef,
        }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadHighlights();
      });

      await waitFor(() => {
        expect(result.current.highlights).toHaveLength(3);
      });

      // The jumpToHighlight function should exist
      expect(result.current.jumpToHighlight).toBeDefined();
      expect(typeof result.current.jumpToHighlight).toBe('function');
    });
  });

  describe('Text Selection Integration', () => {
    it('should handle pending selection state', async () => {
      const { result } = renderHook(
        () => useEpubHighlights({ 
          bookId: mockBookId, 
          renditionRef,
        }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadHighlights();
      });

      await waitFor(() => {
        expect(result.current.isLoadingHighlights).toBe(false);
      });

      // Initially no pending selection
      expect(result.current.pendingSelection).toBeNull();

      // Set pending selection
      act(() => {
        result.current.setPendingSelection({
          text: 'Selected text',
          cfiRange: 'epubcfi(/6/14[chap06ref]!/4/2,/1:0,/1:13)',
          x: 100,
          y: 200,
          height: 20,
        });
      });

      expect(result.current.pendingSelection).toEqual({
        text: 'Selected text',
        cfiRange: 'epubcfi(/6/14[chap06ref]!/4/2,/1:0,/1:13)',
        x: 100,
        y: 200,
        height: 20,
      });

      // Clear pending selection
      act(() => {
        result.current.setPendingSelection(null);
      });

      expect(result.current.pendingSelection).toBeNull();
    });

    it('should clear pending selection after creating highlight', async () => {
      const newHighlight = {
        id: 'highlight-6',
        bookId: mockBookId,
        userId: 'user-123',
        text: 'Selected and highlighted',
        cfiRange: 'epubcfi(/6/16[chap07ref]!/4/2,/1:0,/1:23)',
        color: 'yellow',
        hex: '#ffff00',
        note: null,
        source: 'EPUB' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (highlightsApi.createHighlight as jest.Mock).mockResolvedValue(newHighlight);

      const { result } = renderHook(
        () => useEpubHighlights({ 
          bookId: mockBookId, 
          renditionRef,
        }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadHighlights();
      });

      await waitFor(() => {
        expect(result.current.isLoadingHighlights).toBe(false);
      });

      // Set pending selection
      act(() => {
        result.current.setPendingSelection({
          text: 'Selected and highlighted',
          cfiRange: 'epubcfi(/6/16[chap07ref]!/4/2,/1:0,/1:23)',
          x: 100,
          y: 200,
          height: 20,
        });
      });

      expect(result.current.pendingSelection).not.toBeNull();

      // Create highlight
      await act(async () => {
        await result.current.createHighlight(
          { name: 'Yellow', color: 'yellow', hex: '#ffff00' },
          1
        );
      });

      // Pending selection should be cleared
      expect(result.current.pendingSelection).toBeNull();
    });
  });

  describe('Multiple Color Support', () => {
    it('should support all available highlight colors', async () => {
      const colors = [
        { color: 'yellow', hex: '#ffff00' },
        { color: 'green', hex: '#00ff00' },
        { color: 'pink', hex: '#ff69b4' },
        { color: 'blue', hex: '#87ceeb' },
        { color: 'orange', hex: '#ffa500' },
        { color: 'purple', hex: '#dda0dd' },
      ];

      const { result } = renderHook(
        () => useEpubHighlights({ 
          bookId: mockBookId, 
          renditionRef,
        }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadHighlights();
      });

      await waitFor(() => {
        expect(result.current.isLoadingHighlights).toBe(false);
      });

      // Test each color
      for (let i = 0; i < colors.length; i++) {
        const { color, hex } = colors[i];
        const newHighlight = {
          id: `color-test-${i}`,
          bookId: mockBookId,
          userId: 'user-123',
          text: `Text with ${color} highlight`,
          cfiRange: `epubcfi(/6/${20 + i * 2}[chapTest${i}]!/4/2,/1:0,/1:20)`,
          color,
          hex,
          note: null,
          source: 'EPUB' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        (highlightsApi.createHighlight as jest.Mock).mockResolvedValue(newHighlight);

        // Set pending selection first
        act(() => {
          result.current.setPendingSelection({
            text: `Text with ${color} highlight`,
            cfiRange: `epubcfi(/6/${20 + i * 2}[chapTest${i}]!/4/2,/1:0,/1:20)`,
            x: 100,
            y: 200,
            height: 20,
          });
        });

        await act(async () => {
          await result.current.createHighlight(
            { name: color.charAt(0).toUpperCase() + color.slice(1), color, hex },
            1
          );
        });

        await waitFor(() => {
          const highlight = result.current.highlights.find(h => h.id === `color-test-${i}`);
          expect(highlight?.color).toBe(color);
          expect(highlight?.hex).toBe(hex);
        });
      }
    });
  });

  describe('Highlights Persistence', () => {
    it('should reload highlights when bookId changes', async () => {
      const { result, rerender } = renderHook(
        ({ bookId }) => useEpubHighlights({ 
          bookId, 
          renditionRef,
        }),
        { 
          wrapper: createWrapper(),
          initialProps: { bookId: mockBookId }
        }
      );

      await act(async () => {
        await result.current.loadHighlights();
      });

      await waitFor(() => {
        expect(result.current.highlights).toHaveLength(3);
      });

      // Change book
      const newBookHighlights = [
        {
          id: 'new-book-highlight-1',
          bookId: 'new-book-456',
          userId: 'user-123',
          text: 'Highlight from different book',
          cfiRange: 'epubcfi(/6/4[intro]!/4/2,/1:0,/1:30)',
          color: 'blue',
          hex: '#87ceeb',
          note: null,
          source: 'EPUB' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      (highlightsApi.fetchHighlights as jest.Mock).mockResolvedValue(newBookHighlights);

      rerender({ bookId: 'new-book-456' });

      // Manually trigger load after bookId change
      await act(async () => {
        await result.current.loadHighlights();
      });

      await waitFor(() => {
        expect(result.current.highlights).toHaveLength(1);
        expect(result.current.highlights[0].text).toBe('Highlight from different book');
      });

      expect(highlightsApi.fetchHighlights).toHaveBeenCalledWith('new-book-456', mockAccessToken);
    });
  });

  describe('Success and Error Callbacks', () => {
    it('should call onSuccess callback after successful creation', async () => {
      const onSuccess = jest.fn();
      const newHighlight = {
        id: 'success-test',
        bookId: mockBookId,
        userId: 'user-123',
        text: 'Success test',
        cfiRange: 'epubcfi(/6/30[success]!/4/2,/1:0,/1:12)',
        color: 'green',
        hex: '#00ff00',
        note: null,
        source: 'EPUB' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (highlightsApi.createHighlight as jest.Mock).mockResolvedValue(newHighlight);

      const { result } = renderHook(
        () => useEpubHighlights({ 
          bookId: mockBookId, 
          renditionRef,
          onSuccess,
        }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadHighlights();
      });

      await waitFor(() => {
        expect(result.current.isLoadingHighlights).toBe(false);
      });

      // Set pending selection first
      act(() => {
        result.current.setPendingSelection({
          text: 'Success test',
          cfiRange: 'epubcfi(/6/30[success]!/4/2,/1:0,/1:12)',
          x: 100,
          y: 200,
          height: 20,
        });
      });

      await act(async () => {
        await result.current.createHighlight(
          { name: 'Green', color: 'green', hex: '#00ff00' },
          1
        );
      });

      expect(onSuccess).toHaveBeenCalledWith('Highlight created');
    });

    it('should call onError callback after failed operation', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const onError = jest.fn();
      
      (highlightsApi.createHighlight as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(
        () => useEpubHighlights({ 
          bookId: mockBookId, 
          renditionRef,
          onError,
        }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadHighlights();
      });

      await waitFor(() => {
        expect(result.current.isLoadingHighlights).toBe(false);
      });

      // Set pending selection first
      act(() => {
        result.current.setPendingSelection({
          text: 'Error test',
          cfiRange: 'epubcfi(/6/32[error]!/4/2,/1:0,/1:10)',
          x: 100,
          y: 200,
          height: 20,
        });
      });

      await act(async () => {
        await result.current.createHighlight(
          { name: 'Red', color: 'red', hex: '#ff0000' },
          1
        );
      });

      expect(onError).toHaveBeenCalledWith('Failed to create highlight');
      
      consoleError.mockRestore();
    });
  });
});
