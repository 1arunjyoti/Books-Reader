"use client";

import { useState, useMemo, useRef } from 'react';
import { logger } from '@/lib/logger';
import { useVirtualizer } from '@tanstack/react-virtual';
import { X, Trash2, Copy, Filter, StickyNote, Save, ChevronDown, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type { PdfHighlight } from '@/types/highlights';
import { PDF_HIGHLIGHT_COLORS } from './highlight-colors';

interface PDFHighlightsPanelProps {
  highlights: PdfHighlight[];
  isLoading?: boolean;
  onRemoveHighlight: (highlightId: string) => Promise<void> | void;
  onJumpToHighlight: (highlight: PdfHighlight) => void;
  onChangeColor: (highlightId: string, color: string, hex: string) => Promise<void> | void;
  onSaveNote: (highlightId: string, note: string) => Promise<void> | void;
  onClose: () => void;
}

export default function PDFHighlightsPanel({
  highlights,
  isLoading = false,
  onRemoveHighlight,
  onJumpToHighlight,
  onChangeColor,
  onSaveNote,
  onClose,
}: PDFHighlightsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<string>('');
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const filteredHighlights = useMemo(() => {
    if (selectedColors.size === 0) {
      return highlights;
    }
    return highlights.filter((highlight) => selectedColors.has(highlight.color));
  }, [highlights, selectedColors]);

  const activeFilterCount = selectedColors.size;

  const toggleColorFilter = (color: string) => {
    const next = new Set(selectedColors);
    if (next.has(color)) {
      next.delete(color);
    } else {
      next.add(color);
    }
    setSelectedColors(next);
  };

  const handleCopy = async (highlightId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(highlightId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      logger.error('Failed to copy highlight text', error);
    }
  };

  const handleEditNote = (highlightId: string, note?: string) => {
    setEditingNoteId(highlightId);
    setNoteDraft(note ?? '');
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setNoteDraft('');
  };

  const handleSaveNote = async (highlightId: string) => {
    setSavingNoteId(highlightId);
    try {
      await onSaveNote(highlightId, noteDraft);
      setEditingNoteId(null);
    } catch (error) {
      logger.error('Failed to save highlight note', error);
    } finally {
      setSavingNoteId(null);
    }
  };

  const clearFilters = () => setSelectedColors(new Set());

  const formatDate = (isoDate?: string) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // VIRTUALIZATION: Set up virtual scrolling for large highlight lists
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: filteredHighlights.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated height of each item
    overscan: 5, // Render 5 items above and below the visible area
  });

  return (
    <div className="absolute top-0 right-0 bottom-0 w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg z-50 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
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
              className="h-8 gap-1 relative"
            >
              <Filter className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by Color
              </span>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-6 text-xs px-2"
                >
                  Clear All
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {PDF_HIGHLIGHT_COLORS.map((colorOption) => {
                const count = highlights.filter(h => h.color === colorOption.color).length;
                return (
                  <div key={colorOption.color} className="flex items-center gap-2">
                    <Checkbox
                      id={`filter-${colorOption.color}`}
                      checked={selectedColors.has(colorOption.color)}
                      onCheckedChange={() => toggleColorFilter(colorOption.color)}
                      disabled={count === 0}
                    />
                    <label
                      htmlFor={`filter-${colorOption.color}`}
                      className={`flex items-center gap-2 text-sm flex-1 cursor-pointer ${
                        count === 0 ? 'opacity-40' : ''
                      }`}
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ 
                          backgroundColor: colorOption.hex,
                          opacity: 0.7
                        }}
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        {colorOption.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                        ({count})
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
      <div 
        ref={parentRef}
        className="flex-1 overflow-y-auto"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-gray-400">
            Loading highlights...
          </div>
        ) : highlights.length === 0 ? (
          <div className="flex items-center justify-center p-4 h-full">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              No highlights yet. Select text to create one!
            </p>
          </div>
        ) : filteredHighlights.length === 0 ? (
          <div className="flex items-center justify-center p-4 h-full">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              No highlights match the selected filters.
            </p>
          </div>
        ) : (
          <div 
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const highlight = filteredHighlights[virtualItem.index];
              
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
                  className="border-b border-gray-200 dark:border-gray-700"
                >
                  <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                {/* Highlight Text Preview */}
                <div className="flex items-start gap-2">
                  <div 
                    className="h-3 w-3 rounded-full mt-1 flex-shrink-0"
                    style={{ 
                      backgroundColor: highlight.hex,
                      opacity: 0.7
                    }}
                  />
                  <div 
                    onClick={() => setExpandedId(expandedId === highlight.id ? null : highlight.id)}
                    className="w-full text-left group cursor-pointer flex items-start gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 break-words">
                        &quot;{highlight.text}&quot;
                      </p>
                      {highlight.note && (
                        <div className="flex items-center gap-1 mt-1">
                          <StickyNote className="h-3 w-3 text-blue-500" />
                          <p className="text-xs text-blue-600 dark:text-blue-400 line-clamp-1">
                            {highlight.note}
                          </p>
                        </div>
                      )}
                      {/* Metadata: Page and Date */}
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {highlight.pageNumber && (
                          <span>Page {highlight.pageNumber}</span>
                        )}
                        {highlight.pageNumber && highlight.createdAt && (
                          <span>•</span>
                        )}
                        {highlight.createdAt && (
                          <span>{formatDate(highlight.createdAt)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onJumpToHighlight(highlight);
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                        title="Jump to highlight"
                      >
                        <MapPin className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      </button>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                          expandedId === highlight.id ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded View */}
                {expandedId === highlight.id && (
                  <div className="mt-3 ml-5 space-y-3 border-l border-gray-200 dark:border-gray-600 pl-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {highlight.text}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      {highlight.pageNumber && (
                        <span className="font-medium">Page {highlight.pageNumber}</span>
                      )}
                      {highlight.pageNumber && highlight.createdAt && (
                        <span>•</span>
                      )}
                      {highlight.createdAt && (
                        <span>Created: {formatDate(highlight.createdAt)}</span>
                      )}
                    </div>

                    {/* Note Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <StickyNote className="h-3 w-3" />
                          Note
                        </label>
                        {editingNoteId !== highlight.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditNote(highlight.id, highlight.note)}
                            className="text-xs h-6 px-2"
                          >
                            {highlight.note ? 'Edit' : 'Add Note'}
                          </Button>
                        )}
                      </div>

                      {editingNoteId === highlight.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                            placeholder="Add your note here... (max 500 characters)"
                            maxLength={500}
                            rows={3}
                            className="text-xs resize-none"
                            autoFocus
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {noteDraft.length}/500
                            </span>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEdit}
                                className="text-xs h-6 px-2"
                                disabled={savingNoteId === highlight.id}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleSaveNote(highlight.id)}
                                className="text-xs h-6 px-2"
                                disabled={savingNoteId === highlight.id}
                              >
                                <Save className="h-3 w-3 mr-1" />
                                {savingNoteId === highlight.id ? 'Saving...' : 'Save'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : highlight.note ? (
                        <p className="text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-800">
                          {highlight.note}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                          No note added yet
                        </p>
                      )}
                    </div>

                    {/* Color Picker */}
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Change color</span>
                      <div className="grid grid-cols-6 gap-2">
                        {PDF_HIGHLIGHT_COLORS.map((option) => (
                          <button
                            key={option.color}
                            type="button"
                            onClick={() => onChangeColor(highlight.id, option.color, option.hex)}
                            className={`h-6 w-6 rounded-full border ${
                              highlight.color === option.color
                                ? 'border-blue-500 scale-110'
                                : 'border-transparent'
                            } transition-transform duration-150`}
                            style={{ backgroundColor: option.hex, opacity: 0.75 }}
                            title={option.name}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onJumpToHighlight(highlight)}
                        className="text-xs h-7 px-2"
                      >
                        Jump to
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(highlight.id, highlight.text)}
                        className="text-xs h-7 px-2"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {copiedId === highlight.id ? 'Copied!' : 'Copy'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRemoveHighlight(highlight.id)}
                        className="text-xs h-7 px-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
