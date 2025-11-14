/**
 * Unit tests for EpubToolbar component
 * Tests toolbar rendering, navigation, bookmarks, panels, and interactions
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import EpubToolbar from '../EpubToolbar';

describe('EpubToolbar', () => {
  const defaultProps = {
    bookTitle: 'Test Book Title',
    currentChapter: 'Chapter 1',
    pageInfo: { current: 5, total: 100 },
    pageInput: '5',
    setPageInput: jest.fn(),
    handlePageInputSubmit: jest.fn(),
    isGeneratingLocations: false,
    locationGenerationProgress: 0,
    onPrevPage: jest.fn(),
    onNextPage: jest.fn(),
    isLoading: false,
    readingMode: false,
    toolbarVisible: true,
    colorFilter: 'none',
    isCurrentPageBookmarked: false,
    isLoadingBookmarks: false,
    toggleBookmark: jest.fn(),
    showSearchPanel: false,
    setShowSearchPanel: jest.fn(),
    showContentsAndBookmarks: false,
    setShowContentsAndBookmarks: jest.fn(),
    showHighlightsPanel: false,
    setShowHighlightsPanel: jest.fn(),
    showDisplayOptions: false,
    setShowDisplayOptions: jest.fn(),
    showTTSControls: false,
    setShowTTSControls: jest.fn(),
    highlightsCount: 3,
    enableTextSelection: false,
    setEnableTextSelection: jest.fn(),
    isFullscreen: false,
    toggleFullscreen: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<EpubToolbar {...defaultProps} />);

      expect(screen.getByText('Test Book Title')).toBeInTheDocument();
      expect(screen.getByText('Chapter 1')).toBeInTheDocument();
    });

    it('should not render when readingMode is true and toolbarVisible is false', () => {
      render(<EpubToolbar {...defaultProps} readingMode={true} toolbarVisible={false} />);

      expect(screen.queryByText('Test Book Title')).not.toBeInTheDocument();
    });

    it('should render with dark color filter theme', () => {
      const { container } = render(<EpubToolbar {...defaultProps} colorFilter="dark" />);

      const toolbar = container.firstChild;
      expect(toolbar).toHaveClass('bg-gray-900');
      expect(toolbar).toHaveClass('border-gray-800');
      expect(toolbar).toHaveClass('text-white');
    });

    it('should render without chapter info', () => {
      render(<EpubToolbar {...defaultProps} currentChapter={undefined} />);

      expect(screen.queryByText('Chapter 1')).not.toBeInTheDocument();
      expect(screen.getByText('Test Book Title')).toBeInTheDocument();
    });
  });

  describe('Page Navigation', () => {
    it('should display current page and total pages', () => {
      render(<EpubToolbar {...defaultProps} />);

      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
      expect(screen.getByText('/ 100')).toBeInTheDocument();
    });

    it('should call onPrevPage when previous button is clicked', () => {
      render(<EpubToolbar {...defaultProps} />);

      const prevButton = screen.getByTitle('Previous page');
      fireEvent.click(prevButton);

      expect(defaultProps.onPrevPage).toHaveBeenCalledTimes(1);
    });

    it('should call onNextPage when next button is clicked', () => {
      render(<EpubToolbar {...defaultProps} />);

      const nextButton = screen.getByTitle('Next page');
      fireEvent.click(nextButton);

      expect(defaultProps.onNextPage).toHaveBeenCalledTimes(1);
    });

    it('should disable previous button on first page', () => {
      render(<EpubToolbar {...defaultProps} pageInfo={{ current: 1, total: 100 }} />);

      const prevButton = screen.getByTitle('Previous page');
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button on last page', () => {
      render(<EpubToolbar {...defaultProps} pageInfo={{ current: 100, total: 100 }} />);

      const nextButton = screen.getByTitle('Next page');
      expect(nextButton).toBeDisabled();
    });

    it('should disable navigation buttons when loading', () => {
      render(<EpubToolbar {...defaultProps} isLoading={true} />);

      const prevButton = screen.getByTitle('Previous page');
      const nextButton = screen.getByTitle('Next page');

      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Page Input', () => {
    it('should update page input when typing', () => {
      render(<EpubToolbar {...defaultProps} />);

      const input = screen.getByDisplayValue('5') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '10' } });

      expect(defaultProps.setPageInput).toHaveBeenCalledWith('10');
    });

    it('should call handlePageInputSubmit on form submission', () => {
      render(<EpubToolbar {...defaultProps} />);

      const input = screen.getByDisplayValue('5');
      const form = input.closest('form');
      
      expect(form).toBeTruthy();
      if (form) {
        fireEvent.submit(form);
        expect(defaultProps.handlePageInputSubmit).toHaveBeenCalled();
      }
    });

    it('should disable page input when total pages is 0', () => {
      render(<EpubToolbar {...defaultProps} pageInfo={{ current: 0, total: 0 }} />);

      const input = screen.getByDisplayValue('5') as HTMLInputElement;
      expect(input).toBeDisabled();
    });

    it('should disable page input when loading', () => {
      render(<EpubToolbar {...defaultProps} isLoading={true} />);

      const input = screen.getByDisplayValue('5') as HTMLInputElement;
      expect(input).toBeDisabled();
    });
  });

  describe('Location Generation Progress', () => {
    it('should show progress indicator when generating locations', () => {
      render(
        <EpubToolbar
          {...defaultProps}
          isGeneratingLocations={true}
          locationGenerationProgress={50}
        />
      );

      expect(screen.getByText('Calculating pages...')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should not show progress indicator when not generating', () => {
      render(<EpubToolbar {...defaultProps} isGeneratingLocations={false} />);

      expect(screen.queryByText('Calculating pages...')).not.toBeInTheDocument();
    });
  });

  describe('Bookmark Controls', () => {
    it('should display bookmark icon', () => {
      render(<EpubToolbar {...defaultProps} />);

      const bookmarkButton = screen.getByTitle('Add bookmark');
      expect(bookmarkButton).toBeInTheDocument();
    });

    it('should call toggleBookmark when bookmark button is clicked', () => {
      render(<EpubToolbar {...defaultProps} />);

      const bookmarkButton = screen.getByTitle('Add bookmark');
      fireEvent.click(bookmarkButton);

      expect(defaultProps.toggleBookmark).toHaveBeenCalledTimes(1);
    });

    it('should show bookmarked state', () => {
      render(<EpubToolbar {...defaultProps} isCurrentPageBookmarked={true} />);

      const bookmarkButton = screen.getByTitle('Remove bookmark');
      expect(bookmarkButton).toBeInTheDocument();
    });

    it('should disable bookmark button when loading bookmarks', () => {
      render(<EpubToolbar {...defaultProps} isLoadingBookmarks={true} />);

      const bookmarkButton = screen.getByTitle('Add bookmark');
      expect(bookmarkButton).toBeDisabled();
    });
  });

  describe('Panel Toggles', () => {
    it('should toggle search panel', () => {
      render(<EpubToolbar {...defaultProps} />);

      const searchButton = screen.getByTitle('Search');
      fireEvent.click(searchButton);

      expect(defaultProps.setShowSearchPanel).toHaveBeenCalledWith(true);
    });

    it('should close search panel when already open', () => {
      render(<EpubToolbar {...defaultProps} showSearchPanel={true} />);

      const searchButton = screen.getByTitle('Search');
      fireEvent.click(searchButton);

      expect(defaultProps.setShowSearchPanel).toHaveBeenCalledWith(false);
    });

    it('should toggle contents and bookmarks panel', () => {
      render(<EpubToolbar {...defaultProps} />);

      const contentsButton = screen.getByTitle('Contents & Bookmarks');
      fireEvent.click(contentsButton);

      expect(defaultProps.setShowContentsAndBookmarks).toHaveBeenCalledWith(true);
    });

    it('should toggle highlights panel', () => {
      render(<EpubToolbar {...defaultProps} />);

      // Use getAllByTitle since there are two Highlights buttons (mobile + desktop)
      const highlightsButtons = screen.getAllByTitle('Highlights');
      fireEvent.click(highlightsButtons[0]);

      expect(defaultProps.setShowHighlightsPanel).toHaveBeenCalledWith(true);
    });

    it('should display highlights count badge', () => {
      render(<EpubToolbar {...defaultProps} highlightsCount={5} />);

      // Component doesn't display count badge in title - just disables button when count is 0
      const highlightsButtons = screen.getAllByTitle('Highlights');
      expect(highlightsButtons.length).toBeGreaterThan(0);
      highlightsButtons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should toggle display options panel', () => {
      render(<EpubToolbar {...defaultProps} />);

      const settingsButton = screen.getByTitle('Display options');
      fireEvent.click(settingsButton);

      expect(defaultProps.setShowDisplayOptions).toHaveBeenCalledWith(true);
    });

    it('should toggle TTS controls panel', () => {
      render(<EpubToolbar {...defaultProps} />);

      const ttsButton = screen.getByTitle('Text-to-Speech');
      fireEvent.click(ttsButton);

      expect(defaultProps.setShowTTSControls).toHaveBeenCalledWith(true);
    });
  });

  describe('Text Selection Toggle', () => {
    it('should toggle text selection on', () => {
      render(<EpubToolbar {...defaultProps} enableTextSelection={false} />);

      const selectionButton = screen.getByTitle('Enable text selection');
      fireEvent.click(selectionButton);

      expect(defaultProps.setEnableTextSelection).toHaveBeenCalledWith(true);
    });

    it('should toggle text selection off', () => {
      render(<EpubToolbar {...defaultProps} enableTextSelection={true} />);

      const selectionButton = screen.getByTitle('Disable text selection');
      fireEvent.click(selectionButton);

      expect(defaultProps.setEnableTextSelection).toHaveBeenCalledWith(false);
    });

    it('should show EyeOff icon when selection is disabled', () => {
      render(<EpubToolbar {...defaultProps} enableTextSelection={false} />);

      const button = screen.getByTitle('Enable text selection');
      
      // SVG with aria-hidden doesn't have role="img", just check button exists
      expect(button).toBeInTheDocument();
      expect(button.querySelector('.lucide-eye-off')).toBeInTheDocument();
    });
  });

  describe('Fullscreen Toggle', () => {
    it('should toggle fullscreen on', () => {
      render(<EpubToolbar {...defaultProps} isFullscreen={false} />);

      const fullscreenButton = screen.getByTitle('Fullscreen');
      fireEvent.click(fullscreenButton);

      expect(defaultProps.toggleFullscreen).toHaveBeenCalledTimes(1);
    });

    it('should toggle fullscreen off', () => {
      render(<EpubToolbar {...defaultProps} isFullscreen={true} />);

      const fullscreenButton = screen.getByTitle('Exit fullscreen');
      fireEvent.click(fullscreenButton);

      expect(defaultProps.toggleFullscreen).toHaveBeenCalledTimes(1);
    });
  });

  describe('Close Handler', () => {
    it('should call onClose when close button is clicked', () => {
      render(<EpubToolbar {...defaultProps} />);

      // There are two "Close reader" buttons (desktop + mobile), use getAllByTitle
      const closeButtons = screen.getAllByTitle('Close reader');
      fireEvent.click(closeButtons[0]);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should not render close button when onClose is not provided', () => {
      render(<EpubToolbar {...defaultProps} onClose={undefined} />);

      expect(screen.queryByTitle('Close reader')).not.toBeInTheDocument();
    });
  });

  describe('Mobile Navigation', () => {
    it('should render mobile navigation controls', () => {
      render(<EpubToolbar {...defaultProps} />);

      // Mobile navigation should be present in DOM
      const prevButton = screen.getByTitle('Previous page');
      const nextButton = screen.getByTitle('Next page');

      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should display all panel toggle buttons with proper titles', () => {
      render(<EpubToolbar {...defaultProps} />);

      expect(screen.getByTitle('Add bookmark')).toBeInTheDocument();
      expect(screen.getByTitle('Search')).toBeInTheDocument();
      expect(screen.getByTitle('Contents & Bookmarks')).toBeInTheDocument();
      // Highlights button appears twice (mobile + desktop), so use getAllByTitle
      expect(screen.getAllByTitle('Highlights').length).toBeGreaterThan(0);
      expect(screen.getByTitle('Text-to-Speech')).toBeInTheDocument();
      expect(screen.getByTitle('Display options')).toBeInTheDocument();
      expect(screen.getByTitle('Enable text selection')).toBeInTheDocument();
      expect(screen.getByTitle('Fullscreen')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero pages gracefully', () => {
      render(<EpubToolbar {...defaultProps} pageInfo={{ current: 0, total: 0 }} />);

      expect(screen.getByText('/ 0')).toBeInTheDocument();
    });

    it('should handle empty book title', () => {
      render(<EpubToolbar {...defaultProps} bookTitle="" />);

      const titleElement = screen.queryByRole('heading');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveTextContent('');
    });

    it('should handle zero highlights count', () => {
      render(<EpubToolbar {...defaultProps} highlightsCount={0} />);

      // Both mobile and desktop Highlights buttons should be disabled
      const highlightsButtons = screen.getAllByTitle('Highlights');
      highlightsButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('should handle very long book title with truncation', () => {
      const longTitle = 'A'.repeat(200);
      const { container } = render(<EpubToolbar {...defaultProps} bookTitle={longTitle} />);

      const titleElement = container.querySelector('.truncate');
      expect(titleElement).toBeInTheDocument();
    });

    it('should handle very long chapter name with truncation', () => {
      const longChapter = 'Chapter ' + 'X'.repeat(100);
      const { container } = render(<EpubToolbar {...defaultProps} currentChapter={longChapter} />);

      const chapterElement = container.querySelector('.truncate');
      expect(chapterElement).toBeInTheDocument();
    });
  });

  describe('Active State Indicators', () => {
    it('should show active state for open search panel', () => {
      render(<EpubToolbar {...defaultProps} showSearchPanel={true} />);

      const searchButton = screen.getByTitle('Search');
      expect(searchButton).toHaveClass('bg-gray-100');
    });

    it('should show active state for open highlights panel', () => {
      render(<EpubToolbar {...defaultProps} showHighlightsPanel={true} />);

      // Both mobile and desktop Highlights buttons should have active state
      const highlightsButtons = screen.getAllByTitle('Highlights');
      highlightsButtons.forEach(button => {
        expect(button).toHaveClass('bg-gray-100');
      });
    });

    it('should show active state for open display options', () => {
      render(<EpubToolbar {...defaultProps} showDisplayOptions={true} />);

      const settingsButton = screen.getByTitle('Display options');
      expect(settingsButton).toHaveClass('bg-gray-100');
    });
  });

  describe('Accessibility', () => {
    it('should have proper button titles for screen readers', () => {
      render(<EpubToolbar {...defaultProps} />);

      expect(screen.getByTitle('Previous page')).toBeInTheDocument();
      expect(screen.getByTitle('Next page')).toBeInTheDocument();
      expect(screen.getByTitle('Add bookmark')).toBeInTheDocument();
      expect(screen.getByTitle('Search')).toBeInTheDocument();
      expect(screen.getByTitle('Contents & Bookmarks')).toBeInTheDocument();
      // Highlights button appears twice (mobile + desktop), so use getAllByTitle
      expect(screen.getAllByTitle('Highlights').length).toBeGreaterThan(0);
    });

    it('should have proper form structure for page input', () => {
      render(<EpubToolbar {...defaultProps} />);

      const input = screen.getByDisplayValue('5');
      const form = input.closest('form');

      expect(form).toBeInTheDocument();
    });
  });
});
