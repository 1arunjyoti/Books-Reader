/**
 * Unit tests for useEpubNavigation hook
 * Tests navigation, location generation, and safe navigation logic
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useEpubNavigation } from '../useEpubNavigation';
import type { Rendition } from 'epubjs';

// Mock EPUB.js types
interface MockBook {
  locations: {
    generate: jest.Mock;
    length: jest.Mock;
    locationFromCfi: jest.Mock;
    cfiFromLocation: jest.Mock;
    save: jest.Mock;
  };
  navigation?: {
    toc: Array<{ label: string; href: string; cfi: string }>;
  };
  spine: {
    length: number;
  };
}

interface MockRendition {
  book: MockBook;
  location: {
    start: {
      cfi: string;
      displayed: {
        page: number;
        total: number;
      };
    };
  };
  next: jest.Mock;
  prev: jest.Mock;
  display: jest.Mock;
}

describe('useEpubNavigation', () => {
  let mockRendition: MockRendition;
  let mockBook: MockBook;
  let renditionRef: React.MutableRefObject<Rendition | undefined>;

  beforeEach(() => {
    // Create mock book with locations API
    mockBook = {
      locations: {
        generate: jest.fn().mockResolvedValue(undefined),
        length: jest.fn().mockReturnValue(100),
        locationFromCfi: jest.fn().mockReturnValue(50),
        cfiFromLocation: jest.fn().mockReturnValue('epubcfi(/6/4)'),
        save: jest.fn().mockReturnValue('saved-locations'),
      },
      navigation: {
        toc: [
          { label: 'Chapter 1', href: 'chapter01.html', cfi: 'epubcfi(/6/4)' },
          { label: 'Chapter 2', href: 'chapter02.html', cfi: 'epubcfi(/6/6)' },
        ],
      },
      spine: {
        length: 10,
      },
    };

    // Create mock rendition
    mockRendition = {
      book: mockBook,
      location: {
        start: {
          cfi: 'epubcfi(/6/4[chapter01]!/4/2/1:0)',
          displayed: {
            page: 1,
            total: 10,
          },
        },
      },
      next: jest.fn().mockResolvedValue(undefined),
      prev: jest.fn().mockResolvedValue(undefined),
      display: jest.fn().mockResolvedValue(undefined),
    };

    // Create ref with type assertion
    renditionRef = {
      current: mockRendition as unknown as Rendition,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() =>
        useEpubNavigation({ renditionRef })
      );

      expect(result.current.location).toBe(0);
      expect(result.current.pageInfo).toEqual({ current: 0, total: 0 });
      expect(result.current.currentChapter).toBe('');
      expect(result.current.isGeneratingLocations).toBe(false);
      expect(result.current.locationGenerationProgress).toBe(0);
      expect(result.current.pageInput).toBe('0');
    });
  });

  describe('location generation', () => {
    it('should generate locations successfully', async () => {
      const onLocationsGenerated = jest.fn();
      const { result } = renderHook(() =>
        useEpubNavigation({
          renditionRef,
          onLocationsGenerated,
        })
      );

      await act(async () => {
        await result.current.generateLocations(mockBook);
      });

      expect(mockBook.locations.generate).toHaveBeenCalledWith(1600);
      expect(onLocationsGenerated).toHaveBeenCalledWith(mockBook);
    });

    it('should handle generation errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockBook.locations.generate.mockRejectedValue(new Error('Generation failed'));

      const { result } = renderHook(() =>
        useEpubNavigation({ renditionRef })
      );

      await act(async () => {
        await result.current.generateLocations(mockBook);
      });

      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('page navigation', () => {
    it('should navigate to next page', async () => {
      const { result } = renderHook(() =>
        useEpubNavigation({ renditionRef })
      );

      await act(async () => {
        await result.current.goToNextPage();
      });

      expect(mockRendition.next).toHaveBeenCalled();
    });

    it('should navigate to previous page', async () => {
      const { result } = renderHook(() =>
        useEpubNavigation({ renditionRef })
      );

      await act(async () => {
        await result.current.goToPrevPage();
      });

      expect(mockRendition.prev).toHaveBeenCalled();
    });

    it('should navigate to specific page after locations are ready', async () => {
      mockBook.locations.length.mockReturnValue(100);

      const { result } = renderHook(() =>
        useEpubNavigation({ renditionRef })
      );

      // Generate locations first
      await act(async () => {
        await result.current.generateLocations(mockBook);
      });

      // Now navigate to page
      act(() => {
        result.current.goToPage(50);
      });

      // Wait for async navigation
      await waitFor(() => {
        expect(mockRendition.display).toHaveBeenCalled();
      });
    });
  });

  describe('safe navigation', () => {
    it('should process queued navigation requests in order', async () => {
      const { result } = renderHook(() =>
        useEpubNavigation({ renditionRef })
      );

      const executionOrder: number[] = [];

      await act(async () => {
        const nav1 = result.current.safeNavigate(async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          executionOrder.push(1);
        });

        const nav2 = result.current.safeNavigate(async () => {
          executionOrder.push(2);
        });

        const nav3 = result.current.safeNavigate(async () => {
          executionOrder.push(3);
        });

        await Promise.all([nav1, nav2, nav3]);
      });

      expect(executionOrder).toEqual([1, 2, 3]);
    });
  });

  describe('location change handling', () => {
    it('should update location state', () => {
      const { result } = renderHook(() =>
        useEpubNavigation({ renditionRef })
      );

      act(() => {
        result.current.handleLocationChange('epubcfi(/6/4[chapter01]!/4/2/1:0)');
      });

      expect(result.current.location).toBe('epubcfi(/6/4[chapter01]!/4/2/1:0)');
    });

    it('should update page info from displayed pages when no locations', () => {
      mockBook.locations.length.mockReturnValue(0);

      const { result } = renderHook(() =>
        useEpubNavigation({ renditionRef })
      );

      act(() => {
        result.current.handleLocationChange('epubcfi(/6/4[chapter01]!/4/2/1:0)');
      });

      expect(result.current.pageInfo.current).toBe(1);
      expect(result.current.pageInfo.total).toBe(10);
    });
  });

  describe('page input handling', () => {
    it('should update page input value', () => {
      const { result } = renderHook(() =>
        useEpubNavigation({ renditionRef })
      );

      act(() => {
        result.current.setPageInput('25');
      });

      expect(result.current.pageInput).toBe('25');
    });

    it('should navigate on form submit with valid input', async () => {
      mockBook.locations.length.mockReturnValue(100);

      const { result } = renderHook(() =>
        useEpubNavigation({ renditionRef })
      );

      // Generate locations first
      await act(async () => {
        await result.current.generateLocations(mockBook);
      });

      // Wait for locations to be ready and pageInfo to be updated
      await waitFor(() => {
        expect(result.current.locationsReady).toBe(true);
        expect(result.current.pageInfo.total).toBe(100);
      });

      const mockEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent;

      // Set page input and submit
      await act(async () => {
        result.current.setPageInput('50');
      });

      await act(async () => {
        result.current.handlePageInputSubmit(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      
      // Wait for async navigation
      await waitFor(() => {
        expect(mockRendition.display).toHaveBeenCalled();
      });
    });

    it('should not navigate with invalid page number', async () => {
      const { result } = renderHook(() =>
        useEpubNavigation({ renditionRef })
      );

      const mockEvent = {
        preventDefault: jest.fn(),
      } as unknown as React.FormEvent;

      await act(async () => {
        result.current.setPageInput('invalid');
        await result.current.handlePageInputSubmit(mockEvent);
      });

      expect(mockRendition.display).not.toHaveBeenCalled();
    });
  });
});
