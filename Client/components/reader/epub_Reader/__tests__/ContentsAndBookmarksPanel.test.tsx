import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContentsAndBookmarksPanel from '../ContentsAndBookmarksPanel';
import type { NavItem } from 'epubjs';
import { Bookmark } from '@/lib/api';

// Mock @tanstack/react-virtual
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: () => ({
    getTotalSize: () => 500,
    getVirtualItems: () => [],
    measureElement: jest.fn(),
  }),
}));

// Mock sanitize-text
jest.mock('@/lib/sanitize-text', () => ({
  sanitizeBookmarkNote: jest.fn((text: string) => text),
}));

describe('ContentsAndBookmarksPanel', () => {
  const mockToc: NavItem[] = [
    { id: 'chap1', href: 'chapter1.html', label: 'Chapter 1' },
    { id: 'chap2', href: 'chapter2.html', label: 'Chapter 2' },
    { id: 'chap3', href: 'chapter3.html', label: 'Chapter 3' },
  ];

  const mockBookmarks: Bookmark[] = [
    {
      id: 'bookmark-1',
      bookId: 'book-1',
      userId: 'user-1',
      pageNumber: 10,
      note: 'First bookmark note',
      createdAt: new Date('2024-01-01').toISOString(),
      updatedAt: new Date('2024-01-01').toISOString(),
    },
    {
      id: 'bookmark-2',
      bookId: 'book-1',
      userId: 'user-1',
      pageNumber: 20,
      note: 'Second bookmark note',
      createdAt: new Date('2024-01-02').toISOString(),
      updatedAt: new Date('2024-01-02').toISOString(),
    },
  ];

  const defaultProps = {
    toc: mockToc,
    onTocItemClick: jest.fn(),
    bookmarks: mockBookmarks,
    isLoadingBookmarks: false,
    currentPage: 10,
    onJumpToPage: jest.fn(),
    onEditBookmark: jest.fn(),
    onDeleteBookmark: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the panel with contents tab active by default', () => {
      render(<ContentsAndBookmarksPanel {...defaultProps} />);
      
      expect(screen.getByRole('heading', { name: 'Contents' })).toBeInTheDocument();
      const tabButtons = screen.getAllByText('Contents');
      expect(tabButtons.length).toBeGreaterThan(0);
      expect(screen.getByText('Bookmarks')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<ContentsAndBookmarksPanel {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should display bookmark count in tab label', () => {
      render(<ContentsAndBookmarksPanel {...defaultProps} />);
      
      expect(screen.getByText(`(${mockBookmarks.length})`)).toBeInTheDocument();
    });

    it('should render panel with correct styling classes', () => {
      const { container } = render(<ContentsAndBookmarksPanel {...defaultProps} />);
      
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('absolute', 'top-16', 'right-0', 'bottom-0', 'w-80');
      expect(panel).toHaveClass('bg-white', 'dark:bg-gray-800');
      expect(panel).toHaveClass('border-l', 'border-gray-200', 'dark:border-gray-700');
    });
  });

  describe('Tab Switching', () => {
    it('should switch to bookmarks tab when clicked', () => {
      render(<ContentsAndBookmarksPanel {...defaultProps} />);
      
      const bookmarksTabButton = screen.getByRole('button', { name: /Bookmarks/i });
      fireEvent.click(bookmarksTabButton);
      
      expect(screen.getByRole('heading', { name: 'Bookmarks' })).toBeInTheDocument();
    });

    it('should switch back to contents tab', () => {
      render(<ContentsAndBookmarksPanel {...defaultProps} />);
      
      // First switch to bookmarks
      const bookmarksTabButton = screen.getByRole('button', { name: /Bookmarks/i });
      fireEvent.click(bookmarksTabButton);
      
      // Then switch back to contents
      const contentsTabButton = screen.getByRole('button', { name: /^Contents$/i });
      fireEvent.click(contentsTabButton);
      
      expect(screen.getByRole('heading', { name: 'Contents' })).toBeInTheDocument();
    });

    it('should apply active styling to selected tab', () => {
      render(<ContentsAndBookmarksPanel {...defaultProps} />);
      
      const contentsTabButton = screen.getByRole('button', { name: /^Contents$/i });
      expect(contentsTabButton).toHaveClass('text-blue-600', 'dark:text-blue-400');
    });
  });

  describe('Contents Tab', () => {
    it('should display empty state when TOC is empty', () => {
      render(<ContentsAndBookmarksPanel {...defaultProps} toc={[]} />);
      
      expect(screen.getByText('No table of contents available')).toBeInTheDocument();
    });

    it('should not display TOC items when list is empty (virtualization)', () => {
      render(<ContentsAndBookmarksPanel {...defaultProps} toc={[]} />);
      
      mockToc.forEach(item => {
        expect(screen.queryByText(item.label)).not.toBeInTheDocument();
      });
    });
  });

  describe('Bookmarks Tab', () => {
    it('should display loading state when loading bookmarks', () => {
      render(<ContentsAndBookmarksPanel {...defaultProps} isLoadingBookmarks={true} />);
      
      fireEvent.click(screen.getByRole('button', { name: /Bookmarks/i }));
      
      expect(screen.getByText('Loading bookmarks...')).toBeInTheDocument();
    });

    it('should display empty state when no bookmarks', () => {
      render(<ContentsAndBookmarksPanel {...defaultProps} bookmarks={[]} />);
      
      fireEvent.click(screen.getByRole('button', { name: /Bookmarks/i }));
      
      expect(screen.getByText('No bookmarks yet')).toBeInTheDocument();
      expect(screen.getByText('Click the bookmark icon in the toolbar to save a page')).toBeInTheDocument();
    });

    it('should not show bookmark count when list is empty', () => {
      render(<ContentsAndBookmarksPanel {...defaultProps} bookmarks={[]} />);
      
      expect(screen.queryByText('(0)')).not.toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', () => {
      render(<ContentsAndBookmarksPanel {...defaultProps} />);
      
      // Get all buttons and find close button (the X icon button)
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.querySelector('.lucide-x'));
      
      expect(closeButton).toBeInTheDocument();
      fireEvent.click(closeButton!);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Panel Styling', () => {
    it('should have fixed positioning classes', () => {
      const { container } = render(<ContentsAndBookmarksPanel {...defaultProps} />);
      
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('absolute');
    });

    it('should have shadow and z-index classes', () => {
      const { container } = render(<ContentsAndBookmarksPanel {...defaultProps} />);
      
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('shadow-lg', 'z-20');
    });

    it('should have flex layout classes', () => {
      const { container } = render(<ContentsAndBookmarksPanel {...defaultProps} />);
      
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('flex', 'flex-col');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined bookmark note gracefully', () => {
      const bookmarksWithoutNote: Bookmark[] = [{
        ...mockBookmarks[0],
        note: '',
      }];
      
      render(<ContentsAndBookmarksPanel {...defaultProps} bookmarks={bookmarksWithoutNote} />);
      
      fireEvent.click(screen.getByRole('button', { name: /Bookmarks/i }));
      
      // Should not render note element
      expect(screen.queryByText('First bookmark note')).not.toBeInTheDocument();
    });

    it('should handle bookmarks with same page number', () => {
      const duplicatePageBookmarks: Bookmark[] = [
        mockBookmarks[0],
        { ...mockBookmarks[1], pageNumber: 10 },
      ];
      
      render(<ContentsAndBookmarksPanel {...defaultProps} bookmarks={duplicatePageBookmarks} />);
      
      // Should render without error
      expect(screen.getByRole('heading', { name: 'Contents' })).toBeInTheDocument();
    });

    it('should handle empty TOC array', () => {
      render(<ContentsAndBookmarksPanel {...defaultProps} toc={[]} />);
      
      expect(screen.getByText('No table of contents available')).toBeInTheDocument();
    });

    it('should handle very long bookmark notes', () => {
      const longNote = 'A'.repeat(500);
      const bookmarksWithLongNote: Bookmark[] = [{
        ...mockBookmarks[0],
        note: longNote,
      }];
      
      render(<ContentsAndBookmarksPanel {...defaultProps} bookmarks={bookmarksWithLongNote} />);
      
      // Should render without error
      expect(screen.getByRole('heading', { name: 'Contents' })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<ContentsAndBookmarksPanel {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { name: 'Contents' });
      expect(heading).toHaveClass('text-lg', 'font-semibold');
    });

    it('should have accessible button labels', () => {
      render(<ContentsAndBookmarksPanel {...defaultProps} />);
      
      const contentsTab = screen.getByRole('button', { name: /^Contents$/i });
      const bookmarksTab = screen.getByRole('button', { name: /Bookmarks/i });
      
      expect(contentsTab).toBeInTheDocument();
      expect(bookmarksTab).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should support full workflow: render -> switch tab -> close', () => {
      render(<ContentsAndBookmarksPanel {...defaultProps} />);
      
      // Initial state
      expect(screen.getByRole('heading', { name: 'Contents' })).toBeInTheDocument();
      
      // Switch to bookmarks
      fireEvent.click(screen.getByRole('button', { name: /Bookmarks/i }));
      expect(screen.getByRole('heading', { name: 'Bookmarks' })).toBeInTheDocument();
      
      // Close panel
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.querySelector('.lucide-x'));
      fireEvent.click(closeButton!);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });
});
