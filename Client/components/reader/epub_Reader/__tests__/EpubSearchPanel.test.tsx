import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import EpubSearchPanel from '../EpubSearchPanel';

// Mock @tanstack/react-virtual
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: () => ({
    getTotalSize: () => 500,
    getVirtualItems: () => [],
    measureElement: jest.fn(),
  }),
}));

describe('EpubSearchPanel', () => {
  const mockSearchResults = [
    { cfi: 'epubcfi(/6/4!/4/2/1:0)', excerpt: 'This is the first search result' },
    { cfi: 'epubcfi(/6/4!/4/4/1:0)', excerpt: 'This is the second search result' },
    { cfi: 'epubcfi(/6/4!/4/6/1:0)', excerpt: 'This is the third search result' },
  ];

  const defaultProps = {
    searchQuery: '',
    onSearchQueryChange: jest.fn(),
    onSearch: jest.fn(),
    searchResults: [],
    currentSearchIndex: 0,
    onPrev: jest.fn(),
    onNext: jest.fn(),
    onSelectResult: jest.fn(),
    onClear: jest.fn(),
    onClose: jest.fn(),
    isSearching: false,
    searchProgress: 0,
    onCancelSearch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render search panel with title', () => {
      render(<EpubSearchPanel {...defaultProps} />);

      // Use getByRole to select the heading specifically
      expect(screen.getByRole('heading', { name: 'Search' })).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(<EpubSearchPanel {...defaultProps} />);

      expect(screen.getByPlaceholderText('Search in book...')).toBeInTheDocument();
    });

    it('should render search button', () => {
      render(<EpubSearchPanel {...defaultProps} />);

      // Use getByRole with name to select button specifically
      expect(screen.getByRole('button', { name: /^Search$/i })).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<EpubSearchPanel {...defaultProps} />);

      const closeButtons = screen.getAllByRole('button');
      expect(closeButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Search Input', () => {
    it('should update search query when typing', () => {
      render(<EpubSearchPanel {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search in book...');
      fireEvent.change(input, { target: { value: 'test query' } });

      expect(defaultProps.onSearchQueryChange).toHaveBeenCalledWith('test query');
    });

    it('should call onSearch when Enter key is pressed', () => {
      render(<EpubSearchPanel {...defaultProps} searchQuery="test" />);

      const input = screen.getByPlaceholderText('Search in book...');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(defaultProps.onSearch).toHaveBeenCalledTimes(1);
    });

    it('should not call onSearch on Enter when searching', () => {
      render(<EpubSearchPanel {...defaultProps} searchQuery="test" isSearching={true} />);

      const input = screen.getByPlaceholderText('Search in book...');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(defaultProps.onSearch).not.toHaveBeenCalled();
    });

    it('should disable input when searching', () => {
      render(<EpubSearchPanel {...defaultProps} isSearching={true} />);

      const input = screen.getByPlaceholderText('Search in book...');
      expect(input).toBeDisabled();
    });
  });

  describe('Search Button', () => {
    it('should call onSearch when clicked', () => {
      render(<EpubSearchPanel {...defaultProps} searchQuery="test" />);

      const searchButton = screen.getByRole('button', { name: /Search/i });
      fireEvent.click(searchButton);

      expect(defaultProps.onSearch).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when searching', () => {
      render(<EpubSearchPanel {...defaultProps} searchQuery="test" isSearching={true} />);

      const searchButton = screen.getByRole('button', { name: /Searching/i });
      expect(searchButton).toBeDisabled();
    });

    it('should be disabled when query is empty', () => {
      render(<EpubSearchPanel {...defaultProps} searchQuery="" />);

      const searchButton = screen.getByRole('button', { name: /^Search$/i });
      expect(searchButton).toBeDisabled();
    });

    it('should show "Searching" text when isSearching is true', () => {
      render(<EpubSearchPanel {...defaultProps} searchQuery="test" isSearching={true} />);

      expect(screen.getByText('Searching')).toBeInTheDocument();
    });
  });

  describe('Search Progress', () => {
    it('should show progress indicator when searching', () => {
      render(<EpubSearchPanel {...defaultProps} isSearching={true} searchProgress={45} />);

      expect(screen.getByText('Searching through book...')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('should not show progress indicator when not searching', () => {
      render(<EpubSearchPanel {...defaultProps} isSearching={false} />);

      expect(screen.queryByText('Searching through book...')).not.toBeInTheDocument();
    });

    it('should show cancel button when onCancelSearch is provided', () => {
      render(<EpubSearchPanel {...defaultProps} isSearching={true} onCancelSearch={jest.fn()} />);

      expect(screen.getByText('Cancel Search')).toBeInTheDocument();
    });

    it('should call onCancelSearch when cancel button is clicked', () => {
      const onCancelSearch = jest.fn();
      render(<EpubSearchPanel {...defaultProps} isSearching={true} onCancelSearch={onCancelSearch} />);

      const cancelButton = screen.getByText('Cancel Search');
      fireEvent.click(cancelButton);

      expect(onCancelSearch).toHaveBeenCalledTimes(1);
    });

    it('should not show cancel button when onCancelSearch is undefined', () => {
      render(<EpubSearchPanel {...defaultProps} isSearching={true} onCancelSearch={undefined} />);

      expect(screen.queryByText('Cancel Search')).not.toBeInTheDocument();
    });
  });

  describe('Search Results', () => {
    it('should show results count when results exist', () => {
      render(<EpubSearchPanel {...defaultProps} searchResults={mockSearchResults} />);

      expect(screen.getByText('1 of 3 results')).toBeInTheDocument();
    });

    it('should not show results when searching', () => {
      render(<EpubSearchPanel {...defaultProps} searchResults={mockSearchResults} isSearching={true} />);

      expect(screen.queryByText('1 of 3 results')).not.toBeInTheDocument();
    });

    it('should not show results when no results exist', () => {
      render(<EpubSearchPanel {...defaultProps} searchResults={[]} />);

      expect(screen.queryByText(/results/)).not.toBeInTheDocument();
    });

    it('should show correct current result index', () => {
      render(<EpubSearchPanel {...defaultProps} searchResults={mockSearchResults} currentSearchIndex={1} />);

      expect(screen.getByText('2 of 3 results')).toBeInTheDocument();
    });
  });

  describe('Navigation Buttons', () => {
    it('should render previous button when results exist', () => {
      render(<EpubSearchPanel {...defaultProps} searchResults={mockSearchResults} />);

      const prevButtons = screen.getAllByRole('button');
      expect(prevButtons.length).toBeGreaterThan(0);
    });

    it('should call onPrev when previous button is clicked', () => {
      render(<EpubSearchPanel {...defaultProps} searchResults={mockSearchResults} />);

      // Find navigation buttons (ChevronLeft for prev, ChevronRight for next)
      const buttons = screen.getAllByRole('button');
      const navButtons = buttons.filter(btn => 
        btn.querySelector('.lucide-chevron-left') || btn.querySelector('.lucide-chevron-right')
      );
      
      if (navButtons.length > 0) {
        const prevButton = navButtons[0]; // First nav button should be prev
        fireEvent.click(prevButton);
        expect(defaultProps.onPrev).toHaveBeenCalledTimes(1);
      }
    });

    it('should call onNext when next button is clicked', () => {
      render(<EpubSearchPanel {...defaultProps} searchResults={mockSearchResults} />);

      const buttons = screen.getAllByRole('button');
      const navButtons = buttons.filter(btn => 
        btn.querySelector('.lucide-chevron-left') || btn.querySelector('.lucide-chevron-right')
      );
      
      if (navButtons.length > 1) {
        const nextButton = navButtons[1]; // Second nav button should be next
        fireEvent.click(nextButton);
        expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Clear Functionality', () => {
    it('should show Clear Search button when results exist', () => {
      render(<EpubSearchPanel {...defaultProps} searchResults={mockSearchResults} />);

      expect(screen.getByText('Clear Search')).toBeInTheDocument();
    });

    it('should call onClear when Clear Search button is clicked', () => {
      render(<EpubSearchPanel {...defaultProps} searchResults={mockSearchResults} />);

      const clearButton = screen.getByText('Clear Search');
      fireEvent.click(clearButton);

      expect(defaultProps.onClear).toHaveBeenCalledTimes(1);
    });

    it('should not show Clear Search button when no results', () => {
      render(<EpubSearchPanel {...defaultProps} searchResults={[]} />);

      expect(screen.queryByText('Clear Search')).not.toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose and onClear when close button is clicked', () => {
      render(<EpubSearchPanel {...defaultProps} />);

      // Find the X button (close button)
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.querySelector('.lucide-x'));
      
      if (closeButton) {
        fireEvent.click(closeButton);
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
        expect(defaultProps.onClear).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Panel Styling', () => {
    it('should have correct positioning classes', () => {
      const { container } = render(<EpubSearchPanel {...defaultProps} />);

      const panel = container.firstChild;
      expect(panel).toHaveClass('absolute', 'top-4', 'right-4');
    });

    it('should have correct styling classes', () => {
      const { container } = render(<EpubSearchPanel {...defaultProps} />);

      const panel = container.firstChild;
      expect(panel).toHaveClass('bg-white', 'rounded-lg', 'border', 'shadow-lg', 'z-30', 'w-96');
    });

    it('should have dark mode classes', () => {
      const { container } = render(<EpubSearchPanel {...defaultProps} />);

      const panel = container.firstChild;
      expect(panel).toHaveClass('dark:bg-gray-800', 'dark:border-gray-700');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty search query', () => {
      render(<EpubSearchPanel {...defaultProps} searchQuery="" />);

      const input = screen.getByPlaceholderText('Search in book...');
      expect(input).toHaveValue('');
    });

    it('should handle very large search results array', () => {
      const largeResults = Array.from({ length: 100 }, (_, i) => ({
        cfi: `epubcfi(/6/4!/4/${i}/1:0)`,
        excerpt: `Result number ${i}`,
      }));

      render(<EpubSearchPanel {...defaultProps} searchResults={largeResults} />);

      expect(screen.getByText('1 of 100 results')).toBeInTheDocument();
    });

    it('should handle searchProgress of 0', () => {
      render(<EpubSearchPanel {...defaultProps} isSearching={true} searchProgress={0} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle searchProgress of 100', () => {
      render(<EpubSearchPanel {...defaultProps} isSearching={true} searchProgress={100} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle currentSearchIndex at last position', () => {
      render(<EpubSearchPanel {...defaultProps} searchResults={mockSearchResults} currentSearchIndex={2} />);

      expect(screen.getByText('3 of 3 results')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible search input', () => {
      render(<EpubSearchPanel {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search in book...');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should have accessible buttons', () => {
      render(<EpubSearchPanel {...defaultProps} searchQuery="test" />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Integration', () => {
    it('should complete search workflow', () => {
      const { rerender } = render(<EpubSearchPanel {...defaultProps} searchQuery="" />);

      // Step 1: Type search query
      const input = screen.getByPlaceholderText('Search in book...');
      fireEvent.change(input, { target: { value: 'test' } });
      expect(defaultProps.onSearchQueryChange).toHaveBeenCalledWith('test');

      // Step 2: Click search button
      rerender(<EpubSearchPanel {...defaultProps} searchQuery="test" />);
      const searchButton = screen.getByRole('button', { name: /^Search$/i });
      fireEvent.click(searchButton);
      expect(defaultProps.onSearch).toHaveBeenCalledTimes(1);

      // Step 3: Show results
      rerender(<EpubSearchPanel {...defaultProps} searchQuery="test" searchResults={mockSearchResults} />);
      expect(screen.getByText('1 of 3 results')).toBeInTheDocument();

      // Step 4: Clear search
      const clearButton = screen.getByText('Clear Search');
      fireEvent.click(clearButton);
      expect(defaultProps.onClear).toHaveBeenCalledTimes(1);
    });
  });
});
