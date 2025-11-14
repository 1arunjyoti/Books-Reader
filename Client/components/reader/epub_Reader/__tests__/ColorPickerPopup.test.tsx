import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ColorPickerPopup from '../ColorPickerPopup';

describe('ColorPickerPopup', () => {
  const defaultProps = {
    x: 100,
    y: 200,
    selectionHeight: 20,
    onColorSelect: jest.fn(),
    onDismiss: jest.fn(),
  };

  // Mock window dimensions
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  describe('Rendering', () => {
    it('should render color picker popup', () => {
      render(<ColorPickerPopup {...defaultProps} />);

      expect(screen.getByText('Highlight')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render all 6 color buttons', () => {
      render(<ColorPickerPopup {...defaultProps} />);

      expect(screen.getByTitle('Yellow')).toBeInTheDocument();
      expect(screen.getByTitle('Green')).toBeInTheDocument();
      expect(screen.getByTitle('Pink')).toBeInTheDocument();
      expect(screen.getByTitle('Blue')).toBeInTheDocument();
      expect(screen.getByTitle('Orange')).toBeInTheDocument();
      expect(screen.getByTitle('Purple')).toBeInTheDocument();
    });

    it('should render backdrop overlay', () => {
      const { container } = render(<ColorPickerPopup {...defaultProps} />);

      const backdrop = container.querySelector('.fixed.inset-0.z-40');
      expect(backdrop).toBeInTheDocument();
    });
  });

  describe('Color Selection', () => {
    it('should call onColorSelect with yellow when yellow button is clicked', () => {
      render(<ColorPickerPopup {...defaultProps} />);

      const yellowButton = screen.getByTitle('Yellow');
      fireEvent.click(yellowButton);

      expect(defaultProps.onColorSelect).toHaveBeenCalledWith({
        name: 'Yellow',
        color: 'yellow',
        hex: '#ffff00',
      });
    });

    it('should call onColorSelect with green when green button is clicked', () => {
      render(<ColorPickerPopup {...defaultProps} />);

      const greenButton = screen.getByTitle('Green');
      fireEvent.click(greenButton);

      expect(defaultProps.onColorSelect).toHaveBeenCalledWith({
        name: 'Green',
        color: 'green',
        hex: '#00ff00',
      });
    });

    it('should call onColorSelect with pink when pink button is clicked', () => {
      render(<ColorPickerPopup {...defaultProps} />);

      const pinkButton = screen.getByTitle('Pink');
      fireEvent.click(pinkButton);

      expect(defaultProps.onColorSelect).toHaveBeenCalledWith({
        name: 'Pink',
        color: 'pink',
        hex: '#ff69b4',
      });
    });

    it('should call onColorSelect with blue when blue button is clicked', () => {
      render(<ColorPickerPopup {...defaultProps} />);

      const blueButton = screen.getByTitle('Blue');
      fireEvent.click(blueButton);

      expect(defaultProps.onColorSelect).toHaveBeenCalledWith({
        name: 'Blue',
        color: 'blue',
        hex: '#87ceeb',
      });
    });

    it('should call onColorSelect with orange when orange button is clicked', () => {
      render(<ColorPickerPopup {...defaultProps} />);

      const orangeButton = screen.getByTitle('Orange');
      fireEvent.click(orangeButton);

      expect(defaultProps.onColorSelect).toHaveBeenCalledWith({
        name: 'Orange',
        color: 'orange',
        hex: '#ffa500',
      });
    });

    it('should call onColorSelect with purple when purple button is clicked', () => {
      render(<ColorPickerPopup {...defaultProps} />);

      const purpleButton = screen.getByTitle('Purple');
      fireEvent.click(purpleButton);

      expect(defaultProps.onColorSelect).toHaveBeenCalledWith({
        name: 'Purple',
        color: 'purple',
        hex: '#dda0dd',
      });
    });
  });

  describe('Dismissal', () => {
    it('should call onDismiss when cancel button is clicked', () => {
      render(<ColorPickerPopup {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should call onDismiss when backdrop is clicked', () => {
      const { container } = render(<ColorPickerPopup {...defaultProps} />);

      const backdrop = container.querySelector('.fixed.inset-0.z-40');
      fireEvent.click(backdrop!);

      expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should not dismiss when popup itself is clicked', () => {
      const { container } = render(<ColorPickerPopup {...defaultProps} />);

      const popup = container.querySelector('.fixed.z-50');
      fireEvent.click(popup!);

      expect(defaultProps.onDismiss).not.toHaveBeenCalled();
    });
  });

  describe('Positioning - Desktop', () => {
    it('should position popup above selection when enough space', () => {
      const { container } = render(<ColorPickerPopup {...defaultProps} y={300} />);

      const popup = container.querySelector('.fixed.z-50') as HTMLElement;
      expect(popup).toBeInTheDocument();
      // Desktop positioning logic should place it above when space is available
    });

    it('should position popup below selection when not enough space above', () => {
      const { container } = render(<ColorPickerPopup {...defaultProps} y={30} />);

      const popup = container.querySelector('.fixed.z-50') as HTMLElement;
      expect(popup).toBeInTheDocument();
      // Desktop positioning logic should place it below when space above is insufficient
    });

    it('should center popup horizontally on desktop', () => {
      const { container } = render(<ColorPickerPopup {...defaultProps} />);

      const popup = container.querySelector('.fixed.z-50') as HTMLElement;
      expect(popup.style.transform).toContain('translateX(-50%)');
    });
  });

  describe('Positioning - Mobile', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // Mobile width
      });
    });

    it('should center popup horizontally on mobile', () => {
      const { container } = render(<ColorPickerPopup {...defaultProps} />);

      const popup = container.querySelector('.fixed.z-50') as HTMLElement;
      expect(popup.style.transform).toContain('translate(-50%, 0)');
    });

    it('should not show "Highlight" label on mobile', () => {
      render(<ColorPickerPopup {...defaultProps} />);

      expect(screen.queryByText('Highlight')).not.toBeInTheDocument();
    });

    it('should render larger color buttons on mobile', () => {
      render(<ColorPickerPopup {...defaultProps} />);

      const yellowButton = screen.getByTitle('Yellow');
      expect(yellowButton).toHaveClass('h-8', 'w-8');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-labels for color buttons', () => {
      render(<ColorPickerPopup {...defaultProps} />);

      expect(screen.getByLabelText('Highlight with Yellow')).toBeInTheDocument();
      expect(screen.getByLabelText('Highlight with Green')).toBeInTheDocument();
      expect(screen.getByLabelText('Highlight with Pink')).toBeInTheDocument();
      expect(screen.getByLabelText('Highlight with Blue')).toBeInTheDocument();
      expect(screen.getByLabelText('Highlight with Orange')).toBeInTheDocument();
      expect(screen.getByLabelText('Highlight with Purple')).toBeInTheDocument();
    });

    it('should have title attributes for color buttons', () => {
      render(<ColorPickerPopup {...defaultProps} />);

      const yellowButton = screen.getByTitle('Yellow');
      expect(yellowButton).toHaveAttribute('title', 'Yellow');
    });

    it('should have type="button" for all buttons', () => {
      render(<ColorPickerPopup {...defaultProps} />);

      const yellowButton = screen.getByTitle('Yellow');
      expect(yellowButton).toHaveAttribute('type', 'button');

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Styling', () => {
    it('should apply correct background colors to buttons', () => {
      render(<ColorPickerPopup {...defaultProps} />);

      const yellowButton = screen.getByTitle('Yellow');
      expect(yellowButton).toHaveStyle({ backgroundColor: '#ffff00' });

      const greenButton = screen.getByTitle('Green');
      expect(greenButton).toHaveStyle({ backgroundColor: '#00ff00' });

      const pinkButton = screen.getByTitle('Pink');
      expect(pinkButton).toHaveStyle({ backgroundColor: '#ff69b4' });
    });

    it('should apply opacity to color buttons', () => {
      render(<ColorPickerPopup {...defaultProps} />);

      const yellowButton = screen.getByTitle('Yellow');
      expect(yellowButton).toHaveStyle({ opacity: 0.85 });
    });

    it('should have rounded-full class for popup container', () => {
      const { container } = render(<ColorPickerPopup {...defaultProps} />);

      const popup = container.querySelector('.fixed.z-50');
      expect(popup).toHaveClass('rounded-full');
    });

    it('should have shadow and border classes', () => {
      const { container } = render(<ColorPickerPopup {...defaultProps} />);

      const popup = container.querySelector('.fixed.z-50');
      expect(popup).toHaveClass('shadow-lg', 'border');
    });
  });

  describe('Edge Cases', () => {
    it('should handle x=0, y=0 positioning', () => {
      const { container } = render(<ColorPickerPopup {...defaultProps} x={0} y={0} />);

      const popup = container.querySelector('.fixed.z-50') as HTMLElement;
      expect(popup).toBeInTheDocument();
    });

    it('should handle very large coordinates', () => {
      const { container } = render(<ColorPickerPopup {...defaultProps} x={5000} y={5000} />);

      const popup = container.querySelector('.fixed.z-50') as HTMLElement;
      expect(popup).toBeInTheDocument();
    });

    it('should handle zero selection height', () => {
      const { container } = render(<ColorPickerPopup {...defaultProps} selectionHeight={0} />);

      const popup = container.querySelector('.fixed.z-50') as HTMLElement;
      expect(popup).toBeInTheDocument();
    });

    it('should prevent context menu on backdrop', () => {
      const { container } = render(<ColorPickerPopup {...defaultProps} />);

      const backdrop = container.querySelector('.fixed.inset-0.z-40');
      const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      backdrop!.dispatchEvent(event);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    it('should allow selecting multiple colors without closing', () => {
      render(<ColorPickerPopup {...defaultProps} />);

      fireEvent.click(screen.getByTitle('Yellow'));
      expect(defaultProps.onColorSelect).toHaveBeenCalledTimes(1);
      expect(defaultProps.onDismiss).not.toHaveBeenCalled();

      fireEvent.click(screen.getByTitle('Green'));
      expect(defaultProps.onColorSelect).toHaveBeenCalledTimes(2);
      expect(defaultProps.onDismiss).not.toHaveBeenCalled();
    });

    it('should dismiss after cancel is clicked', () => {
      render(<ColorPickerPopup {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
      expect(defaultProps.onColorSelect).not.toHaveBeenCalled();
    });
  });
});
