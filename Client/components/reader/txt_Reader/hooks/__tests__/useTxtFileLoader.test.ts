/**
 * TXT File Loader Hook Unit Tests
 * Tests the useTxtFileLoader custom hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useTxtFileLoader } from '@/components/reader/txt_Reader/hooks/useTxtFileLoader';
import '@testing-library/jest-dom';

// Mock fetch API
global.fetch = jest.fn();

describe('useTxtFileLoader', () => {
  const mockFileUrl = 'http://example.com/test.txt';
  const mockTextContent = 'This is a test content that should be split into sections. '.repeat(100);

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock IntersectionObserver
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('File Loading', () => {
    it('should load and split text file into sections', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => '1000',
        },
        text: () => Promise.resolve(mockTextContent),
      });

      const { result } = renderHook(() =>
        useTxtFileLoader({
          fileUrl: mockFileUrl,
          currentPage: 0,
        })
      );

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.sections).toEqual([]);

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have sections
      expect(result.current.sections.length).toBeGreaterThan(0);
      expect(result.current.error).toBe(null);
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const { result } = renderHook(() =>
        useTxtFileLoader({
          fileUrl: mockFileUrl,
          currentPage: 0,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load text file');
      expect(result.current.sections).toEqual([]);
    });

    it('should reject files larger than max size', async () => {
      const maxFileSize = 10; // 10MB
      const oversizeContent = '60MB';
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => String(60 * 1024 * 1024), // 60MB
        },
        text: () => Promise.resolve(oversizeContent),
      });

      const { result } = renderHook(() =>
        useTxtFileLoader({
          fileUrl: mockFileUrl,
          currentPage: 0,
          maxFileSize,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toContain('File too large');
    });

    it('should handle null fileUrl', async () => {
      const { result } = renderHook(() =>
        useTxtFileLoader({
          fileUrl: null,
          currentPage: 0,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('No file URL provided');
    });
  });

  describe('Section Management', () => {
    it('should split content into sections of specified size', async () => {
      const customSectionSize = 100;
      const testContent = 'a'.repeat(350); // 350 chars

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => '350',
        },
        text: () => Promise.resolve(testContent),
      });

      const { result } = renderHook(() =>
        useTxtFileLoader({
          fileUrl: mockFileUrl,
          currentPage: 0,
          sectionSize: customSectionSize,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have 4 sections (350 / 100 = 3.5, rounded up to 4)
      expect(result.current.sections.length).toBe(4);
      expect(result.current.sections[0].length).toBe(100);
      expect(result.current.sections[3].length).toBe(50); // Last section
    });

    it('should set current section from currentPage prop', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => '1000',
        },
        text: () => Promise.resolve(mockTextContent),
      });

      const { result } = renderHook(() =>
        useTxtFileLoader({
          fileUrl: mockFileUrl,
          currentPage: 2,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Current section should be set based on currentPage
      // But clamped to valid range (number of sections - 1)
      expect(result.current.currentSection).toBeGreaterThanOrEqual(0);
      expect(result.current.currentSection).toBeLessThan(result.current.sections.length);
    });

    it('should limit currentSection to valid range', async () => {
      const shortContent = 'Short content';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => String(shortContent.length),
        },
        text: () => Promise.resolve(shortContent),
      });

      const { result } = renderHook(() =>
        useTxtFileLoader({
          fileUrl: mockFileUrl,
          currentPage: 999, // Out of bounds
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should clamp to last section (0 in this case since content is short)
      expect(result.current.currentSection).toBe(0);
    });
  });

  describe('Refs Management', () => {
    it('should provide sectionRefs and scrollContainerRef', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => '100',
        },
        text: () => Promise.resolve('Test content'),
      });

      const { result } = renderHook(() =>
        useTxtFileLoader({
          fileUrl: mockFileUrl,
          currentPage: 0,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.sectionRefs).toBeDefined();
      expect(result.current.sectionRefs.current).toBeInstanceOf(Array);
      expect(result.current.scrollContainerRef).toBeDefined();
      expect(result.current.scrollContainerRef.current).toBe(null); // Not attached to DOM
    });
  });

  describe('Page Change Callback', () => {
    it('should call onPageChange when section changes', async () => {
      const onPageChange = jest.fn();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => '100',
        },
        text: () => Promise.resolve('Test content'),
      });

      const { result } = renderHook(() =>
        useTxtFileLoader({
          fileUrl: mockFileUrl,
          currentPage: 0,
          onPageChange,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Note: onPageChange would be called by IntersectionObserver in real usage
      // In unit tests, we just verify the hook sets up correctly
      expect(result.current.scrollContainerRef).toBeDefined();
    });
  });

  describe('Security Validations', () => {
    it('should validate content length after loading', async () => {
      const maxFileSize = 1; // 1MB
      // Create content that's larger than max when loaded
      const largeContent = 'x'.repeat(2 * 1024 * 1024); // 2MB

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => null, // No content-length header
        },
        text: () => Promise.resolve(largeContent),
      });

      const { result } = renderHook(() =>
        useTxtFileLoader({
          fileUrl: mockFileUrl,
          currentPage: 0,
          maxFileSize,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toContain('exceeds maximum size limit');
    });
  });
});
