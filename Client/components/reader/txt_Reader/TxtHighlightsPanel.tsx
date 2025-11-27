'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Trash2, Copy, ChevronDown, StickyNote, Save, Filter, MapPin } from 'lucide-react';
import { sanitizeText } from '@/lib/sanitize-text';

// Available highlight colors
const HIGHLIGHT_COLORS = [
  { name: 'Yellow', color: 'yellow', hex: '#ffff00' },
  { name: 'Green', color: 'green', hex: '#00ff00' },
  { name: 'Pink', color: 'pink', hex: '#ff69b4' },
  { name: 'Blue', color: 'blue', hex: '#87ceeb' },
  { name: 'Orange', color: 'orange', hex: '#ffa500' },
  { name: 'Purple', color: 'purple', hex: '#dda0dd' },
];

interface Highlight {
  id: string;
  text: string;
  position: { start: number; end: number };
  color: string;
  hex: string;
  note?: string;
  createdAt?: string;
  sectionIndex: number;
}

interface TxtHighlightsPanelProps {
  highlights: Highlight[];
  isLoading?: boolean;
  onRemoveHighlight: (highlightId: string) => void;
  onJumpToHighlight: (sectionIndex: number) => void;
  onChangeColor: (highlightId: string) => void;
  onSaveNote: (highlightId: string, note: string) => void;
  onClose: () => void;
}

export default function TxtHighlightsPanel({
  highlights,
  isLoading = false,
  onRemoveHighlight,
  onJumpToHighlight,
  onChangeColor,
  onSaveNote,
  onClose,
}: TxtHighlightsPanelProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  // Memoize handleClose to prevent listener churn
  const handleClose = useCallback(() => onClose(), [onClose]);

  // Handle click outside to close panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    // Use passive listener for better performance
    document.addEventListener('mousedown', handleClickOutside, { passive: true } as AddEventListenerOptions);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClose]);

  const handleCopyText = (text: string, index: number) => {
    const sanitizedText = sanitizeText(text, { maxLength: 5000 });
    navigator.clipboard.writeText(sanitizedText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleEditNote = (highlightId: string, currentNote?: string) => {
    setEditingNoteId(highlightId);
    setNoteText(currentNote || '');
  };

  const handleSaveNote = async (highlightId: string) => {
    setSavingNoteId(highlightId);
    try {
      const sanitizedNote = sanitizeText(noteText, {
        maxLength: 1000,
        allowNewlines: true,
        trimWhitespace: true,
      });
      await onSaveNote(highlightId, sanitizedNote);
      setEditingNoteId(null);
    } catch (error) {
      logger.error('Error saving note:', error);
    } finally {
      setSavingNoteId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setNoteText('');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const toggleColorFilter = (color: string) => {
    const newSelectedColors = new Set(selectedColors);
    if (newSelectedColors.has(color)) {
      newSelectedColors.delete(color);
    } else {
      newSelectedColors.add(color);
    }
    setSelectedColors(newSelectedColors);
  };

  // Filter highlights by selected colors
  const filteredHighlights = selectedColors.size === 0
    ? highlights
    : highlights.filter(h => selectedColors.has(h.color));

  // Virtual scrolling setup
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: filteredHighlights.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  const activeFilterCount = selectedColors.size;

  const clearFilters = () => {
    setSelectedColors(new Set());
  };

  return (
    <div 
      className="absolute top-16 right-0 bottom-0 w-80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-l border-gray-200/50 dark:border-gray-700/50 shadow-2xl z-20 flex flex-col overflow-y-auto custom-scrollbar"
      ref={panelRef}
    >
      {/* Header */}
      <div className="flex flex-col border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
        <div className="flex items-center justify-between p-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Highlights
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {filteredHighlights.length} shown
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={activeFilterCount > 0 ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`h-8 gap-1 rounded-full relative flex items-center justify-center transition-all ${
                activeFilterCount > 0 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                  : 'bg-gray-100/50 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm border border-white dark:border-gray-900">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-full flex items-center justify-center bg-gray-100/50 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="px-4 pb-4 space-y-3 border-t border-gray-200/50 dark:border-gray-700/50 pt-3 bg-gray-50/50 dark:bg-gray-800/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Filter by Color
              </span>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-6 text-[10px] px-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  Clear All
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {HIGHLIGHT_COLORS.map((colorOption) => {
                const count = highlights.filter(h => h.color === colorOption.color).length;
                return (
                  <div key={colorOption.color} className="flex items-center gap-2">
                    <Checkbox
                      id={`filter-${colorOption.color}`}
                      checked={selectedColors.has(colorOption.color)}
                      onCheckedChange={() => toggleColorFilter(colorOption.color)}
                      disabled={count === 0}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label
                      htmlFor={`filter-${colorOption.color}`}
                      className={`flex items-center gap-2 text-sm flex-1 cursor-pointer select-none ${
                        count === 0 ? 'opacity-40' : ''
                      }`}
                    >
                      <div
                        className="h-3 w-3 rounded-full shadow-sm border border-black/5"
                        style={{ 
                          backgroundColor: colorOption.hex,
                          opacity: 0.9
                        }}
                      />
                      <span className="text-gray-700 dark:text-gray-300 font-medium text-xs">
                        {colorOption.name}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                        {count}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading highlights...</p>
          </div>
        </div>
      ) : highlights.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div className="flex flex-col items-center gap-3 max-w-[200px]">
            <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <StickyNote className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              No highlights yet
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Select any text in the book to create a highlight and add notes.
            </p>
          </div>
        </div>
      ) : filteredHighlights.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            No highlights match the selected filters.
          </p>
        </div>
      ) : (
        <div 
          ref={parentRef}
          className="flex-1 overflow-y-auto custom-scrollbar"
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const highlight = filteredHighlights[virtualItem.index];
              const index = virtualItem.index;
              const isExpanded = expandedIndex === index;
              const isEditingNote = editingNoteId === highlight.id;

              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="border-b border-gray-100 dark:border-gray-800/50"
                >
                  <div className="p-4 hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors group">
                    {/* Highlight Text Preview */}
                    <div className="flex items-start gap-3">
                      <div 
                        className="h-2.5 w-2.5 rounded-full mt-1.5 flex-shrink-0 shadow-sm border border-black/5"
                        style={{ 
                          backgroundColor: highlight.hex,
                          opacity: 0.9
                        }}
                      />
                      <div 
                        onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        className="w-full text-left cursor-pointer flex items-start gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 break-words font-medium leading-relaxed">
                            &quot;{highlight.text}&quot;
                          </p>
                          {highlight.note && (
                            <div className="flex items-center gap-1.5 mt-2 bg-blue-50/50 dark:bg-blue-900/10 p-1.5 rounded-md border border-blue-100 dark:border-blue-900/30 w-fit max-w-full">
                              <StickyNote className="h-3 w-3 text-blue-500 flex-shrink-0" />
                              <p className="text-xs text-blue-700 dark:text-blue-300 line-clamp-1 truncate">
                                {highlight.note}
                              </p>
                            </div>
                          )}
                          {/* Metadata: Section and Date */}
                          <div className="flex items-center gap-2 mt-2 text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">
                            {highlight.sectionIndex !== undefined && (
                              <span>Section {highlight.sectionIndex + 1}</span>
                            )}
                            {highlight.sectionIndex !== undefined && highlight.createdAt && (
                              <span>•</span>
                            )}
                            {highlight.createdAt && (
                              <span>{formatDate(highlight.createdAt)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 self-start">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onJumpToHighlight(highlight.sectionIndex);
                            }}
                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                            title="Jump to highlight"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                          </button>
                          <ChevronDown
                            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                              expandedIndex === index ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded View */}
                    {isExpanded && (
                      <div className="mt-4 ml-[1.375rem] space-y-4 border-l-2 border-gray-100 dark:border-gray-800 pl-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">
                          {highlight.text}
                        </p>

                        {/* Note Section */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                              <StickyNote className="h-3 w-3" />
                              Note
                            </label>
                            {!editingNoteId || editingNoteId !== highlight.id ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditNote(highlight.id, highlight.note)}
                                className="text-[10px] h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                              >
                                {highlight.note ? 'Edit Note' : 'Add Note'}
                              </Button>
                            ) : null}
                          </div>

                          {isEditingNote ? (
                            <div className="space-y-2 bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                              <Textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Add your note here... (max 500 characters)"
                                maxLength={500}
                                rows={3}
                                className="p-2 text-xs resize-none border-0 focus-visible:ring-0 bg-transparent"
                                autoFocus
                              />
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                                <span className="text-[10px] text-gray-400">
                                  {noteText.length}/500
                                </span>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancelEdit}
                                    className="text-[10px] h-6 px-2"
                                    disabled={savingNoteId === highlight.id}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleSaveNote(highlight.id)}
                                    className="text-[10px] h-6 px-2 bg-blue-600 hover:bg-blue-700 text-white"
                                    disabled={savingNoteId === highlight.id}
                                  >
                                    <Save className="h-3 w-3 mr-1" />
                                    {savingNoteId === highlight.id ? 'Saving...' : 'Save'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : highlight.note ? (
                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                              {highlight.note}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400 dark:text-gray-500 italic pl-1">
                              No note added yet
                            </p>
                          )}
                        </div>

                        {/* Color Picker */}
                        <div className="space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Color</span>
                          <div className="flex gap-2">
                            {HIGHLIGHT_COLORS.map((option) => (
                              <button
                                key={option.color}
                                type="button"
                                onClick={() => onChangeColor(highlight.id)}
                                className={`h-6 w-6 rounded-full border shadow-sm transition-all duration-200 ${
                                  highlight.color === option.color
                                    ? 'border-blue-500 scale-110 ring-2 ring-blue-100 dark:ring-blue-900'
                                    : 'border-transparent hover:scale-105'
                                }`}
                                style={{ backgroundColor: option.hex, opacity: 0.9 }}
                                title={option.name}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-100 dark:border-gray-800">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onJumpToHighlight(highlight.sectionIndex)}
                            className="text-xs h-8 px-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                          >
                            <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                            Jump to location
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyText(highlight.text, index)}
                            className="text-xs h-8 px-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                          >
                            <Copy className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                            {copiedIndex === index ? 'Copied!' : 'Copy text'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveHighlight(highlight.id)}
                            className="text-xs h-8 px-3 ml-auto text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
