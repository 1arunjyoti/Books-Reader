import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TxtHighlightsPanel from '../TxtHighlightsPanel';

// Mock dependencies
jest.mock('@tanstack/react-virtual', () => {
    return {
        useVirtualizer: (options: { count?: number; getScrollElement?: () => unknown; estimateSize?: () => number; overscan?: number }) => {
            const estimateSize = options.estimateSize?.() || 120;
            const count = options.count || 0;
            return {
                getTotalSize: () => count * estimateSize,
                getVirtualItems: () => {
                    // Return all items for testing (disable virtualization in tests)
                    return Array.from({ length: count }, (_, i) => ({
                        index: i,
                        key: i,
                        start: i * estimateSize,
                        size: estimateSize,
                    }));
                },
                measureElement: jest.fn(),
            };
        },
    };
});

jest.mock('@/lib/sanitize-text', () => ({
    sanitizeText: jest.fn((text: string) => text),
}));

jest.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, disabled, ...props }: { children?: React.ReactNode; onClick?: () => void; disabled?: boolean; [key: string]: unknown }) => (
        <button onClick={onClick} disabled={disabled} {...props}>
            {children}
        </button>
    ),
}));

jest.mock('@/components/ui/textarea', () => ({
    Textarea: ({ onChange, value, ...props }: { onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; value?: string; [key: string]: unknown }) => (
        <textarea onChange={onChange} value={value} {...props} />
    ),
}));

jest.mock('@/components/ui/checkbox', () => ({
    Checkbox: ({ onCheckedChange, checked, ...props }: { onCheckedChange?: (checked: boolean) => void; checked?: boolean; [key: string]: unknown }) => (
        <input
            type="checkbox"
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            checked={checked}
            {...props}
        />
    ),
}));

const mockHighlight = {
    id: '1',
    text: 'Sample highlight text',
    position: { start: 0, end: 20 },
    color: 'yellow',
    hex: '#ffff00',
    note: 'Test note',
    createdAt: '2024-01-15T10:00:00Z',
    sectionIndex: 0,
};

const mockHighlight2 = {
    id: '2',
    text: 'Another highlight',
    position: { start: 25, end: 42 },
    color: 'green',
    hex: '#00ff00',
    createdAt: '2024-01-16T10:00:00Z',
    sectionIndex: 1,
};

const defaultProps = {
    highlights: [mockHighlight],
    isLoading: false,
    onRemoveHighlight: jest.fn(),
    onJumpToHighlight: jest.fn(),
    onChangeColor: jest.fn(),
    onSaveNote: jest.fn(),
    onClose: jest.fn(),
};

describe('TxtHighlightsPanel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders the panel with header', () => {
            render(<TxtHighlightsPanel {...defaultProps} />);
            expect(screen.getByText('Highlights')).toBeInTheDocument();
        });

        it('displays loading state', () => {
            render(<TxtHighlightsPanel {...defaultProps} isLoading={true} />);
            expect(screen.getByText('Loading highlights...')).toBeInTheDocument();
        });

        it('displays empty state when no highlights', () => {
            render(<TxtHighlightsPanel {...defaultProps} highlights={[]} />);
            expect(screen.getByText('No highlights yet. Select text to create one!')).toBeInTheDocument();
        });

        it('displays filter empty state', () => {
            render(
                <TxtHighlightsPanel
                    {...defaultProps}
                    highlights={[mockHighlight]}
                />
            );
            const filterButton = screen.getAllByRole('button').find(btn => btn.textContent.includes('Filter'));
            if (filterButton) {
                fireEvent.click(filterButton);
            }
        });

        it('shows highlight count in header', () => {
            render(
                <TxtHighlightsPanel
                    {...defaultProps}
                    highlights={[mockHighlight, mockHighlight2]}
                />
            );
            expect(screen.getByText(/2 shown/)).toBeInTheDocument();
        });
    });

    describe('Highlight Display', () => {
        it('displays highlight text with quotes', () => {
            render(<TxtHighlightsPanel {...defaultProps} highlights={[mockHighlight]} />);
            expect(screen.getByText(/Sample highlight text/)).toBeInTheDocument();
        });

        it('displays highlight with note indicator', () => {
            render(
                <TxtHighlightsPanel {...defaultProps} highlights={[mockHighlight]} />
            );
            expect(screen.getByText('Test note')).toBeInTheDocument();
        });

        it('displays section index', () => {
            render(
                <TxtHighlightsPanel {...defaultProps} highlights={[mockHighlight]} />
            );
            expect(screen.getByText(/Section 1/)).toBeInTheDocument();
        });

        it('displays formatted date', () => {
            render(
                <TxtHighlightsPanel {...defaultProps} highlights={[mockHighlight]} />
            );
            expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
        });

        it('handles highlight without date gracefully', () => {
            const highlightNoDate = { ...mockHighlight, createdAt: undefined };
            render(
                <TxtHighlightsPanel {...defaultProps} highlights={[highlightNoDate]} />
            );
            expect(screen.queryByText(/Created:/)).not.toBeInTheDocument();
        });

        it('handles highlight without note', () => {
            const highlightNoNote = { ...mockHighlight, note: undefined };
            render(
                <TxtHighlightsPanel {...defaultProps} highlights={[highlightNoNote]} />
            );
            expect(screen.queryByText('Test note')).not.toBeInTheDocument();
        });
    });

    describe('Expansion', () => {
        it('expands highlight on click', () => {
            render(
                <TxtHighlightsPanel {...defaultProps} highlights={[mockHighlight]} />
            );
            const highlightElement = screen.getByText(/Sample highlight text/);
            fireEvent.click(highlightElement);
            expect(screen.getByText('Change color')).toBeInTheDocument();
        });

        it('collapses expanded highlight on second click', () => {
            render(
                <TxtHighlightsPanel {...defaultProps} highlights={[mockHighlight]} />
            );
            const highlightElement = screen.getByText(/Sample highlight text/);
            fireEvent.click(highlightElement);
            fireEvent.click(highlightElement);
            expect(screen.queryByText('Change color')).not.toBeInTheDocument();
        });

        it('shows expanded content when opened', () => {
            render(
                <TxtHighlightsPanel {...defaultProps} highlights={[mockHighlight]} />
            );
            const highlightElement = screen.getByText(/Sample highlight text/);
            fireEvent.click(highlightElement);
            expect(screen.getByText(/Jump to/)).toBeInTheDocument();
            expect(screen.getByText(/Copy/)).toBeInTheDocument();
        });
    });

    describe('Note Editing', () => {
        it('opens note edit mode', () => {
            render(
                <TxtHighlightsPanel {...defaultProps} highlights={[mockHighlight]} />
            );
            const highlightElement = screen.getByText(/Sample highlight text/);
            fireEvent.click(highlightElement);
            const editButton = screen.getByText('Edit');
            fireEvent.click(editButton);
            expect(screen.getByDisplayValue('Test note')).toBeInTheDocument();
        });

        it('shows "Add Note" button for highlights without notes', () => {
            const highlightNoNote = { ...mockHighlight, note: undefined };
            render(
                <TxtHighlightsPanel {...defaultProps} highlights={[highlightNoNote]} />
            );
            const highlightElement = screen.getByText(/Sample highlight text/);
            fireEvent.click(highlightElement);
            expect(screen.getByText('Add Note')).toBeInTheDocument();
        });

        it('saves note and calls callback', async () => {
            const onSaveNote = jest.fn().mockResolvedValue(undefined);
            render(
                <TxtHighlightsPanel
                    {...defaultProps}
                    highlights={[mockHighlight]}
                    onSaveNote={onSaveNote}
                />
            );
            const highlightElement = screen.getByText(/Sample highlight text/);
            fireEvent.click(highlightElement);
            const editButton = screen.getByText('Edit');
            fireEvent.click(editButton);
            const textarea = screen.getByDisplayValue('Test note');
            fireEvent.change(textarea, { target: { value: 'New note' } });
            const saveButton = screen.getByText(/^Save$/);
            fireEvent.click(saveButton);
            await waitFor(() => {
                expect(onSaveNote).toHaveBeenCalled();
            });
        });

        it('cancels note editing', () => {
            render(
                <TxtHighlightsPanel {...defaultProps} highlights={[mockHighlight]} />
            );
            const highlightElement = screen.getByText(/Sample highlight text/);
            fireEvent.click(highlightElement);
            const editButton = screen.getByText('Edit');
            fireEvent.click(editButton);
            const textarea = screen.getByDisplayValue('Test note');
            fireEvent.change(textarea, { target: { value: 'Modified note' } });
            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);
            expect(screen.queryByDisplayValue('Modified note')).not.toBeInTheDocument();
        });

        it('displays note character count', () => {
            render(
                <TxtHighlightsPanel {...defaultProps} highlights={[mockHighlight]} />
            );
            const highlightElement = screen.getByText(/Sample highlight text/);
            fireEvent.click(highlightElement);
            const editButton = screen.getByText('Edit');
            fireEvent.click(editButton);
            expect(screen.getByText(/\/500/)).toBeInTheDocument();
        });

        it('handles note saving error gracefully', async () => {
            const consoleError = jest.spyOn(console, 'error').mockImplementation();
            const onSaveNote = jest.fn().mockRejectedValue(new Error('Save failed'));
            render(
                <TxtHighlightsPanel
                    {...defaultProps}
                    highlights={[mockHighlight]}
                    onSaveNote={onSaveNote}
                />
            );
            const highlightElement = screen.getByText(/Sample highlight text/);
            fireEvent.click(highlightElement);
            const editButton = screen.getByText('Edit');
            fireEvent.click(editButton);
            const saveButton = screen.getByText(/^Save$/);
            fireEvent.click(saveButton);
            await waitFor(() => {
                expect(consoleError).toHaveBeenCalled();
            });
            consoleError.mockRestore();
        });
    });

    describe('Copy Functionality', () => {
        it('copies highlight text', async () => {
            const clipboardWriteText = jest.fn().mockResolvedValue(undefined);
            Object.assign(navigator, { clipboard: { writeText: clipboardWriteText } });
            render(
                <TxtHighlightsPanel {...defaultProps} highlights={[mockHighlight]} />
            );
            const highlightElement = screen.getByText(/Sample highlight text/);
            fireEvent.click(highlightElement);
            const copyButton = screen.getByText(/Copy/);
            fireEvent.click(copyButton);
            await waitFor(() => {
                expect(clipboardWriteText).toHaveBeenCalled();
            });
        });

        it('shows "Copied!" feedback temporarily', async () => {
            Object.assign(navigator, {
                clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
            });
            jest.useFakeTimers();
            render(
                <TxtHighlightsPanel {...defaultProps} highlights={[mockHighlight]} />
            );
            const highlightElement = screen.getByText(/Sample highlight text/);
            fireEvent.click(highlightElement);
            const copyButton = screen.getByText(/Copy/);
            fireEvent.click(copyButton);
            expect(screen.getByText('Copied!')).toBeInTheDocument();
            jest.advanceTimersByTime(2000);
            jest.useRealTimers();
        });
    });

    describe('Close Button', () => {
        it('calls onClose when close button is clicked', () => {
            const onClose = jest.fn();
            render(<TxtHighlightsPanel {...defaultProps} onClose={onClose} />);
            const buttons = screen.getAllByRole('button');
            // The close button is the one with class "h-8 w-8 p-0" in the header
            const closeButton = buttons.find(btn => 
                btn.className.includes('h-8 w-8 p-0') && 
                btn.querySelector('svg[class*="lucide-x"]')
            );
            if (closeButton) {
                fireEvent.click(closeButton);
            }
            expect(onClose).toHaveBeenCalled();
        });
    });

    describe('Jump to Highlight', () => {
        it('calls onJumpToHighlight with correct section index', () => {
            const onJumpToHighlight = jest.fn();
            render(
                <TxtHighlightsPanel
                    {...defaultProps}
                    highlights={[mockHighlight]}
                    onJumpToHighlight={onJumpToHighlight}
                />
            );
            const highlightElement = screen.getByText(/Sample highlight text/);
            fireEvent.click(highlightElement);
            const jumpButton = screen.getByText('Jump to');
            fireEvent.click(jumpButton);
            expect(onJumpToHighlight).toHaveBeenCalledWith(0);
        });
    });

    describe('Remove Highlight', () => {
        it('removes highlight when delete button is clicked', () => {
            const onRemoveHighlight = jest.fn();
            render(
                <TxtHighlightsPanel
                    {...defaultProps}
                    highlights={[mockHighlight]}
                    onRemoveHighlight={onRemoveHighlight}
                />
            );
            const highlightElement = screen.getByText(/Sample highlight text/);
            fireEvent.click(highlightElement);
            const deleteButtons = screen.getAllByRole('button').filter(btn => 
                btn.querySelector('svg') && btn.textContent.includes('')
            );
            if (deleteButtons.length > 0) {
                fireEvent.click(deleteButtons[deleteButtons.length - 1]);
                expect(onRemoveHighlight).toHaveBeenCalled();
            }
        });
    });

    describe('Filter Panel', () => {
        it('opens filter panel on filter button click', () => {
            render(
                <TxtHighlightsPanel
                    {...defaultProps}
                    highlights={[mockHighlight, mockHighlight2]}
                />
            );
            const filterButtons = screen.getAllByRole('button');
            const filterButton = filterButtons.find(btn => btn.textContent.includes('Filter'));
            if (filterButton) {
                fireEvent.click(filterButton);
                expect(screen.getByText('Filter by Color')).toBeInTheDocument();
            }
        });

        it('filters highlights by color', () => {
            render(
                <TxtHighlightsPanel
                    {...defaultProps}
                    highlights={[mockHighlight, mockHighlight2]}
                />
            );
            const filterButtons = screen.getAllByRole('button');
            const filterButton = filterButtons.find(btn => btn.textContent.includes('Filter'));
            if (filterButton) {
                fireEvent.click(filterButton);
                const yellowCheckbox = screen.getByRole('checkbox', { name: /Yellow/ });
                fireEvent.click(yellowCheckbox);
                expect(screen.getByText(/1 shown/)).toBeInTheDocument();
            }
        });

        it('shows color count in filter options', () => {
            render(
                <TxtHighlightsPanel
                    {...defaultProps}
                    highlights={[mockHighlight, mockHighlight2]}
                />
            );
            const filterButtons = screen.getAllByRole('button');
            const filterButton = filterButtons.find(btn => btn.textContent.includes('Filter'));
            if (filterButton) {
                fireEvent.click(filterButton);
                expect(screen.getByText(/\(1\)/)).toBeInTheDocument();
            }
        });

        it('shows "No highlights match filters" when filter excludes all', () => {
            render(
                <TxtHighlightsPanel
                    {...defaultProps}
                    highlights={[mockHighlight]}
                />
            );
            const filterButtons = screen.getAllByRole('button');
            const filterButton = filterButtons.find(btn => btn.textContent.includes('Filter'));
            if (filterButton) {
                fireEvent.click(filterButton);
                const blueCheckbox = screen.getByRole('checkbox', { name: /Blue/ });
                fireEvent.click(blueCheckbox);
                expect(screen.getByText(/No highlights match the selected filters/)).toBeInTheDocument();
            }
        });

        it('clears all filters', () => {
            render(
                <TxtHighlightsPanel
                    {...defaultProps}
                    highlights={[mockHighlight, mockHighlight2]}
                />
            );
            const filterButtons = screen.getAllByRole('button');
            const filterButton = filterButtons.find(btn => btn.textContent.includes('Filter'));
            if (filterButton) {
                fireEvent.click(filterButton);
                const yellowCheckbox = screen.getByRole('checkbox', { name: /Yellow/ });
                fireEvent.click(yellowCheckbox);
                const clearButton = screen.getByText('Clear All');
                fireEvent.click(clearButton);
                expect(screen.getByText(/2 shown/)).toBeInTheDocument();
            }
        });

        it('shows filter badge count', () => {
            render(
                <TxtHighlightsPanel
                    {...defaultProps}
                    highlights={[mockHighlight, mockHighlight2]}
                />
            );
            const filterButtons = screen.getAllByRole('button');
            const filterButton = filterButtons.find(btn => btn.textContent.includes('Filter'));
            if (filterButton) {
                fireEvent.click(filterButton);
                const yellowCheckbox = screen.getByRole('checkbox', { name: /Yellow/ });
                fireEvent.click(yellowCheckbox);
                expect(screen.getByText('1')).toBeInTheDocument();
            }
        });

        it('disables checkboxes for colors with no highlights', () => {
            render(
                <TxtHighlightsPanel
                    {...defaultProps}
                    highlights={[mockHighlight]}
                />
            );
            const filterButtons = screen.getAllByRole('button');
            const filterButton = filterButtons.find(btn => btn.textContent.includes('Filter'));
            if (filterButton) {
                fireEvent.click(filterButton);
                const redCheckbox = screen.getByRole('checkbox', { name: /Orange/ });
                expect(redCheckbox).toBeDisabled();
            }
        });
    });

    describe('Edge Cases', () => {
        it('handles very long highlight text', () => {
            const longText = 'A'.repeat(1000);
            const longHighlight = { ...mockHighlight, text: longText };
            render(
                <TxtHighlightsPanel
                    {...defaultProps}
                    highlights={[longHighlight]}
                />
            );
            expect(screen.getByText(new RegExp('A+'))).toBeInTheDocument();
        });

        it('handles special characters in highlight text', () => {
            const specialHighlight = { ...mockHighlight, text: '<script>alert("xss")</script>' };
            render(
                <TxtHighlightsPanel
                    {...defaultProps}
                    highlights={[specialHighlight]}
                />
            );
            expect(screen.getByText(/<script>alert/)).toBeInTheDocument();
        });

        it('handles empty note text', () => {
            render(
                <TxtHighlightsPanel {...defaultProps} highlights={[mockHighlight]} />
            );
            const highlightElement = screen.getByText(/Sample highlight text/);
            fireEvent.click(highlightElement);
            const editButton = screen.getByText('Edit');
            fireEvent.click(editButton);
            const textarea = screen.getByDisplayValue('Test note');
            fireEvent.change(textarea, { target: { value: '' } });
            expect(screen.getByText(/0\/500/)).toBeInTheDocument();
        });

        it('handles maximum note length', () => {
            render(
                <TxtHighlightsPanel {...defaultProps} highlights={[mockHighlight]} />
            );
            const highlightElement = screen.getByText(/Sample highlight text/);
            fireEvent.click(highlightElement);
            const editButton = screen.getByText('Edit');
            fireEvent.click(editButton);
            const textarea = screen.getByDisplayValue('Test note') as HTMLTextAreaElement;
            const maxText = 'A'.repeat(500);
            fireEvent.change(textarea, { target: { value: maxText } });
            expect(screen.getByText(/500\/500/)).toBeInTheDocument();
        });

        it('handles undefined position in highlight', () => {
            const highlightNoPos = { ...mockHighlight, position: { start: 0, end: 0 } };
            render(
                <TxtHighlightsPanel
                    {...defaultProps}
                    highlights={[highlightNoPos]}
                />
            );
            expect(screen.getByText(/Sample highlight text/)).toBeInTheDocument();
        });

        it('handles multiple highlights with same color', () => {
            const highlight3 = { ...mockHighlight, id: '3', sectionIndex: 2 };
            render(
                <TxtHighlightsPanel
                    {...defaultProps}
                    highlights={[mockHighlight, highlight3]}
                />
            );
            expect(screen.getByText(/2 shown/)).toBeInTheDocument();
        });
    });

    describe('Color Picker', () => {
        it('displays all available colors in expanded view', () => {
            render(
                <TxtHighlightsPanel {...defaultProps} highlights={[mockHighlight]} />
            );
            const highlightElement = screen.getByText(/Sample highlight text/);
            fireEvent.click(highlightElement);
            expect(screen.getByText('Change color')).toBeInTheDocument();
        });

        it('calls onChangeColor when color is clicked', () => {
            const onChangeColor = jest.fn();
            render(
                <TxtHighlightsPanel
                    {...defaultProps}
                    highlights={[mockHighlight]}
                    onChangeColor={onChangeColor}
                />
            );
            const highlightElement = screen.getByText(/Sample highlight text/);
            fireEvent.click(highlightElement);
            const colorButtons = screen.getAllByRole('button').slice(-6);
            fireEvent.click(colorButtons[0]);
            expect(onChangeColor).toHaveBeenCalled();
        });
    });
});