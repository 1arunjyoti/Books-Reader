import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TxtToolbar from '../TxtToolbar';

describe('TxtToolbar', () => {
    const defaultProps = {
        showSearchPanel: false,
        setShowSearchPanel: jest.fn(),
        showHighlightsPanel: false,
        setShowHighlightsPanel: jest.fn(),
        showDisplayOptions: false,
        setShowDisplayOptions: jest.fn(),
        showTTSPanel: false,
        setShowTTSPanel: jest.fn(),
        highlightsCount: 0,
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
        it('should render toolbar with title', () => {
            render(<TxtToolbar {...defaultProps} />);
            expect(screen.getByText('Text Reader')).toBeInTheDocument();
        });

        it('should render all action buttons', () => {
            render(<TxtToolbar {...defaultProps} />);
            expect(screen.getByTitle('Search')).toBeInTheDocument();
            expect(screen.getByTitle(/Highlights/)).toBeInTheDocument();
            expect(screen.getByTitle('Display Options')).toBeInTheDocument();
            expect(screen.getByTitle('Text-to-Speech')).toBeInTheDocument();
            expect(screen.getByTitle(/text selection/i)).toBeInTheDocument();
        });

        it('should render close button when onClose is provided', () => {
            render(<TxtToolbar {...defaultProps} onClose={jest.fn()} />);
            expect(screen.getByTitle('Close reader')).toBeInTheDocument();
        });

        it('should not render close button when onClose is not provided', () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { onClose, ...propsWithoutClose } = defaultProps;
            render(<TxtToolbar {...propsWithoutClose} />);
            expect(screen.queryByTitle('Close reader')).not.toBeInTheDocument();
        });
    });

    describe('Panel Toggle Functionality', () => {
        it('should toggle search panel', () => {
            const setShowSearchPanel = jest.fn();
            render(
                <TxtToolbar {...defaultProps} setShowSearchPanel={setShowSearchPanel} />
            );
            fireEvent.click(screen.getByTitle('Search'));
            expect(setShowSearchPanel).toHaveBeenCalledWith(true);
        });

        it('should toggle highlights panel', () => {
            const setShowHighlightsPanel = jest.fn();
            render(
                <TxtToolbar
                    {...defaultProps}
                    setShowHighlightsPanel={setShowHighlightsPanel}
                    highlightsCount={5}
                />
            );
            fireEvent.click(screen.getByTitle(/Highlights/));
            expect(setShowHighlightsPanel).toHaveBeenCalledWith(true);
        });

        it('should toggle display options', () => {
            const setShowDisplayOptions = jest.fn();
            render(
                <TxtToolbar {...defaultProps} setShowDisplayOptions={setShowDisplayOptions} />
            );
            fireEvent.click(screen.getByTitle('Display Options'));
            expect(setShowDisplayOptions).toHaveBeenCalledWith(true);
        });

        it('should toggle TTS panel', () => {
            const setShowTTSPanel = jest.fn();
            render(
                <TxtToolbar {...defaultProps} setShowTTSPanel={setShowTTSPanel} />
            );
            fireEvent.click(screen.getByTitle('Text-to-Speech'));
            expect(setShowTTSPanel).toHaveBeenCalledWith(true);
        });
    });

    describe('Highlights Badge', () => {
        it('should display highlights count badge', () => {
            render(<TxtToolbar {...defaultProps} highlightsCount={3} />);
            expect(screen.getByText('3')).toBeInTheDocument();
        });

        it('should display 9+ when highlights exceed 9', () => {
            render(<TxtToolbar {...defaultProps} highlightsCount={15} />);
            expect(screen.getByText('9+')).toBeInTheDocument();
        });

        it('should not display badge when highlights count is 0', () => {
            render(<TxtToolbar {...defaultProps} highlightsCount={0} />);
            expect(screen.queryByText('0')).not.toBeInTheDocument();
        });

        it('should disable highlights button when count is 0', () => {
            render(<TxtToolbar {...defaultProps} highlightsCount={0} />);
            const highlightsButton = screen.getByTitle(/Highlights/);
            expect(highlightsButton).toBeDisabled();
        });

        it('should enable highlights button when count > 0', () => {
            render(<TxtToolbar {...defaultProps} highlightsCount={1} />);
            const highlightsButton = screen.getByTitle(/Highlights/);
            expect(highlightsButton).not.toBeDisabled();
        });
    });

    describe('Text Selection Toggle', () => {
        it('should toggle text selection', () => {
            const setEnableTextSelection = jest.fn();
            render(
                <TxtToolbar {...defaultProps} setEnableTextSelection={setEnableTextSelection} />
            );
            fireEvent.click(screen.getByTitle(/Enable text selection/));
            expect(setEnableTextSelection).toHaveBeenCalledWith(true);
        });

        it('should show disabled title when text selection is enabled', () => {
            render(<TxtToolbar {...defaultProps} enableTextSelection={true} />);
            expect(
                screen.getByTitle(/Disable text selection/)
            ).toBeInTheDocument();
        });

        it('should apply yellow styling when text selection is enabled', () => {
            render(
                <TxtToolbar {...defaultProps} enableTextSelection={true} />
            );
            const typeButton = screen.getByTitle(/Disable text selection/);
            expect(typeButton).toHaveClass('bg-blue-200', 'dark:bg-blue-900');
        });
    });

    describe('Fullscreen Functionality', () => {
        it('should toggle fullscreen', () => {
            const toggleFullscreen = jest.fn();
            render(
                <TxtToolbar {...defaultProps} toggleFullscreen={toggleFullscreen} />
            );
            fireEvent.click(screen.getByTitle('Fullscreen'));
            expect(toggleFullscreen).toHaveBeenCalled();
        });

        it('should show exit fullscreen title when in fullscreen', () => {
            render(<TxtToolbar {...defaultProps} isFullscreen={true} />);
            expect(screen.getByTitle('Exit fullscreen')).toBeInTheDocument();
        });

        it('should show enter fullscreen title when not in fullscreen', () => {
            render(<TxtToolbar {...defaultProps} isFullscreen={false} />);
            expect(screen.getByTitle('Fullscreen')).toBeInTheDocument();
        });
    });

    describe('Close Handler', () => {
        it('should call onClose when close button is clicked', () => {
            const onClose = jest.fn();
            render(<TxtToolbar {...defaultProps} onClose={onClose} />);
            fireEvent.click(screen.getByTitle('Close reader'));
            expect(onClose).toHaveBeenCalled();
        });
    });

    describe('Visual States', () => {
        it('should apply active state styling to search button when panel is open', () => {
            render(<TxtToolbar {...defaultProps} showSearchPanel={true} />);
            const searchButton = screen.getByTitle('Search');
            expect(searchButton).toHaveClass('bg-blue-200', 'dark:bg-blue-900');
        });

        it('should apply active state styling to highlights button when panel is open', () => {
            render(
                <TxtToolbar
                    {...defaultProps}
                    showHighlightsPanel={true}
                    highlightsCount={5}
                />
            );
            const highlightsButton = screen.getByTitle(/Highlights/);
            expect(highlightsButton).toHaveClass('bg-blue-200', 'dark:bg-blue-900');
        });

        it('should apply active state styling to display options button when panel is open', () => {
            render(<TxtToolbar {...defaultProps} showDisplayOptions={true} />);
            const settingsButton = screen.getByTitle('Display Options');
            expect(settingsButton).toHaveClass('bg-blue-200', 'dark:bg-blue-900');
        });

        it('should apply active state styling to TTS button when panel is open', () => {
            render(<TxtToolbar {...defaultProps} showTTSPanel={true} />);
            const ttsButton = screen.getByTitle('Text-to-Speech');
            expect(ttsButton).toHaveClass('bg-blue-200', 'dark:bg-blue-900');
        });
    });

    describe('Edge Cases', () => {
        it('should handle negative highlights count gracefully', () => {
            render(<TxtToolbar {...defaultProps} highlightsCount={-1} />);
            expect(screen.queryByText(/9\+|-1/)).not.toBeInTheDocument();
        });

        it('should handle large highlights count', () => {
            render(<TxtToolbar {...defaultProps} highlightsCount={999} />);
            expect(screen.getByText('9+')).toBeInTheDocument();
        });

        it('should render with all panels open', () => {
            render(
                <TxtToolbar
                    {...defaultProps}
                    showSearchPanel={true}
                    showHighlightsPanel={true}
                    showDisplayOptions={true}
                    showTTSPanel={true}
                    highlightsCount={5}
                />
            );
            expect(screen.getByTitle('Search')).toHaveClass('bg-blue-200', 'dark:bg-blue-900');
            expect(screen.getByTitle(/Highlights/)).toHaveClass('bg-blue-200', 'dark:bg-blue-900');
            expect(screen.getByTitle('Display Options')).toHaveClass('bg-blue-200', 'dark:bg-blue-900');
            expect(screen.getByTitle('Text-to-Speech')).toHaveClass('bg-blue-200', 'dark:bg-blue-900');
        });

        it('should handle multiple rapid clicks on toggle buttons', () => {
            const setShowSearchPanel = jest.fn();
            render(
                <TxtToolbar {...defaultProps} setShowSearchPanel={setShowSearchPanel} />
            );
            const searchButton = screen.getByTitle('Search');
            fireEvent.click(searchButton);
            fireEvent.click(searchButton);
            fireEvent.click(searchButton);
            expect(setShowSearchPanel).toHaveBeenCalledTimes(3);
        });
    });

    describe('Accessibility', () => {
        it('should have appropriate titles for all buttons', () => {
            render(<TxtToolbar {...defaultProps} highlightsCount={3} />);
            expect(screen.getByTitle('Search')).toBeInTheDocument();
            expect(screen.getByTitle('Highlights (3)')).toBeInTheDocument();
            expect(screen.getByTitle('Display Options')).toBeInTheDocument();
            expect(screen.getByTitle('Text-to-Speech')).toBeInTheDocument();
            expect(screen.getByTitle('Fullscreen')).toBeInTheDocument();
        });
    });
});