import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import TxtDisplayOptionsPanel from '../TxtDisplayOptionsPanel';

describe('TxtDisplayOptionsPanel', () => {
    const baseProps = {
        colorFilter: 'none' as const,
        customBgColor: '#ffffff',
        setColorFilter: jest.fn(),
        setCustomBgColor: jest.fn(),
        fontSize: 16,
        increaseFontSize: jest.fn(),
        decreaseFontSize: jest.fn(),
        lineHeight: 1.5,
        increaseLineHeight: jest.fn(),
        decreaseLineHeight: jest.fn(),
        fontFamily: 'serif' as const,
        toggleFontFamily: jest.fn(),
        textAlign: 'left' as const,
        cycleTextAlign: jest.fn(),
        onClose: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders header and close button invokes onClose', () => {
        render(<TxtDisplayOptionsPanel {...baseProps} />);
        const heading = screen.getByText('Display Options');
        expect(heading).toBeInTheDocument();

        const headerRoot = heading.parentElement as HTMLElement;
        const closeButton = within(headerRoot).getByRole('button');
        fireEvent.click(closeButton);
        expect(baseProps.onClose).toHaveBeenCalledTimes(1);
    });

    test('color filter buttons call setColorFilter correctly', () => {
        render(<TxtDisplayOptionsPanel {...baseProps} />);
        const sepiaBtn = screen.getByText('Sepia (Warm)');
        const nightBtn = screen.getByText('Night Mode');

        fireEvent.click(sepiaBtn);
        expect(baseProps.setColorFilter).toHaveBeenCalledWith('sepia');

        fireEvent.click(nightBtn);
        expect(baseProps.setColorFilter).toHaveBeenCalledWith('dark');
    });

    test('custom color input calls setCustomBgColor and sets filter to custom', () => {
        render(<TxtDisplayOptionsPanel {...baseProps} />);
        const colorInput = document.querySelector('input[type="color"]') as HTMLInputElement;
        expect(colorInput).toBeTruthy();

        fireEvent.change(colorInput, { target: { value: '#123456' } });
        expect(baseProps.setCustomBgColor).toHaveBeenCalledWith('#123456');
        expect(baseProps.setColorFilter).toHaveBeenCalledWith('custom');
    });

    test('font size controls display value and invoke handlers', () => {
        render(<TxtDisplayOptionsPanel {...baseProps} />);
        const fontSizeHeading = screen.getByText('Font Size');
        const section = fontSizeHeading.closest('div')?.parentElement as HTMLElement;
        const allButtons = section!.querySelectorAll('button');
        // left is decrease, right is increase based on markup
        fireEvent.click(allButtons[0]);
        expect(baseProps.decreaseFontSize).toHaveBeenCalledTimes(1);

        const sizeLabel = within(section).getByText(/px$/);
        expect(sizeLabel).toHaveTextContent('16px');

        fireEvent.click(allButtons[allButtons.length - 1]);
        expect(baseProps.increaseFontSize).toHaveBeenCalledTimes(1);
    });
    test('line height controls display one decimal and invoke handlers', () => {
        render(<TxtDisplayOptionsPanel {...baseProps} lineHeight={1.234} />);
        const lhHeading = screen.getByText('Line Height');
        const section = lhHeading.closest('div')?.parentElement as HTMLElement;
        const allButtons = section!.querySelectorAll('button');

        // middle label should display 1 decimal place
        const label = within(section).getByText('1.2');
        expect(label).toBeInTheDocument();

        fireEvent.click(allButtons[0]);
        expect(baseProps.decreaseLineHeight).toHaveBeenCalledTimes(1);
        fireEvent.click(allButtons[allButtons.length - 1]);
        expect(baseProps.increaseLineHeight).toHaveBeenCalledTimes(1);
    });

    test('font family buttons call toggleFontFamily only when changing', () => {
        const props = { ...baseProps, fontFamily: 'serif' as const };
        render(<TxtDisplayOptionsPanel {...props} />);
        const serif = screen.getByText('Serif');
        const sans = screen.getByText('Sans');
        const mono = screen.getByText('Mono');

        // clicking selected should not call
        fireEvent.click(serif);
        expect(props.toggleFontFamily).not.toHaveBeenCalled();

        // clicking others should call
        fireEvent.click(sans);
        expect(props.toggleFontFamily).toHaveBeenCalledTimes(1);
        fireEvent.click(mono);
        expect(props.toggleFontFamily).toHaveBeenCalledTimes(2);
    });

    test('text alignment buttons call cycleTextAlign only when changing', () => {
        const props = { ...baseProps, textAlign: 'left' as const };
        render(<TxtDisplayOptionsPanel {...props} />);
        const left = screen.getByText('Left');
        const center = screen.getByText('Center');
        const justify = screen.getByText('Justify');

        fireEvent.click(left);
        expect(props.cycleTextAlign).not.toHaveBeenCalled();

        fireEvent.click(center);
        expect(props.cycleTextAlign).toHaveBeenCalledTimes(1);

        fireEvent.click(justify);
        expect(props.cycleTextAlign).toHaveBeenCalledTimes(2);
    });

    test('reset button sets color filter to none', () => {
        render(<TxtDisplayOptionsPanel {...baseProps} />);
        const resetBtn = screen.getByText('Reset to Defaults');
        fireEvent.click(resetBtn);
        expect(baseProps.setColorFilter).toHaveBeenCalledWith('none');
    });

    test('font family buttons call handler on different selection', () => {
        const props = { ...baseProps, fontFamily: 'serif' as const };
        render(<TxtDisplayOptionsPanel {...props} />);
        const sans = screen.getByText('Sans');
        
        // When clicking Sans (and current is serif), the handler should be called
        fireEvent.click(sans);
        expect(props.toggleFontFamily).toHaveBeenCalledTimes(1);
    });
});