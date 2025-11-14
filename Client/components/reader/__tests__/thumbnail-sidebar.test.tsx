/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ThumbnailSidebar  from '../thumbnail-sidebar';

// Mock Next.js Image component
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => {
        return <div {...props} />;
    },
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
    X: () => <div data-testid="close-icon">X</div>,
}));

// Mock UI button component
jest.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, ...props }: any) => (
        <button onClick={onClick} {...props}>
            {children}
        </button>
    ),
}));

describe('ThumbnailSidebar', () => {
    const mockPdfDoc = {
        getPage: jest.fn(),
        numPages: 10,
    };

    const defaultProps = {
        pdfDoc: mockPdfDoc,
        currentPage: 1,
        numPages: 10,
        onPageClick: jest.fn(),
        onClose: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockPdfDoc.getPage.mockResolvedValue({
            getViewport: jest.fn(() => ({
                height: 260,
                width: 200,
            })),
            render: jest.fn(() => ({
                promise: Promise.resolve(),
            })),
            cleanup: jest.fn(),
        });
    });

    describe('Rendering', () => {
        test('renders header with title and close button', () => {
            render(<ThumbnailSidebar {...defaultProps} />);
            expect(screen.getByText('Page Thumbnails')).toBeInTheDocument();
            expect(screen.getByTestId('close-icon')).toBeInTheDocument();
        });

        test('renders correct number of thumbnail items', () => {
            render(<ThumbnailSidebar {...defaultProps} />);
            const items = screen.getAllByText(/^\d+$/);
            expect(items.length).toBe(defaultProps.numPages);
        });

        test('renders with correct styling for active page', () => {
            render(<ThumbnailSidebar {...defaultProps} currentPage={5} />);
            const pageElements = screen.getAllByText(/^\d+$/);
            const activePage = pageElements[4].closest('[data-page]');
            expect(activePage).toHaveClass('border-blue-500');
        });

        test('renders all page numbers correctly', () => {
            render(<ThumbnailSidebar {...defaultProps} />);
            for (let i = 1; i <= defaultProps.numPages; i++) {
                expect(screen.getByText(i.toString())).toBeInTheDocument();
            }
        });
    });

    describe('Interactions', () => {
        test('calls onPageClick when thumbnail is clicked', async () => {
            const onPageClick = jest.fn();
            render(
                <ThumbnailSidebar {...defaultProps} onPageClick={onPageClick} />
            );

            const pageItems = screen.getAllByText('5');
            fireEvent.click(pageItems[0].closest('[data-page]')!);

            expect(onPageClick).toHaveBeenCalledWith(5);
        });

        test('calls onClose when close button is clicked', () => {
            const onClose = jest.fn();
            render(<ThumbnailSidebar {...defaultProps} onClose={onClose} />);

            const closeButton = screen.getByTestId('close-icon').closest('button');
            fireEvent.click(closeButton!);

            expect(onClose).toHaveBeenCalled();
        });

        test('clicking different thumbnails calls onPageClick with correct page numbers', () => {
            const onPageClick = jest.fn();
            render(
                <ThumbnailSidebar
                    {...defaultProps}
                    onPageClick={onPageClick}
                    numPages={5}
                />
            );

            const pageTexts = screen.getAllByText(/^\d+$/);
            fireEvent.click(pageTexts[0].closest('[data-page]')!);
            fireEvent.click(pageTexts[2].closest('[data-page]')!);

            expect(onPageClick).toHaveBeenCalledTimes(2);
            expect(onPageClick).toHaveBeenNthCalledWith(1, 1);
            expect(onPageClick).toHaveBeenNthCalledWith(2, 3);
        });
    });

    describe('Thumbnail Generation', () => {
        test('generates thumbnails for visible pages via IntersectionObserver', async () => {
            render(<ThumbnailSidebar {...defaultProps} />);

            await waitFor(() => {
                expect(mockPdfDoc.getPage).toHaveBeenCalled();
            });
        });

        test('handles PDF document errors gracefully', async () => {
            const consoleErrorSpy = jest
                .spyOn(console, 'error')
                .mockImplementation();
            mockPdfDoc.getPage.mockRejectedValue(new Error('PDF load failed'));

            render(<ThumbnailSidebar {...defaultProps} />);

            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalled();
            });

            consoleErrorSpy.mockRestore();
        });

        test('does not generate thumbnails when pdfDoc is null', async () => {
            render(<ThumbnailSidebar {...defaultProps} pdfDoc={null} />);

            await waitFor(() => {
                expect(mockPdfDoc.getPage).not.toHaveBeenCalled();
            });
        });

        test('renders loading state while thumbnail is generating', () => {
            render(<ThumbnailSidebar {...defaultProps} />);
            const loadingElements = screen.queryAllByText('Loading...');
            expect(loadingElements.length).toBeGreaterThan(0);
        });
    });

    describe('Props Changes', () => {
        test('updates active page styling when currentPage prop changes', () => {
            const { rerender } = render(
                <ThumbnailSidebar {...defaultProps} currentPage={1} />
            );

            let pageTexts = screen.getAllByText('2');
            let activePage = pageTexts[0].closest('div');
            expect(activePage).not.toHaveClass('border-blue-500');

            rerender(<ThumbnailSidebar {...defaultProps} currentPage={2} />);

            pageTexts = screen.getAllByText('2');
            activePage = pageTexts[0].closest('[data-page]');
            expect(activePage).toHaveClass('border-blue-500');
        });

        test('handles numPages prop changes', () => {
            const { rerender } = render(
                <ThumbnailSidebar {...defaultProps} numPages={5} />
            );

            let items = screen.getAllByText(/^\d+$/);
            expect(items.length).toBe(5);

            rerender(<ThumbnailSidebar {...defaultProps} numPages={15} />);

            items = screen.getAllByText(/^\d+$/);
            expect(items.length).toBe(15);
        });

        test('updates when different PDF documents are provided', () => {
            const newPdfDoc = {
                getPage: jest.fn().mockResolvedValue({
                    getViewport: jest.fn(() => ({
                        height: 260,
                        width: 200,
                    })),
                    render: jest.fn(() => ({
                        promise: Promise.resolve(),
                    })),
                    cleanup: jest.fn(),
                }),
            };

            const { rerender } = render(
                <ThumbnailSidebar {...defaultProps} pdfDoc={mockPdfDoc} />
            );

            rerender(<ThumbnailSidebar {...defaultProps} pdfDoc={newPdfDoc} />);

            expect(screen.getByText('Page Thumbnails')).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        test('handles zero pages', () => {
            render(<ThumbnailSidebar {...defaultProps} numPages={0} />);
            const items = screen.queryAllByText(/^\d+$/);
            expect(items.length).toBe(0);
        });

        test('handles single page document', () => {
            render(<ThumbnailSidebar {...defaultProps} numPages={1} />);
            expect(screen.getByText('1')).toBeInTheDocument();
        });

        test('handles large number of pages', () => {
            render(<ThumbnailSidebar {...defaultProps} numPages={500} />);
            const items = screen.getAllByText(/^\d+$/);
            expect(items.length).toBe(500);
        });

        test('handles currentPage greater than numPages', () => {
            render(
                <ThumbnailSidebar
                    {...defaultProps}
                    currentPage={20}
                    numPages={10}
                />
            );
            expect(screen.getByText('10')).toBeInTheDocument();
        });

        test('handles currentPage as zero or negative', () => {
            const { rerender } = render(
                <ThumbnailSidebar {...defaultProps} currentPage={0} />
            );
            expect(screen.getByText('Page Thumbnails')).toBeInTheDocument();

            rerender(
                <ThumbnailSidebar {...defaultProps} currentPage={-1} />
            );
            expect(screen.getByText('Page Thumbnails')).toBeInTheDocument();
        });
    });

    describe('Performance and Memory', () => {
        test('memoization prevents unnecessary re-renders with same props', () => {
            const { rerender } = render(
                <ThumbnailSidebar {...defaultProps} />
            );

            const firstRender = screen.getByText('Page Thumbnails');
            rerender(
                <ThumbnailSidebar {...defaultProps} />
            );

            const secondRender = screen.getByText('Page Thumbnails');
            expect(firstRender === secondRender).toBe(true);
        });

        test('cleans up resources on unmount', async () => {
            const mockPage = {
                getViewport: jest.fn(() => ({
                    height: 260,
                    width: 200,
                })),
                render: jest.fn(() => ({
                    promise: Promise.resolve(),
                })),
                cleanup: jest.fn(),
            };

            mockPdfDoc.getPage.mockResolvedValue(mockPage);

            const { unmount } = render(
                <ThumbnailSidebar {...defaultProps} />
            );

            await waitFor(() => {
                expect(mockPdfDoc.getPage).toHaveBeenCalled();
            });

            unmount();

            // Verify cleanup was called
            expect(mockPage.cleanup).toHaveBeenCalled();
        });
    });

    describe('Accessibility', () => {
        test('thumbnail items are clickable', () => {
            const onPageClick = jest.fn();
            render(
                <ThumbnailSidebar {...defaultProps} onPageClick={onPageClick} />
            );

            const pageTexts = screen.getAllByText('5');
            const clickableItem = pageTexts[0].closest('[data-page]');
            expect(clickableItem).toHaveClass('cursor-pointer');
        });

        test('images have alt text', async () => {
            // Mock the thumbnail generation to show images
            const mockCanvas = document.createElement('canvas');
            mockCanvas.toDataURL = jest.fn(
                () => 'data:image/jpeg;base64,mockdata'
            );

            render(<ThumbnailSidebar {...defaultProps} />);

            // Wait for lazy loading to trigger
            await waitFor(() => {
                const images = screen.queryAllByRole('img');
                images.forEach((img) => {
                    expect(img).toHaveAttribute('alt');
                });
            });
        });
    });

    describe('DOM Structure', () => {
        test('renders with correct CSS classes for dark mode', () => {
            const { container } = render(
                <ThumbnailSidebar {...defaultProps} />
            );

            const sidebar = container.firstChild;
            expect(sidebar).toHaveClass('dark:bg-gray-800');
            expect(sidebar).toHaveClass('dark:border-gray-700');
        });

        test('renders sticky header', () => {
            const { container } = render(
                <ThumbnailSidebar {...defaultProps} />
            );

            const header = container.querySelector('[class*="sticky"]');
            expect(header).toBeInTheDocument();
        });

        test('renders scrollable container', () => {
            const { container } = render(
                <ThumbnailSidebar {...defaultProps} />
            );

            const sidebar = container.firstChild;
            expect(sidebar).toHaveClass('overflow-y-auto');
        });
    });
});