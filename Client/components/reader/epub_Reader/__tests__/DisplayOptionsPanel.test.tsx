import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DisplayOptionsPanel from '../DisplayOptionsPanel';

describe('DisplayOptionsPanel', () => {
  const defaultProps = {
    colorFilter: 'none' as const,
    customBgColor: '#ffffff',
    setColorFilter: jest.fn(),
    setCustomBgColor: jest.fn(),
    fontSize: 100,
    increaseFontSize: jest.fn(),
    decreaseFontSize: jest.fn(),
    lineHeight: 1.5,
    increaseLineHeight: jest.fn(),
    decreaseLineHeight: jest.fn(),
    pageLayout: 'single' as const,
    togglePageLayout: jest.fn(),
    fontFamily: 'serif' as const,
    toggleFontFamily: jest.fn(),
    rotation: 0,
    rotatePage: jest.fn(),
    resetRotation: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the panel with heading', () => {
      render(<DisplayOptionsPanel {...defaultProps} />);
      
      expect(screen.getByRole('heading', { name: 'Display Options' })).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<DisplayOptionsPanel {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should render all section headings', () => {
      render(<DisplayOptionsPanel {...defaultProps} />);
      
      expect(screen.getByText('Theme')).toBeInTheDocument();
      expect(screen.getByText('Layout Options')).toBeInTheDocument();
      expect(screen.getByText('Rotation')).toBeInTheDocument();
      expect(screen.getByText('Font Size')).toBeInTheDocument();
      expect(screen.getByText('Line Height')).toBeInTheDocument();
      const fontHeadings = screen.getAllByText('Font');
      expect(fontHeadings.length).toBeGreaterThan(0);
    });

    it('should render panel with correct styling classes', () => {
      const { container } = render(<DisplayOptionsPanel {...defaultProps} />);
      
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('absolute', 'top-16', 'right-0', 'bottom-0', 'w-80');
      expect(panel).toHaveClass('bg-white/90', 'dark:bg-gray-900/90');
      expect(panel).toHaveClass('border-l', 'border-gray-200', 'dark:border-gray-700');
    });
  });

  describe('Color Filter Section', () => {
    it('should render all color filter options', () => {
      render(<DisplayOptionsPanel {...defaultProps} />);
      
      expect(screen.getByText('None (Default)')).toBeInTheDocument();
      expect(screen.getByText('Sepia (Warm)')).toBeInTheDocument();
      expect(screen.getByText('Night Mode')).toBeInTheDocument();
      expect(screen.getByText('Custom Color')).toBeInTheDocument();
    });

    it('should call setColorFilter when selecting none', () => {
      render(<DisplayOptionsPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('None (Default)'));
      
      expect(defaultProps.setColorFilter).toHaveBeenCalledWith('none');
    });

    it('should call setColorFilter when selecting sepia', () => {
      render(<DisplayOptionsPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Sepia (Warm)'));
      
      expect(defaultProps.setColorFilter).toHaveBeenCalledWith('sepia');
    });

    it('should call setColorFilter when selecting dark', () => {
      render(<DisplayOptionsPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Night Mode'));
      
      expect(defaultProps.setColorFilter).toHaveBeenCalledWith('dark');
    });

    it('should render custom color input', () => {
      render(<DisplayOptionsPanel {...defaultProps} />);
      
      const colorInput = screen.getByDisplayValue('#ffffff');
      expect(colorInput).toBeInTheDocument();
      expect(colorInput).toHaveAttribute('type', 'color');
    });

    it('should call setCustomBgColor and setColorFilter when changing custom color', () => {
      render(<DisplayOptionsPanel {...defaultProps} />);
      
      const colorInput = screen.getByDisplayValue('#ffffff');
      fireEvent.change(colorInput, { target: { value: '#ff0000' } });
      
      expect(defaultProps.setCustomBgColor).toHaveBeenCalledWith('#ff0000');
      expect(defaultProps.setColorFilter).toHaveBeenCalledWith('custom');
    });

    it('should apply active styling to selected color filter', () => {
      render(<DisplayOptionsPanel {...defaultProps} colorFilter="sepia" />);
      
      const sepiaButton = screen.getByText('Sepia (Warm)');
      expect(sepiaButton).toHaveClass('bg-blue-100/50', 'dark:bg-blue-900/30');
    });
  });

  describe('Layout Options Section', () => {
    it('should render single and double layout buttons', () => {
      render(<DisplayOptionsPanel {...defaultProps} />);
      
      expect(screen.getByText('Single')).toBeInTheDocument();
      expect(screen.getByText('Double')).toBeInTheDocument();
    });

    it('should call togglePageLayout when clicking double layout', () => {
      render(<DisplayOptionsPanel {...defaultProps} pageLayout="single" />);
      
      fireEvent.click(screen.getByText('Double'));
      
      expect(defaultProps.togglePageLayout).toHaveBeenCalledTimes(1);
    });

    it('should call togglePageLayout when clicking single layout', () => {
      render(<DisplayOptionsPanel {...defaultProps} pageLayout="double" />);
      
      fireEvent.click(screen.getByText('Single'));
      
      expect(defaultProps.togglePageLayout).toHaveBeenCalledTimes(1);
    });

    it('should not toggle when clicking already selected layout', () => {
      render(<DisplayOptionsPanel {...defaultProps} pageLayout="single" />);
      
      fireEvent.click(screen.getByText('Single'));
      
      expect(defaultProps.togglePageLayout).not.toHaveBeenCalled();
    });

    it('should apply active styling to selected layout', () => {
      render(<DisplayOptionsPanel {...defaultProps} pageLayout="double" />);
      
      const doubleButton = screen.getByText('Double');
      expect(doubleButton).toHaveClass('bg-blue-100/50', 'dark:bg-blue-900/30');
    });
  });

  describe('Page Rotation Section', () => {
    it('should render rotate page button with current rotation', () => {
      render(<DisplayOptionsPanel {...defaultProps} rotation={90} />);
      
      expect(screen.getByText(/Rotate Page \(90°\)/)).toBeInTheDocument();
    });

    it('should call rotatePage when clicking rotate button', () => {
      render(<DisplayOptionsPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText(/Rotate Page/));
      
      expect(defaultProps.rotatePage).toHaveBeenCalledTimes(1);
    });

    it('should show reset rotation button when rotation is not 0', () => {
      render(<DisplayOptionsPanel {...defaultProps} rotation={90} />);
      
      expect(screen.getByText('Reset Rotation')).toBeInTheDocument();
    });

    it('should not show reset rotation button when rotation is 0', () => {
      render(<DisplayOptionsPanel {...defaultProps} rotation={0} />);
      
      expect(screen.queryByText('Reset Rotation')).not.toBeInTheDocument();
    });

    it('should call resetRotation when clicking reset button', () => {
      render(<DisplayOptionsPanel {...defaultProps} rotation={90} />);
      
      fireEvent.click(screen.getByText('Reset Rotation'));
      
      expect(defaultProps.resetRotation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Font Size Section', () => {
    it('should display current font size', () => {
      render(<DisplayOptionsPanel {...defaultProps} fontSize={120} />);
      
      expect(screen.getByText('120%')).toBeInTheDocument();
    });

    it('should call increaseFontSize when clicking increase button', () => {
      render(<DisplayOptionsPanel {...defaultProps} />);
      
      const buttons = screen.getAllByTitle('Increase font size');
      fireEvent.click(buttons[0]);
      
      expect(defaultProps.increaseFontSize).toHaveBeenCalledTimes(1);
    });

    it('should call decreaseFontSize when clicking decrease button', () => {
      render(<DisplayOptionsPanel {...defaultProps} />);
      
      const buttons = screen.getAllByTitle('Decrease font size');
      fireEvent.click(buttons[0]);
      
      expect(defaultProps.decreaseFontSize).toHaveBeenCalledTimes(1);
    });
  });

  describe('Line Height Section', () => {
    it('should display current line height', () => {
      render(<DisplayOptionsPanel {...defaultProps} lineHeight={2.0} />);
      
      expect(screen.getByText('2.0')).toBeInTheDocument();
    });

    it('should display line height with one decimal place', () => {
      render(<DisplayOptionsPanel {...defaultProps} lineHeight={1.8} />);
      
      expect(screen.getByText('1.8')).toBeInTheDocument();
    });

    it('should call increaseLineHeight when clicking increase button', () => {
      render(<DisplayOptionsPanel {...defaultProps} />);
      
      const buttons = screen.getAllByTitle('Increase line height');
      fireEvent.click(buttons[0]);
      
      expect(defaultProps.increaseLineHeight).toHaveBeenCalledTimes(1);
    });

    it('should call decreaseLineHeight when clicking decrease button', () => {
      render(<DisplayOptionsPanel {...defaultProps} />);
      
      const buttons = screen.getAllByTitle('Decrease line height');
      fireEvent.click(buttons[0]);
      
      expect(defaultProps.decreaseLineHeight).toHaveBeenCalledTimes(1);
    });
  });

  describe('Font Family Section', () => {
    it('should render serif and sans-serif buttons', () => {
      render(<DisplayOptionsPanel {...defaultProps} />);
      
      expect(screen.getByText('Serif')).toBeInTheDocument();
      expect(screen.getByText('Sans-serif')).toBeInTheDocument();
    });

    it('should call toggleFontFamily when clicking sans-serif', () => {
      render(<DisplayOptionsPanel {...defaultProps} fontFamily="serif" />);
      
      fireEvent.click(screen.getByText('Sans-serif'));
      
      expect(defaultProps.toggleFontFamily).toHaveBeenCalledTimes(1);
    });

    it('should call toggleFontFamily when clicking serif', () => {
      render(<DisplayOptionsPanel {...defaultProps} fontFamily="sans-serif" />);
      
      fireEvent.click(screen.getByText('Serif'));
      
      expect(defaultProps.toggleFontFamily).toHaveBeenCalledTimes(1);
    });

    it('should not toggle when clicking already selected font', () => {
      render(<DisplayOptionsPanel {...defaultProps} fontFamily="serif" />);
      
      fireEvent.click(screen.getByText('Serif'));
      
      expect(defaultProps.toggleFontFamily).not.toHaveBeenCalled();
    });

    it('should apply active styling to selected font', () => {
      render(<DisplayOptionsPanel {...defaultProps} fontFamily="sans-serif" />);
      
      const sansSerifButton = screen.getByText('Sans-serif');
      expect(sansSerifButton).toHaveClass('bg-blue-100/50', 'dark:bg-blue-900/30');
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', () => {
      render(<DisplayOptionsPanel {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.querySelector('.lucide-x'));
      
      expect(closeButton).toBeInTheDocument();
      fireEvent.click(closeButton!);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Panel Styling', () => {
    it('should have fixed positioning classes', () => {
      const { container } = render(<DisplayOptionsPanel {...defaultProps} />);
      
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('absolute');
    });

    it('should have shadow and z-index classes', () => {
      const { container } = render(<DisplayOptionsPanel {...defaultProps} />);
      
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('shadow-2xl', 'z-20');
    });

    it('should have flex layout classes', () => {
      const { container } = render(<DisplayOptionsPanel {...defaultProps} />);
      
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('flex', 'flex-col');
    });

    it('should have overflow-y-auto class for scrolling', () => {
      const { container } = render(<DisplayOptionsPanel {...defaultProps} />);
      
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('overflow-y-auto');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rotation of 360 degrees', () => {
      render(<DisplayOptionsPanel {...defaultProps} rotation={360} />);
      
      expect(screen.getByText(/Rotate Page \(360°\)/)).toBeInTheDocument();
      expect(screen.getByText('Reset Rotation')).toBeInTheDocument();
    });

    it('should handle very large font size', () => {
      render(<DisplayOptionsPanel {...defaultProps} fontSize={500} />);
      
      expect(screen.getByText('500%')).toBeInTheDocument();
    });

    it('should handle very large line height', () => {
      render(<DisplayOptionsPanel {...defaultProps} lineHeight={5.5} />);
      
      expect(screen.getByText('5.5')).toBeInTheDocument();
    });

    it('should handle custom color with all valid hex values', () => {
      render(<DisplayOptionsPanel {...defaultProps} customBgColor="#123abc" />);
      
      const colorInput = screen.getByDisplayValue('#123abc');
      expect(colorInput).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<DisplayOptionsPanel {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { name: 'Display Options' });
      expect(heading).toHaveClass('text-lg', 'font-semibold');
    });

    it('should have accessible button titles for font size', () => {
      render(<DisplayOptionsPanel {...defaultProps} />);
      
      expect(screen.getByTitle('Increase font size')).toBeInTheDocument();
      expect(screen.getByTitle('Decrease font size')).toBeInTheDocument();
    });

    it('should have accessible button titles for line height', () => {
      render(<DisplayOptionsPanel {...defaultProps} />);
      
      expect(screen.getByTitle('Increase line height')).toBeInTheDocument();
      expect(screen.getByTitle('Decrease line height')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should support full workflow: render -> change settings -> close', () => {
      render(<DisplayOptionsPanel {...defaultProps} />);
      
      // Change color filter
      fireEvent.click(screen.getByText('Sepia (Warm)'));
      expect(defaultProps.setColorFilter).toHaveBeenCalledWith('sepia');
      
      // Change layout
      fireEvent.click(screen.getByText('Double'));
      expect(defaultProps.togglePageLayout).toHaveBeenCalled();
      
      // Increase font size
      const increaseFontButton = screen.getAllByTitle('Increase font size')[0];
      fireEvent.click(increaseFontButton);
      expect(defaultProps.increaseFontSize).toHaveBeenCalled();
      
      // Close panel
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.querySelector('.lucide-x'));
      fireEvent.click(closeButton!);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
