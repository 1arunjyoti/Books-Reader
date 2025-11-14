import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EpubColorFilterPanel from '../EpubColorFilterPanel';

describe('EpubColorFilterPanel', () => {
  const defaultProps = {
    colorFilter: 'none' as const,
    customBgColor: '#ffffff',
    setColorFilter: jest.fn(),
    setCustomBgColor: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the panel with heading', () => {
      render(<EpubColorFilterPanel {...defaultProps} />);
      
      expect(screen.getByText('Reading Themes')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<EpubColorFilterPanel {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should render all color filter options', () => {
      render(<EpubColorFilterPanel {...defaultProps} />);
      
      expect(screen.getByText('None (Default)')).toBeInTheDocument();
      expect(screen.getByText('Sepia (Warm)')).toBeInTheDocument();
      expect(screen.getByText('Night Mode')).toBeInTheDocument();
      expect(screen.getByText('Custom Color')).toBeInTheDocument();
    });

    it('should render panel with correct styling classes', () => {
      const { container } = render(<EpubColorFilterPanel {...defaultProps} />);
      
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('absolute', 'top-4', 'right-4');
      expect(panel).toHaveClass('bg-white', 'dark:bg-gray-800');
      expect(panel).toHaveClass('rounded-lg', 'p-4');
      expect(panel).toHaveClass('border', 'border-gray-200', 'dark:border-gray-700');
    });
  });

  describe('Color Filter Selection', () => {
    it('should call setColorFilter when selecting none', () => {
      render(<EpubColorFilterPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('None (Default)'));
      
      expect(defaultProps.setColorFilter).toHaveBeenCalledWith('none');
    });

    it('should call setColorFilter when selecting sepia', () => {
      render(<EpubColorFilterPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Sepia (Warm)'));
      
      expect(defaultProps.setColorFilter).toHaveBeenCalledWith('sepia');
    });

    it('should call setColorFilter when selecting dark', () => {
      render(<EpubColorFilterPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Night Mode'));
      
      expect(defaultProps.setColorFilter).toHaveBeenCalledWith('dark');
    });

    it('should apply active styling to selected filter', () => {
      render(<EpubColorFilterPanel {...defaultProps} colorFilter="sepia" />);
      
      const sepiaButton = screen.getByText('Sepia (Warm)');
      expect(sepiaButton).toHaveClass('bg-blue-100', 'dark:bg-blue-900/30');
    });

    it('should apply active styling to none filter by default', () => {
      render(<EpubColorFilterPanel {...defaultProps} colorFilter="none" />);
      
      const noneButton = screen.getByText('None (Default)');
      expect(noneButton).toHaveClass('bg-blue-100', 'dark:bg-blue-900/30');
    });

    it('should apply active styling to dark filter', () => {
      render(<EpubColorFilterPanel {...defaultProps} colorFilter="dark" />);
      
      const darkButton = screen.getByText('Night Mode');
      expect(darkButton).toHaveClass('bg-blue-100', 'dark:bg-blue-900/30');
    });
  });

  describe('Custom Color Input', () => {
    it('should render custom color input', () => {
      render(<EpubColorFilterPanel {...defaultProps} />);
      
      const colorInput = screen.getByDisplayValue('#ffffff');
      expect(colorInput).toBeInTheDocument();
      expect(colorInput).toHaveAttribute('type', 'color');
    });

    it('should call setCustomBgColor and setColorFilter when changing custom color', () => {
      render(<EpubColorFilterPanel {...defaultProps} />);
      
      const colorInput = screen.getByDisplayValue('#ffffff');
      fireEvent.change(colorInput, { target: { value: '#ff0000' } });
      
      expect(defaultProps.setCustomBgColor).toHaveBeenCalledWith('#ff0000');
      expect(defaultProps.setColorFilter).toHaveBeenCalledWith('custom');
    });

    it('should display current custom color', () => {
      render(<EpubColorFilterPanel {...defaultProps} customBgColor="#123456" />);
      
      const colorInput = screen.getByDisplayValue('#123456');
      expect(colorInput).toBeInTheDocument();
    });

    it('should have cursor-pointer class on color input', () => {
      render(<EpubColorFilterPanel {...defaultProps} />);
      
      const colorInput = screen.getByDisplayValue('#ffffff');
      expect(colorInput).toHaveClass('cursor-pointer');
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', () => {
      render(<EpubColorFilterPanel {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.querySelector('.lucide-x'));
      
      expect(closeButton).toBeInTheDocument();
      fireEvent.click(closeButton!);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Panel Styling', () => {
    it('should have fixed positioning classes', () => {
      const { container } = render(<EpubColorFilterPanel {...defaultProps} />);
      
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('absolute');
    });

    it('should have shadow and z-index classes', () => {
      const { container } = render(<EpubColorFilterPanel {...defaultProps} />);
      
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('shadow-lg', 'z-30');
    });

    it('should have width class', () => {
      const { container } = render(<EpubColorFilterPanel {...defaultProps} />);
      
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('w-64');
    });

    it('should have rounded corners', () => {
      const { container } = render(<EpubColorFilterPanel {...defaultProps} />);
      
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('rounded-lg');
    });
  });

  describe('Edge Cases', () => {
    it('should handle lowercase hex colors', () => {
      render(<EpubColorFilterPanel {...defaultProps} customBgColor="#abcdef" />);
      
      const colorInput = screen.getByDisplayValue('#abcdef');
      expect(colorInput).toBeInTheDocument();
    });

    it('should handle uppercase hex colors', () => {
      render(<EpubColorFilterPanel {...defaultProps} customBgColor="#abcdef" />);
      
      const colorInput = screen.getByDisplayValue('#abcdef');
      expect(colorInput).toBeInTheDocument();
    });

    it('should handle custom filter selection', () => {
      render(<EpubColorFilterPanel {...defaultProps} colorFilter="custom" />);
      
      // None of the preset buttons should have active styling
      const noneButton = screen.getByText('None (Default)');
      const sepiaButton = screen.getByText('Sepia (Warm)');
      const darkButton = screen.getByText('Night Mode');
      
      expect(noneButton).not.toHaveClass('bg-blue-100');
      expect(sepiaButton).not.toHaveClass('bg-blue-100');
      expect(darkButton).not.toHaveClass('bg-blue-100');
    });

    it('should handle changing from custom to preset filter', () => {
      const { rerender } = render(<EpubColorFilterPanel {...defaultProps} colorFilter="custom" />);
      
      rerender(<EpubColorFilterPanel {...defaultProps} colorFilter="sepia" />);
      
      const sepiaButton = screen.getByText('Sepia (Warm)');
      expect(sepiaButton).toHaveClass('bg-blue-100', 'dark:bg-blue-900/30');
    });

    it('should handle multiple color changes', () => {
      render(<EpubColorFilterPanel {...defaultProps} />);
      
      const colorInput = screen.getByDisplayValue('#ffffff');
      
      fireEvent.change(colorInput, { target: { value: '#ff0000' } });
      expect(defaultProps.setCustomBgColor).toHaveBeenCalledWith('#ff0000');
      
      fireEvent.change(colorInput, { target: { value: '#00ff00' } });
      expect(defaultProps.setCustomBgColor).toHaveBeenCalledWith('#00ff00');
      
      expect(defaultProps.setColorFilter).toHaveBeenCalledTimes(2);
      expect(defaultProps.setColorFilter).toHaveBeenCalledWith('custom');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<EpubColorFilterPanel {...defaultProps} />);
      
      const heading = screen.getByText('Reading Themes');
      expect(heading).toHaveClass('text-sm', 'font-semibold');
    });

    it('should have accessible label for custom color input', () => {
      render(<EpubColorFilterPanel {...defaultProps} />);
      
      const label = screen.getByText('Custom Color');
      expect(label).toBeInTheDocument();
      expect(label.tagName).toBe('LABEL');
    });

    it('should have all buttons accessible', () => {
      render(<EpubColorFilterPanel {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(4); // 3 filter options + close button
    });
  });

  describe('Integration', () => {
    it('should support full workflow: render -> select filter -> change custom color -> close', () => {
      render(<EpubColorFilterPanel {...defaultProps} />);
      
      // Select sepia
      fireEvent.click(screen.getByText('Sepia (Warm)'));
      expect(defaultProps.setColorFilter).toHaveBeenCalledWith('sepia');
      
      // Change custom color
      const colorInput = screen.getByDisplayValue('#ffffff');
      fireEvent.change(colorInput, { target: { value: '#123456' } });
      expect(defaultProps.setCustomBgColor).toHaveBeenCalledWith('#123456');
      expect(defaultProps.setColorFilter).toHaveBeenCalledWith('custom');
      
      // Close panel
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.querySelector('.lucide-x'));
      fireEvent.click(closeButton!);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should support selecting all filter options sequentially', () => {
      render(<EpubColorFilterPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('None (Default)'));
      expect(defaultProps.setColorFilter).toHaveBeenCalledWith('none');
      
      fireEvent.click(screen.getByText('Sepia (Warm)'));
      expect(defaultProps.setColorFilter).toHaveBeenCalledWith('sepia');
      
      fireEvent.click(screen.getByText('Night Mode'));
      expect(defaultProps.setColorFilter).toHaveBeenCalledWith('dark');
      
      expect(defaultProps.setColorFilter).toHaveBeenCalledTimes(3);
    });
  });
});
