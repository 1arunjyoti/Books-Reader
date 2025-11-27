import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EpubTocPanel from '../EpubTocPanel';
import type { NavItem } from 'epubjs';

describe('EpubTocPanel', () => {
  const mockToc: NavItem[] = [
    { id: 'chap1', href: 'chapter1.html', label: 'Chapter 1' },
    { id: 'chap2', href: 'chapter2.html', label: 'Chapter 2' },
    { id: 'chap3', href: 'chapter3.html', label: 'Chapter 3' },
    { id: 'chap4', href: 'chapter4.html', label: 'Chapter 4: A Very Long Chapter Title That Should Wrap' },
  ];

  const defaultProps = {
    toc: mockToc,
    onItemClick: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the panel with heading', () => {
      render(<EpubTocPanel {...defaultProps} />);
      
      expect(screen.getByText('Table of Contents')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<EpubTocPanel {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should render all TOC items', () => {
      render(<EpubTocPanel {...defaultProps} />);
      
      expect(screen.getByText('Chapter 1')).toBeInTheDocument();
      expect(screen.getByText('Chapter 2')).toBeInTheDocument();
      expect(screen.getByText('Chapter 3')).toBeInTheDocument();
      expect(screen.getByText('Chapter 4: A Very Long Chapter Title That Should Wrap')).toBeInTheDocument();
    });

    it('should render correct number of TOC items', () => {
      render(<EpubTocPanel {...defaultProps} />);
      
      const tocButtons = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Chapter')
      );
      expect(tocButtons.length).toBe(mockToc.length);
    });

    it('should render panel with correct styling classes', () => {
      const { container } = render(<EpubTocPanel {...defaultProps} />);
      
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('absolute', 'top-16', 'left-0', 'h-full', 'w-80');
      expect(panel).toHaveClass('bg-white/90', 'dark:bg-gray-900/90');
      expect(panel).toHaveClass('border-r', 'border-gray-200', 'dark:border-gray-700');
    });
  });

  describe('TOC Item Interaction', () => {
    it('should call onItemClick when clicking a TOC item', () => {
      render(<EpubTocPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Chapter 1'));
      
      expect(defaultProps.onItemClick).toHaveBeenCalledWith('chapter1.html');
      expect(defaultProps.onItemClick).toHaveBeenCalledTimes(1);
    });

    it('should call onItemClick with correct href for different items', () => {
      render(<EpubTocPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Chapter 2'));
      expect(defaultProps.onItemClick).toHaveBeenCalledWith('chapter2.html');
      
      fireEvent.click(screen.getByText('Chapter 3'));
      expect(defaultProps.onItemClick).toHaveBeenCalledWith('chapter3.html');
    });

    it('should handle clicking multiple items sequentially', () => {
      render(<EpubTocPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Chapter 1'));
      fireEvent.click(screen.getByText('Chapter 2'));
      fireEvent.click(screen.getByText('Chapter 3'));
      
      expect(defaultProps.onItemClick).toHaveBeenCalledTimes(3);
    });

    it('should handle clicking long chapter titles', () => {
      render(<EpubTocPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Chapter 4: A Very Long Chapter Title That Should Wrap'));
      
      expect(defaultProps.onItemClick).toHaveBeenCalledWith('chapter4.html');
    });
  });

  describe('Empty TOC State', () => {
    it('should display empty state message when TOC is empty', () => {
      render(<EpubTocPanel {...defaultProps} toc={[]} />);
      
      expect(screen.getByText('No table of contents available')).toBeInTheDocument();
    });

    it('should not render any TOC items when list is empty', () => {
      render(<EpubTocPanel {...defaultProps} toc={[]} />);
      
      const buttons = screen.getAllByRole('button');
      // Only close button should exist
      expect(buttons.length).toBe(1);
    });

    it('should center empty state text', () => {
      render(<EpubTocPanel {...defaultProps} toc={[]} />);
      
      const emptyMessage = screen.getByText('No table of contents available');
      // Parent handles centering and color
      expect(emptyMessage.parentElement).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center', 'text-gray-500', 'dark:text-gray-400');
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', () => {
      render(<EpubTocPanel {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.querySelector('.lucide-x'));
      
      expect(closeButton).toBeInTheDocument();
      fireEvent.click(closeButton!);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Panel Styling', () => {
    it('should have fixed positioning classes', () => {
      const { container } = render(<EpubTocPanel {...defaultProps} />);
      
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('absolute');
    });

    it('should have shadow and z-index classes', () => {
      const { container } = render(<EpubTocPanel {...defaultProps} />);
      
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('shadow-2xl', 'z-20');
    });

    it('should have overflow-auto class for scrolling', () => {
      const { container } = render(<EpubTocPanel {...defaultProps} />);
      
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('overflow-auto');
    });

    it('should have sticky header', () => {
      const { container } = render(<EpubTocPanel {...defaultProps} />);
      
      const header = container.querySelector('.sticky');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('sticky', 'top-0');
    });
  });

  describe('Edge Cases', () => {
    it('should handle TOC with single item', () => {
      const singleToc: NavItem[] = [{ id: 'intro', href: 'intro.html', label: 'Introduction' }];
      render(<EpubTocPanel {...defaultProps} toc={singleToc} />);
      
      expect(screen.getByText('Introduction')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Introduction'));
      expect(defaultProps.onItemClick).toHaveBeenCalledWith('intro.html');
    });

    it('should handle TOC with many items', () => {
      const manyToc: NavItem[] = Array.from({ length: 50 }, (_, i) => ({
        id: `chap${i}`,
        href: `chapter${i}.html`,
        label: `Chapter ${i + 1}`,
      }));
      render(<EpubTocPanel {...defaultProps} toc={manyToc} />);
      
      expect(screen.getByText('Chapter 1')).toBeInTheDocument();
      expect(screen.getByText('Chapter 50')).toBeInTheDocument();
    });

    it('should handle TOC items with special characters', () => {
      const specialToc: NavItem[] = [
        { id: 'chap1', href: 'chapter1.html', label: 'Chapter 1: The Beginning & The End' },
        { id: 'chap2', href: 'chapter2.html', label: 'Chapter 2: "Quotes" & More' },
      ];
      render(<EpubTocPanel {...defaultProps} toc={specialToc} />);
      
      expect(screen.getByText('Chapter 1: The Beginning & The End')).toBeInTheDocument();
      expect(screen.getByText('Chapter 2: "Quotes" & More')).toBeInTheDocument();
    });

    it('should handle TOC items with empty labels', () => {
      const emptyLabelToc: NavItem[] = [
        { id: 'chap1', href: 'chapter1.html', label: '' },
        { id: 'chap2', href: 'chapter2.html', label: 'Chapter 2' },
      ];
      render(<EpubTocPanel {...defaultProps} toc={emptyLabelToc} />);
      
      const tocButtons = screen.getAllByRole('button').filter(btn => 
        !btn.querySelector('.lucide-x')
      );
      expect(tocButtons.length).toBe(2);
    });

    it('should handle href with query parameters', () => {
      const queryToc: NavItem[] = [
        { id: 'chap1', href: 'chapter1.html?section=intro', label: 'Introduction' },
      ];
      render(<EpubTocPanel {...defaultProps} toc={queryToc} />);
      
      fireEvent.click(screen.getByText('Introduction'));
      expect(defaultProps.onItemClick).toHaveBeenCalledWith('chapter1.html?section=intro');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<EpubTocPanel {...defaultProps} />);
      
      const heading = screen.getByText('Table of Contents');
      expect(heading).toHaveClass('text-lg', 'font-semibold');
    });

    it('should have all TOC items as buttons', () => {
      render(<EpubTocPanel {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      // Should have TOC items + close button
      expect(buttons.length).toBe(mockToc.length + 1);
    });

    it('should have text alignment for TOC items', () => {
      render(<EpubTocPanel {...defaultProps} />);
      
      const chapter1Button = screen.getByText('Chapter 1').closest('button');
      expect(chapter1Button).toHaveClass('text-left');
    });
  });

  describe('Integration', () => {
    it('should support full workflow: render -> click item -> close', () => {
      render(<EpubTocPanel {...defaultProps} />);
      
      // Initial state
      expect(screen.getByText('Table of Contents')).toBeInTheDocument();
      
      // Click TOC item
      fireEvent.click(screen.getByText('Chapter 2'));
      expect(defaultProps.onItemClick).toHaveBeenCalledWith('chapter2.html');
      
      // Close panel
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.querySelector('.lucide-x'));
      fireEvent.click(closeButton!);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should support navigating through multiple chapters', () => {
      render(<EpubTocPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Chapter 1'));
      expect(defaultProps.onItemClick).toHaveBeenLastCalledWith('chapter1.html');
      
      fireEvent.click(screen.getByText('Chapter 3'));
      expect(defaultProps.onItemClick).toHaveBeenLastCalledWith('chapter3.html');
      
      fireEvent.click(screen.getByText('Chapter 2'));
      expect(defaultProps.onItemClick).toHaveBeenLastCalledWith('chapter2.html');
      
      expect(defaultProps.onItemClick).toHaveBeenCalledTimes(3);
    });
  });
});
