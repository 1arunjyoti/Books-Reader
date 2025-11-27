import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EpubTTSPanel from '../EpubTTSPanel';

// Mock sanitize-text
jest.mock('@/lib/sanitize-text', () => ({
  sanitizeErrorMessage: jest.fn((msg: string) => msg),
}));

describe('EpubTTSPanel', () => {
  const mockVoices: SpeechSynthesisVoice[] = [
    { name: 'Google US English', lang: 'en-US', default: true, localService: false, voiceURI: '' },
    { name: 'Google UK English', lang: 'en-GB', default: false, localService: false, voiceURI: '' },
    { name: 'Google español', lang: 'es-ES', default: false, localService: false, voiceURI: '' },
  ];

  const defaultProps = {
    availableVoices: mockVoices,
    selectedVoice: mockVoices[0],
    setSelectedVoice: jest.fn(),
    speechRate: 1.0,
    setSpeechRate: jest.fn(),
    speechPitch: 1.0,
    setSpeechPitch: jest.fn(),
    speechVolume: 1.0,
    setSpeechVolume: jest.fn(),
    isSpeaking: false,
    isPaused: false,
    toggleTextToSpeech: jest.fn(),
    stopTextToSpeech: jest.fn(),
    onClose: jest.fn(),
    ttsError: null,
    voicesLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the panel with heading', () => {
      render(<EpubTTSPanel {...defaultProps} />);
      
      expect(screen.getByText('Text-to-Speech')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<EpubTTSPanel {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should render all control sections', () => {
      render(<EpubTTSPanel {...defaultProps} />);
      
      expect(screen.getByText('Voice')).toBeInTheDocument();
      expect(screen.getByText('Speed')).toBeInTheDocument();
      expect(screen.getByText('Pitch')).toBeInTheDocument();
      expect(screen.getByText('Volume')).toBeInTheDocument();
    });

    it('should render panel with correct styling classes', () => {
      const { container } = render(<EpubTTSPanel {...defaultProps} />);
      
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('absolute', 'top-16', 'right-0', 'bottom-0', 'w-80');
      expect(panel).toHaveClass('bg-white/90', 'dark:bg-gray-900/90');
      expect(panel).toHaveClass('border-l', 'border-gray-200', 'dark:border-gray-700');
    });
  });

  describe('Voice Selection', () => {
    it('should render voice selector with all available voices', () => {
      render(<EpubTTSPanel {...defaultProps} />);
      
      expect(screen.getByText('Google US English (en-US)')).toBeInTheDocument();
      expect(screen.getByText('Google UK English (en-GB)')).toBeInTheDocument();
      expect(screen.getByText('Google español (es-ES)')).toBeInTheDocument();
    });

    it('should show loading state when voices are loading', () => {
      render(<EpubTTSPanel {...defaultProps} voicesLoading={true} />);
      
      expect(screen.getByText('Loading voices...')).toBeInTheDocument();
      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('should call setSelectedVoice when changing voice', () => {
      render(<EpubTTSPanel {...defaultProps} />);
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'Google UK English' } });
      
      expect(defaultProps.setSelectedVoice).toHaveBeenCalledWith(mockVoices[1]);
    });

    it('should select the current voice', () => {
      render(<EpubTTSPanel {...defaultProps} selectedVoice={mockVoices[1]} />);
      
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('Google UK English');
    });
  });

  describe('Speech Rate Control', () => {
    it('should display current speech rate', () => {
      render(<EpubTTSPanel {...defaultProps} speechRate={1.2} />);
      
      expect(screen.getByText('Speed')).toBeInTheDocument();
      expect(screen.getByText('1.2x')).toBeInTheDocument();
    });

    it('should call setSpeechRate when adjusting rate slider', () => {
      render(<EpubTTSPanel {...defaultProps} />);
      
      const sliders = screen.getAllByRole('slider');
      const rateSlider = sliders[0]; // First slider is speech rate
      
      fireEvent.change(rateSlider, { target: { value: '1.3' } });
      
      expect(defaultProps.setSpeechRate).toHaveBeenCalledWith(1.3);
    });

    it('should display rate range labels', () => {
      render(<EpubTTSPanel {...defaultProps} />);
      
      // Labels changed to Slow/Normal/Fast
      const labels = screen.getAllByText(/Slow|Normal|Fast/);
      expect(labels.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle minimum rate value', () => {
      render(<EpubTTSPanel {...defaultProps} speechRate={0.5} />);
      
      expect(screen.getByText('Speed: 0.5x')).toBeInTheDocument();
    });

    it('should handle maximum rate value', () => {
      render(<EpubTTSPanel {...defaultProps} speechRate={1.5} />);
      
      expect(screen.getByText('Speed: 1.5x')).toBeInTheDocument();
    });
  });

  describe('Speech Pitch Control', () => {
    it('should display current speech pitch', () => {
      render(<EpubTTSPanel {...defaultProps} speechPitch={0.8} />);
      
      expect(screen.getByText('Pitch: 0.8')).toBeInTheDocument();
    });

    it('should call setSpeechPitch when adjusting pitch slider', () => {
      render(<EpubTTSPanel {...defaultProps} />);
      
      const sliders = screen.getAllByRole('slider');
      const pitchSlider = sliders[1]; // Second slider is speech pitch
      
      fireEvent.change(pitchSlider, { target: { value: '1.2' } });
      
      expect(defaultProps.setSpeechPitch).toHaveBeenCalledWith(1.2);
    });

    it('should display pitch range labels', () => {
      render(<EpubTTSPanel {...defaultProps} />);
      
      expect(screen.getByText('Low')).toBeInTheDocument();
      const normalLabels = screen.getAllByText('Normal');
      expect(normalLabels.length).toBeGreaterThan(0);
      expect(screen.getByText('High')).toBeInTheDocument();
    });
  });

  describe('Speech Volume Control', () => {
    it('should display current speech volume as percentage', () => {
      render(<EpubTTSPanel {...defaultProps} speechVolume={0.8} />);
      
      expect(screen.getByText('Volume: 80%')).toBeInTheDocument();
    });

    it('should call setSpeechVolume when adjusting volume slider', () => {
      render(<EpubTTSPanel {...defaultProps} />);
      
      const sliders = screen.getAllByRole('slider');
      const volumeSlider = sliders[2]; // Third slider is volume
      
      fireEvent.change(volumeSlider, { target: { value: '0.5' } });
      
      expect(defaultProps.setSpeechVolume).toHaveBeenCalledWith(0.5);
    });

    it('should display volume range labels', () => {
      render(<EpubTTSPanel {...defaultProps} />);
      
      const percentLabels = screen.getAllByText(/0%|50%|100%/);
      expect(percentLabels.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle volume at 0%', () => {
      render(<EpubTTSPanel {...defaultProps} speechVolume={0} />);
      
      expect(screen.getByText('Volume: 0%')).toBeInTheDocument();
    });

    it('should handle volume at 100%', () => {
      render(<EpubTTSPanel {...defaultProps} speechVolume={1} />);
      
      expect(screen.getByText('Volume: 100%')).toBeInTheDocument();
    });
  });

  describe('Playback Controls', () => {
    it('should show Start button when not speaking', () => {
      render(<EpubTTSPanel {...defaultProps} isSpeaking={false} />);
      
      expect(screen.getByText('Start')).toBeInTheDocument();
    });

    it('should show Pause button when speaking', () => {
      render(<EpubTTSPanel {...defaultProps} isSpeaking={true} isPaused={false} />);
      
      expect(screen.getByText('Pause')).toBeInTheDocument();
    });

    it('should show Resume button when paused', () => {
      render(<EpubTTSPanel {...defaultProps} isSpeaking={true} isPaused={true} />);
      
      expect(screen.getByText('Resume')).toBeInTheDocument();
    });

    it('should show Stop button when speaking', () => {
      render(<EpubTTSPanel {...defaultProps} isSpeaking={true} />);
      
      expect(screen.getByText('Stop')).toBeInTheDocument();
    });

    it('should not show Stop button when not speaking', () => {
      render(<EpubTTSPanel {...defaultProps} isSpeaking={false} />);
      
      expect(screen.queryByText('Stop')).not.toBeInTheDocument();
    });

    it('should call toggleTextToSpeech when clicking Start', () => {
      render(<EpubTTSPanel {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Start'));
      
      expect(defaultProps.toggleTextToSpeech).toHaveBeenCalledTimes(1);
    });

    it('should call toggleTextToSpeech when clicking Pause', () => {
      render(<EpubTTSPanel {...defaultProps} isSpeaking={true} isPaused={false} />);
      
      fireEvent.click(screen.getByText('Pause'));
      
      expect(defaultProps.toggleTextToSpeech).toHaveBeenCalledTimes(1);
    });

    it('should call toggleTextToSpeech when clicking Resume', () => {
      render(<EpubTTSPanel {...defaultProps} isSpeaking={true} isPaused={true} />);
      
      fireEvent.click(screen.getByText('Resume'));
      
      expect(defaultProps.toggleTextToSpeech).toHaveBeenCalledTimes(1);
    });

    it('should call stopTextToSpeech when clicking Stop', () => {
      render(<EpubTTSPanel {...defaultProps} isSpeaking={true} />);
      
      fireEvent.click(screen.getByText('Stop'));
      
      expect(defaultProps.stopTextToSpeech).toHaveBeenCalledTimes(1);
    });
  });

  describe('Status Display', () => {
    it('should show Reading status when speaking', () => {
      render(<EpubTTSPanel {...defaultProps} isSpeaking={true} isPaused={false} />);
      
      expect(screen.getByText('▶️ Reading...')).toBeInTheDocument();
    });

    it('should show Paused status when paused', () => {
      render(<EpubTTSPanel {...defaultProps} isSpeaking={true} isPaused={true} />);
      
      expect(screen.getByText('⏸️ Paused')).toBeInTheDocument();
    });

    it('should not show status when not speaking', () => {
      render(<EpubTTSPanel {...defaultProps} isSpeaking={false} />);
      
      expect(screen.queryByText('▶️ Reading...')).not.toBeInTheDocument();
      expect(screen.queryByText('⏸️ Paused')).not.toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should display error message when ttsError is provided', () => {
      render(<EpubTTSPanel {...defaultProps} ttsError="Speech synthesis failed" />);
      
      expect(screen.getByText('Error: Speech synthesis failed')).toBeInTheDocument();
    });

    it('should not display error when ttsError is null', () => {
      render(<EpubTTSPanel {...defaultProps} ttsError={null} />);
      
      expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
    });

    it('should apply error styling to error message', () => {
      render(<EpubTTSPanel {...defaultProps} ttsError="Test error" />);
      
      const errorText = screen.getByText(/Error:/);
      const errorDiv = errorText.closest('div[class*="text-red"]');
      expect(errorDiv).toHaveClass('text-red-700', 'bg-red-100');
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', () => {
      render(<EpubTTSPanel {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.querySelector('.lucide-x'));
      
      expect(closeButton).toBeInTheDocument();
      fireEvent.click(closeButton!);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Panel Styling', () => {
    it('should have fixed positioning classes', () => {
      const { container } = render(<EpubTTSPanel {...defaultProps} />);
      
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('absolute');
    });

    it('should have shadow and z-index classes', () => {
      const { container } = render(<EpubTTSPanel {...defaultProps} />);
      
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('shadow-lg', 'z-20');
    });

    it('should have flex layout classes', () => {
      const { container } = render(<EpubTTSPanel {...defaultProps} />);
      
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('flex', 'flex-col');
    });

    it('should have overflow-y-auto class for scrolling', () => {
      const { container } = render(<EpubTTSPanel {...defaultProps} />);
      
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('overflow-y-auto');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty voices list', () => {
      render(<EpubTTSPanel {...defaultProps} availableVoices={[]} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('should handle null selected voice', () => {
      render(<EpubTTSPanel {...defaultProps} selectedVoice={null} availableVoices={[]} />);
      
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('');
    });

    it('should handle fractional volume percentages', () => {
      render(<EpubTTSPanel {...defaultProps} speechVolume={0.75} />);
      
      expect(screen.getByText('Volume: 75%')).toBeInTheDocument();
    });

    it('should handle very long error messages', () => {
      const longError = 'A'.repeat(200);
      render(<EpubTTSPanel {...defaultProps} ttsError={longError} />);
      
      expect(screen.getByText(`Error: ${longError}`)).toBeInTheDocument();
    });

    it('should handle voice with special characters in name', () => {
      const specialVoices: SpeechSynthesisVoice[] = [
        { name: 'Voice "Test" & More', lang: 'en-US', default: false, localService: false, voiceURI: '' },
      ];
      render(<EpubTTSPanel {...defaultProps} availableVoices={specialVoices} selectedVoice={specialVoices[0]} />);
      
      expect(screen.getByText('Voice "Test" & More (en-US)')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<EpubTTSPanel {...defaultProps} />);
      
      const heading = screen.getByText('Text-to-Speech');
      expect(heading).toHaveClass('text-lg', 'font-semibold');
    });

    it('should have labels for all controls', () => {
      render(<EpubTTSPanel {...defaultProps} />);
      
      expect(screen.getByText('Voice')).toBeInTheDocument();
      expect(screen.getByText(/Speed:/)).toBeInTheDocument();
      expect(screen.getByText(/Pitch:/)).toBeInTheDocument();
      expect(screen.getByText(/Volume:/)).toBeInTheDocument();
    });

    it('should have accessible slider controls', () => {
      render(<EpubTTSPanel {...defaultProps} />);
      
      const sliders = screen.getAllByRole('slider');
      expect(sliders.length).toBe(3); // Rate, pitch, volume
    });
  });

  describe('Integration', () => {
    it('should support full workflow: render -> adjust settings -> play -> stop -> close', () => {
      render(<EpubTTSPanel {...defaultProps} />);
      
      // Change voice
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'Google UK English' } });
      expect(defaultProps.setSelectedVoice).toHaveBeenCalled();
      
      // Adjust rate
      const sliders = screen.getAllByRole('slider');
      fireEvent.change(sliders[0], { target: { value: '1.2' } });
      expect(defaultProps.setSpeechRate).toHaveBeenCalled();
      
      // Start speaking
      fireEvent.click(screen.getByText('Start'));
      expect(defaultProps.toggleTextToSpeech).toHaveBeenCalled();
      
      // Close panel
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.querySelector('.lucide-x'));
      fireEvent.click(closeButton!);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should support play -> pause -> resume -> stop workflow', () => {
      const { rerender } = render(<EpubTTSPanel {...defaultProps} />);
      
      // Start
      fireEvent.click(screen.getByText('Start'));
      expect(defaultProps.toggleTextToSpeech).toHaveBeenCalledTimes(1);
      
      // Pause
      rerender(<EpubTTSPanel {...defaultProps} isSpeaking={true} isPaused={false} />);
      fireEvent.click(screen.getByText('Pause'));
      expect(defaultProps.toggleTextToSpeech).toHaveBeenCalledTimes(2);
      
      // Resume
      rerender(<EpubTTSPanel {...defaultProps} isSpeaking={true} isPaused={true} />);
      fireEvent.click(screen.getByText('Resume'));
      expect(defaultProps.toggleTextToSpeech).toHaveBeenCalledTimes(3);
      
      // Stop
      rerender(<EpubTTSPanel {...defaultProps} isSpeaking={true} isPaused={false} />);
      fireEvent.click(screen.getByText('Stop'));
      expect(defaultProps.stopTextToSpeech).toHaveBeenCalledTimes(1);
    });
  });
});
