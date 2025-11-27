'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { sanitizeErrorMessage } from '@/lib/sanitize-text';
import TxtToolbar from './TxtToolbar';
import TxtSearchPanel from './TxtSearchPanel';
import TxtHighlightsPanel from './TxtHighlightsPanel';
import TxtDisplayOptionsPanel from './TxtDisplayOptionsPanel';
import TxtTTSPanel from './TxtTTSPanel';
import ColorPickerPopup from './ColorPickerPopup';

// Import custom hooks
import { useTxtFileLoader } from './hooks/useTxtFileLoader';
import { useTxtDisplayOptions } from './hooks/useTxtDisplayOptions';
import { useTxtHighlights, type Highlight } from './hooks/useTxtHighlights';
import { useTxtSearch } from './hooks/useTxtSearch';
import { useTxtTTS } from './hooks/useTxtTTS';
import { useTxtKeyboardShortcuts } from './hooks/useTxtKeyboardShortcuts';
import { useTxtSessionTracking } from './hooks/useTxtAnalytics';
import { X } from 'lucide-react';

interface TxtViewerProps {
  fileUrl: string;
  bookId: string;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onClose?: () => void;
}

export default function TxtViewer({ 
  fileUrl, 
  bookId, 
  currentPage = 0,
  onPageChange,
  onClose 
}: TxtViewerProps) {
  // Panel States
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showHighlightsPanel, setShowHighlightsPanel] = useState(false);
  const [showDisplayOptions, setShowDisplayOptions] = useState(false);
  const [showTTSPanel, setShowTTSPanel] = useState(false);
  const [enableTextSelection, setEnableTextSelection] = useState(false);
  // Local UI state to allow dismissing the keyboard shortcuts hint
  const [showShortcutsHint, setShowShortcutsHint] = useState(true);

  // Use custom hooks
  const {
    sections,
    currentSection,
    setCurrentSection,
    isLoading,
    error,
    sectionRefs,
    scrollContainerRef,
  } = useTxtFileLoader({
    fileUrl,
    currentPage,
    onPageChange,
  });

  const {
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    fontFamily,
    setFontFamily,
    lineHeight,
    increaseLineHeight,
    decreaseLineHeight,
    textAlign,
    setTextAlign,
    colorFilter,
    setColorFilter,
    customBgColor,
    setCustomBgColor,
    isFullscreen,
    toggleFullscreen,
    getBackgroundColor,
    getTextColor,
  } = useTxtDisplayOptions();

  const {
    highlights,
    isLoadingHighlights,
    pendingSelection,
    setPendingSelection,
    handleColorSelect,
    handleRemoveHighlight,
    handleJumpToHighlight,
    handleSaveNote,
    handleChangeColor,
  } = useTxtHighlights({
    bookId,
    sectionRefs,
  });

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    currentSearchIndex,
    setCurrentSearchIndex,
    isSearching,
    searchProgress,
    handleSearch,
    goToNextSearchResult,
    goToPrevSearchResult,
    clearSearch,
  } = useTxtSearch({
    sections,
    sectionRefs,
  });

  const {
    availableVoices,
    selectedVoice,
    setSelectedVoice,
    speechRate,
    setSpeechRate,
    speechPitch,
    setSpeechPitch,
    speechVolume,
    setSpeechVolume,
    isSpeaking,
    isPaused,
    toggleTextToSpeech,
    stopTextToSpeech,
    ttsError,
    voicesLoading,
  } = useTxtTTS({
    sections,
    currentSection,
    sectionRefs,
  });

  // ==================== Reading Session Tracking ====================
  // Track reading sessions for analytics
  useTxtSessionTracking(bookId, currentSection);

  // Text selection handler
  const handleTextSelection = useCallback(() => {
    if (!enableTextSelection) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const selectedText = selection.toString().trim();
    // Validate selection length to prevent abuse
    if (!selectedText || selectedText.length < 3 || selectedText.length > 5000) {
      return;
    }

    // Find which section contains the selection
    const range = selection.getRangeAt(0);
    let targetSectionIndex = currentSection; // Default to current visible section
    let sectionStartOffset = 0;

    // Try to find the exact section by checking if the selection is within a section element
    let node: Node | null = range.startContainer;
    while (node && node !== scrollContainerRef.current) {
      if (node instanceof HTMLElement && node.hasAttribute('data-section-index')) {
        targetSectionIndex = parseInt(node.getAttribute('data-section-index') || '0');
        break;
      }
      node = node.parentNode;
    }

    // Calculate position within the specific section
    const sectionElement = sectionRefs.current[targetSectionIndex];
    if (sectionElement) {
      const preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(sectionElement);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      sectionStartOffset = preSelectionRange.toString().length;
    }

    const start = sectionStartOffset;
    const end = start + selectedText.length;

    // Get mouse position
    const mouseEvent = window.event as MouseEvent;
    
    setPendingSelection({
      text: selectedText,
      position: { start, end },
      sectionIndex: targetSectionIndex,
      mouseX: mouseEvent?.clientX || window.innerWidth / 2,
      mouseY: mouseEvent?.clientY || window.innerHeight / 2,
    });
  }, [enableTextSelection, currentSection, setPendingSelection, scrollContainerRef, sectionRefs]);

  // Use keyboard shortcuts hook
  useTxtKeyboardShortcuts({
    enableTextSelection,
    onColorSelect: (color, hex) => {
      handleTextSelection();
      setTimeout(() => {
        handleColorSelect(color, hex);
      }, 50);
    },
  });

  // When enabling text selection, show the shortcuts hint again by default
  useEffect(() => {
    if (enableTextSelection) setShowShortcutsHint(true);
  }, [enableTextSelection]);

  // Cycle through font families
  const cycleFontFamily = useCallback(() => {
    const current = fontFamily;
    if (current === 'serif') {
      setFontFamily('sans-serif');
    } else if (current === 'sans-serif') {
      setFontFamily('monospace');
    } else {
      setFontFamily('serif');
    }
  }, [fontFamily, setFontFamily]);

  // Cycle through text alignments
  const cycleTextAlign = useCallback(() => {
    const current = textAlign;
    if (current === 'left') {
      setTextAlign('center');
    } else if (current === 'center') {
      setTextAlign('justify');
    } else {
      setTextAlign('left');
    }
  }, [textAlign, setTextAlign]);

  // Render all sections with highlights (memoized for performance)
  const renderAllSectionsWithHighlights = useMemo(() => {
    if (sections.length === 0) return null;

    // Initialize section refs array
    sectionRefs.current = new Array(sections.length);

    return sections.map((sectionText, sectionIndex) => {
      const sectionHighlights = highlights.filter(h => h.sectionIndex === sectionIndex);
      const currentSearchResult = searchResults.length > 0 ? searchResults[currentSearchIndex] : null;
      const showSearchHighlight = currentSearchResult && currentSearchResult.sectionIndex === sectionIndex;

    if (sectionHighlights.length === 0 && !showSearchHighlight) {
      return sectionText;
    }

    // Create a list of all ranges to highlight (both user highlights and search results)
    interface TextRange {
      start: number;
      end: number;
      type: 'highlight' | 'search';
      data?: Highlight;
    }

    const ranges: TextRange[] = [];

    // Add user highlights (with validation)
    sectionHighlights.forEach(highlight => {
      // Validate highlight has required position data
      if (highlight.position && typeof highlight.position.start === 'number' && typeof highlight.position.end === 'number') {
        ranges.push({
          start: highlight.position.start,
          end: highlight.position.end,
          type: 'highlight',
          data: highlight,
        });
      } else {
        logger.warn(`Skipping invalid highlight ${highlight.id}: missing or invalid position data`);
      }
    });

    // Add search result
    if (showSearchHighlight && currentSearchResult) {
      ranges.push({
        start: currentSearchResult.position.start,
        end: currentSearchResult.position.end,
        type: 'search',
      });
    }

    // Sort ranges by position
    ranges.sort((a, b) => a.start - b.start);

    // Merge overlapping ranges (search takes precedence over highlights)
    const mergedRanges: TextRange[] = [];
    for (const range of ranges) {
      if (mergedRanges.length === 0) {
        mergedRanges.push(range);
        continue;
      }

      const lastRange = mergedRanges[mergedRanges.length - 1];
      if (range.start <= lastRange.end) {
        // Overlapping - search takes precedence
        if (range.type === 'search') {
          lastRange.end = Math.max(lastRange.end, range.end);
          lastRange.type = 'search';
          delete lastRange.data;
        } else {
          lastRange.end = Math.max(lastRange.end, range.end);
        }
      } else {
        mergedRanges.push(range);
      }
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    mergedRanges.forEach((range, idx) => {
      // Add text before range
      if (range.start > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>
            {sectionText.slice(lastIndex, range.start)}
          </span>
        );
      }

      // Add highlighted/searched text
      if (range.type === 'search') {
        parts.push(
          <mark
            key={`search-${idx}`}
            style={{
              backgroundColor: '#ffeb3b',
              color: '#000',
              padding: '2px 0',
              borderRadius: '2px',
              border: '2px solid #fbc02d',
              fontWeight: 'bold',
            }}
          >
            {sectionText.slice(range.start, range.end)}
          </mark>
        );
      } else if (range.data) {
        parts.push(
          <mark
            key={`highlight-${range.data.id}`}
            className="transition-all duration-150 cursor-pointer hover:shadow-md hover:scale-[1.02]"
            style={{
              backgroundColor: range.data.hex,
              color: 'inherit',
              padding: '2px 4px',
              borderRadius: '3px',
              margin: '0 1px',
            }}
            title={range.data.note || 'Click to edit or remove highlight'}
            onClick={(e) => {
              e.stopPropagation();
              if (range.data) {
                handleJumpToHighlight(range.data.sectionIndex);
              }
            }}
          >
            {sectionText.slice(range.start, range.end)}
          </mark>
        );
      }

      lastIndex = range.end;
    });

    // Add remaining text
    if (lastIndex < sectionText.length) {
      parts.push(
        <span key="text-end">
          {sectionText.slice(lastIndex)}
        </span>
      );
    }

      // Return the section wrapped in a div with ref
      return (
        <div
          key={`section-${sectionIndex}`}
          ref={(el) => { sectionRefs.current[sectionIndex] = el; }}
          data-section-index={sectionIndex}
          className="pb-4 scroll-mt-4"
        >
          <div className="text-content">
            {parts}
          </div>
          {/* Optional section separator */}
          {sectionIndex < sections.length - 1 && (
            <div className="h-px bg-gray-100 dark:bg-gray-800 my-4 opacity-50" />
          )}
        </div>
      );
    });
  }, [sections, highlights, searchResults, currentSearchIndex, handleJumpToHighlight, sectionRefs]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-4 whitespace-pre-wrap break-words">
            {sanitizeErrorMessage(error)}
          </p>
          {onClose && (
            <Button onClick={onClose}>Close</Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col z-50 bg-background">
      {/* Toolbar */}
      <TxtToolbar
        showSearchPanel={showSearchPanel}
        setShowSearchPanel={setShowSearchPanel}
        showHighlightsPanel={showHighlightsPanel}
        setShowHighlightsPanel={setShowHighlightsPanel}
        showDisplayOptions={showDisplayOptions}
        setShowDisplayOptions={setShowDisplayOptions}
        showTTSPanel={showTTSPanel}
        setShowTTSPanel={setShowTTSPanel}
        highlightsCount={highlights.length}
        enableTextSelection={enableTextSelection}
        setEnableTextSelection={setEnableTextSelection}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        onClose={onClose}
      />

      {/* Main content area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto p-8 relative"
        style={{
          backgroundColor: getBackgroundColor,
          color: getTextColor,
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4 mx-auto" />
              <p className="text-muted-foreground">Loading text file...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Keyboard shortcuts hint (dismissible) */}
            {enableTextSelection && showShortcutsHint && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Quick Highlight Shortcuts:</strong> Select text and press <kbd className="px-2 py-1 bg-white rounded border">Ctrl+1-6</kbd> to highlight with different colors
                    <span className="ml-2">(1=Yellow, 2=Green, 3=Pink, 4=Blue, 5=Orange, 6=Purple)</span>
                  </p>
                </div>
                <button
                  aria-label="Dismiss shortcuts hint"
                  className="ml-4 text-blue-700 hover:text-blue-900"
                  onClick={() => setShowShortcutsHint(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div
              className="whitespace-pre-wrap break-words select-text"
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
                fontFamily: fontFamily === 'serif' 
                  ? 'Georgia, serif' 
                  : fontFamily === 'sans-serif' 
                  ? 'Arial, sans-serif' 
                  : 'Courier New, monospace',
                textAlign: textAlign === 'right' ? 'left' : textAlign,
                userSelect: 'text',
              }}
              onMouseUp={handleTextSelection}
            >
              {renderAllSectionsWithHighlights}
            </div>
          </div>
        )}

        {/* Search Panel */}
        {showSearchPanel && (
          <TxtSearchPanel
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onSearch={handleSearch}
            searchResults={searchResults}
            currentSearchIndex={currentSearchIndex}
            onPrev={goToPrevSearchResult}
            onNext={goToNextSearchResult}
            onSelectResult={(index) => {
              setCurrentSearchIndex(index);
              setCurrentSection(searchResults[index].sectionIndex);
            }}
            onClear={clearSearch}
            onClose={() => setShowSearchPanel(false)}
            isSearching={isSearching}
            searchProgress={searchProgress}
          />
        )}

        {/* Color Picker Popup */}
        {pendingSelection && (
          <ColorPickerPopup
            x={pendingSelection.mouseX}
            y={pendingSelection.mouseY}
            selectionHeight={20}
            onColorSelect={handleColorSelect}
            onDismiss={() => {
              setPendingSelection(null);
              window.getSelection()?.removeAllRanges();
            }}
          />
        )}
      </div>

      {/* Highlights Panel */}
      {showHighlightsPanel && (
        <>
          <div
            className="fixed inset-0"
            onClick={() => setShowHighlightsPanel(false)}
          />
          <TxtHighlightsPanel
            highlights={highlights}
            isLoading={isLoadingHighlights}
            onRemoveHighlight={handleRemoveHighlight}
            onJumpToHighlight={handleJumpToHighlight}
            onChangeColor={handleChangeColor}
            onSaveNote={handleSaveNote}
            onClose={() => setShowHighlightsPanel(false)}
          />
        </>
      )}

      {/* Display Options Panel */}
      {showDisplayOptions && (
        <>
          <div
            className="fixed inset-0"
            onClick={() => setShowDisplayOptions(false)}
          />
          <TxtDisplayOptionsPanel
            colorFilter={colorFilter}
            customBgColor={customBgColor}
            setColorFilter={setColorFilter}
            setCustomBgColor={setCustomBgColor}
            fontSize={fontSize}
            increaseFontSize={increaseFontSize}
            decreaseFontSize={decreaseFontSize}
            lineHeight={lineHeight}
            increaseLineHeight={increaseLineHeight}
            decreaseLineHeight={decreaseLineHeight}
            fontFamily={fontFamily}
            toggleFontFamily={cycleFontFamily}
            textAlign={textAlign === 'right' ? 'left' : textAlign}
            cycleTextAlign={cycleTextAlign}
            onClose={() => setShowDisplayOptions(false)}
          />
        </>
      )}

      {/* TTS Panel */}
      {showTTSPanel && (
        <>
          <div
            className="fixed inset-0"
            onClick={() => setShowTTSPanel(false)}
          />
          <TxtTTSPanel
            availableVoices={availableVoices}
            selectedVoice={selectedVoice}
            setSelectedVoice={setSelectedVoice}
            speechRate={speechRate}
            setSpeechRate={setSpeechRate}
            speechPitch={speechPitch}
            setSpeechPitch={setSpeechPitch}
            speechVolume={speechVolume}
            setSpeechVolume={setSpeechVolume}
            isSpeaking={isSpeaking}
            isPaused={isPaused}
            toggleTextToSpeech={toggleTextToSpeech}
            stopTextToSpeech={stopTextToSpeech}
            onClose={() => setShowTTSPanel(false)}
            ttsError={ttsError}
            voicesLoading={voicesLoading}
            currentSection={currentSection}
            totalSections={sections.length}
          />
        </>
      )}
    </div>
  );
}

