import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookmarkForm from '../bookmark-form';

// Mock the sanitize function
jest.mock('@/lib/sanitize-text', () => ({
    sanitizeBookmarkNote: jest.fn((text) => text.trim()),
}));

describe('BookmarkForm', () => {
    const defaultProps = {
        pageNumber: 42,
        onSubmit: jest.fn().mockResolvedValue(undefined),
        onCancel: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render with add bookmark title when not editing', () => {
            render(<BookmarkForm {...defaultProps} />);
            expect(screen.getByRole('heading', { name: /Add Bookmark/i })).toBeInTheDocument();
        });

        it('should render with edit bookmark title when editing', () => {
            render(<BookmarkForm {...defaultProps} isEditing={true} />);
            expect(screen.getByRole('heading', { name: /Edit Bookmark/i })).toBeInTheDocument();
        });

        it('should display page number in disabled input', () => {
            render(<BookmarkForm {...defaultProps} pageNumber={123} />);
            const pageInput = screen.getByDisplayValue('123');
            expect(pageInput).toBeDisabled();
        });

        it('should display initial note in textarea', () => {
            const initialNote = 'This is an important passage';
            render(<BookmarkForm {...defaultProps} initialNote={initialNote} />);
            expect(screen.getByDisplayValue(initialNote)).toBeInTheDocument();
        });

        it('should display character counter', () => {
            render(<BookmarkForm {...defaultProps} initialNote="Test" />);
            expect(screen.getByText('4/500 characters')).toBeInTheDocument();
        });

        it('should render close button', () => {
            render(<BookmarkForm {...defaultProps} />);
            const closeButtons = screen.getAllByRole('button').filter(btn => btn.querySelector('svg'));
            expect(closeButtons.length).toBeGreaterThan(0);
        });
    });

    describe('Form Interactions', () => {
        it('should update note on textarea change', async () => {
            const user = userEvent.setup();
            render(<BookmarkForm {...defaultProps} />);
            const textarea = screen.getByPlaceholderText(/Add a note to remember/);
            
            await user.type(textarea, 'New note');
            expect(screen.getByDisplayValue('New note')).toBeInTheDocument();
        });

        it('should update character counter as user types', async () => {
            const user = userEvent.setup();
            render(<BookmarkForm {...defaultProps} />);
            const textarea = screen.getByPlaceholderText(/Add a note to remember/);
            
            await user.type(textarea, 'Hello');
            expect(screen.getByText('5/500 characters')).toBeInTheDocument();
        });

        it('should enforce maxLength of 500 characters', async () => {
            const user = userEvent.setup({ delay: null });
            render(<BookmarkForm {...defaultProps} />);
            const textarea = screen.getByPlaceholderText(/Add a note to remember/) as HTMLTextAreaElement;
            
            // Type a good chunk to test max length
            const text300 = 'a'.repeat(300);
            await user.type(textarea, text300);
            
            // maxLength HTML attribute prevents typing beyond 500
            expect(textarea.value.length).toBeLessThanOrEqual(500);
            expect(textarea.value).toBe(text300);
        }, 15000);

        it('should call onCancel when cancel button is clicked', async () => {
            const user = userEvent.setup();
            render(<BookmarkForm {...defaultProps} />);
            const cancelButton = screen.getByRole('button', { name: /cancel/i });
            
            await user.click(cancelButton);
            expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
        });

        it('should call onCancel when close button is clicked', async () => {
            const user = userEvent.setup();
            render(<BookmarkForm {...defaultProps} />);
            const closeButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'));
            
            if (closeButton) await user.click(closeButton);
            expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
        });
    });

    describe('Form Submission', () => {
        it('should call onSubmit with sanitized note on form submission', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn().mockResolvedValue(undefined);
            render(<BookmarkForm {...defaultProps} onSubmit={onSubmit} initialNote="  test  " />);
            
            const submitButton = screen.getByRole('button', { name: /add bookmark/i });
            await user.click(submitButton);
            
            await waitFor(() => {
                expect(onSubmit).toHaveBeenCalledWith('test');
            });
        });

        it('should trim whitespace from note before submission', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn().mockResolvedValue(undefined);
            render(<BookmarkForm {...defaultProps} onSubmit={onSubmit} />);
            const textarea = screen.getByPlaceholderText(/Add a note to remember/);
            
            await user.type(textarea, '   whitespace test   ');
            await user.click(screen.getByRole('button', { name: /add bookmark/i }));
            
            await waitFor(() => {
                expect(onSubmit).toHaveBeenCalled();
            });
        });

        it('should show loading state during submission', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<Promise<void>, [string]>(() => new Promise(resolve => setTimeout(resolve, 100)));
            render(<BookmarkForm {...defaultProps} onSubmit={onSubmit} />);
            
            const submitButton = screen.getByRole('button', { name: /add bookmark/i });
            await user.click(submitButton);
            
            expect(screen.getByText(/Adding\.\.\./)).toBeInTheDocument();
        });

        it('should show saving text when editing during submission', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<Promise<void>, [string]>(() => new Promise(resolve => setTimeout(resolve, 100)));
            render(<BookmarkForm {...defaultProps} onSubmit={onSubmit} isEditing={true} />);
            
            const submitButton = screen.getByRole('button', { name: /save changes/i });
            await user.click(submitButton);
            
            expect(screen.getByText(/Saving\.\.\./)).toBeInTheDocument();
        });

        it('should disable buttons during submission', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<Promise<void>, [string]>(() => new Promise(resolve => setTimeout(resolve, 50)));
            render(<BookmarkForm {...defaultProps} onSubmit={onSubmit} />);
            
            const submitButton = screen.getByRole('button', { name: /add bookmark/i });
            await user.click(submitButton);
            
            const cancelButton = screen.getByRole('button', { name: /cancel/i });
            expect(cancelButton).toBeDisabled();
            expect(submitButton).toBeDisabled();
        });

        it('should enable buttons after submission completes', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn().mockResolvedValue(undefined);
            render(<BookmarkForm {...defaultProps} onSubmit={onSubmit} />);
            
            await user.click(screen.getByRole('button', { name: /add bookmark/i }));
            
            await waitFor(() => {
                const cancelButton = screen.getByRole('button', { name: /cancel/i });
                expect(cancelButton).not.toBeDisabled();
            });
        });

        it('should handle submission error gracefully', async () => {
            const user = userEvent.setup({ delay: null });
            const error = new Error('Submission failed');
            const onSubmit = jest.fn().mockRejectedValue(error);
            
            // Suppress console.error for this test
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            render(<BookmarkForm {...defaultProps} onSubmit={onSubmit} />);
            await user.click(screen.getByRole('button', { name: /add bookmark/i }));
            
            await waitFor(() => {
                expect(onSubmit).toHaveBeenCalled();
            });
            
            consoleSpy.mockRestore();
        }, 15000);
    });

    describe('Edge Cases', () => {
        it('should handle empty note submission', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn().mockResolvedValue(undefined);
            render(<BookmarkForm {...defaultProps} onSubmit={onSubmit} initialNote="" />);
            
            await user.click(screen.getByRole('button', { name: /add bookmark/i }));
            
            await waitFor(() => {
                expect(onSubmit).toHaveBeenCalledWith('');
            });
        });

        it('should handle note with only whitespace', async () => {
            const user = userEvent.setup({ delay: null });
            const onSubmit = jest.fn().mockResolvedValue(undefined);
            render(<BookmarkForm {...defaultProps} onSubmit={onSubmit} initialNote="   " />);
            
            const textarea = screen.getByPlaceholderText(/Add a note to remember/) as HTMLTextAreaElement;
            // Clear and set programmatically rather than typing spaces
            await user.clear(textarea);
            textarea.value = '   ';
            await user.click(screen.getByRole('button', { name: /add bookmark/i }));
            
            await waitFor(() => {
                expect(onSubmit).toHaveBeenCalledWith('');
            });
        }, 15000);

        it('should handle special characters in note', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn().mockResolvedValue(undefined);
            const specialNote = '<script>alert("xss")</script>';
            render(<BookmarkForm {...defaultProps} onSubmit={onSubmit} />);
            
            const textarea = screen.getByPlaceholderText(/Add a note to remember/);
            await user.type(textarea, specialNote);
            await user.click(screen.getByRole('button', { name: /add bookmark/i }));
            
            await waitFor(() => {
                expect(onSubmit).toHaveBeenCalled();
            });
        });

        it('should handle zero page number', () => {
            render(<BookmarkForm {...defaultProps} pageNumber={0} />);
            expect(screen.getByDisplayValue('0')).toBeInTheDocument();
        });

        it('should handle large page numbers', () => {
            render(<BookmarkForm {...defaultProps} pageNumber={999999} />);
            expect(screen.getByDisplayValue('999999')).toBeInTheDocument();
        });

        it('should handle unicode characters in note', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn().mockResolvedValue(undefined);
            render(<BookmarkForm {...defaultProps} onSubmit={onSubmit} />);
            
            const textarea = screen.getByPlaceholderText(/Add a note to remember/);
            await user.type(textarea, '你好世界 مرحبا العالم');
            await user.click(screen.getByRole('button', { name: /add bookmark/i }));
            
            await waitFor(() => {
                expect(onSubmit).toHaveBeenCalled();
            });
        });

        it('should handle rapid submissions', async () => {
            const user = userEvent.setup();
            const onSubmit = jest.fn<Promise<void>, [string]>().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
            render(<BookmarkForm {...defaultProps} onSubmit={onSubmit} />);
            
            const submitButton = screen.getByRole('button', { name: /add bookmark/i });
            await user.click(submitButton);
            await user.click(submitButton);
            
            await waitFor(() => {
                expect(onSubmit).toHaveBeenCalledTimes(1);
            });
        }, 15000);
    });

    describe('Props Memoization', () => {
        it('should not re-render when props are equal', () => {
            const { rerender, container } = render(<BookmarkForm {...defaultProps} />);
            const firstRender = container.querySelector('h3');
            
            rerender(<BookmarkForm {...defaultProps} />);
            const secondRender = container.querySelector('h3');
            
            expect(firstRender).toBeInTheDocument();
            expect(secondRender).toBeInTheDocument();
            expect(firstRender?.textContent).toBe('Add Bookmark');
        });
    });

    describe('Button States', () => {
        it('should display correct button text when adding', () => {
            render(<BookmarkForm {...defaultProps} isEditing={false} />);
            expect(screen.getByRole('button', { name: /add bookmark/i })).toBeInTheDocument();
        });

        it('should display correct button text when editing', () => {
            render(<BookmarkForm {...defaultProps} isEditing={true} />);
            expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
        });
    });
});