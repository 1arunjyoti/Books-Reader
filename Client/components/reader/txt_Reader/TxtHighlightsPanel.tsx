'use client';

import { useState, useRef } from 'react';
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
              className="h-8 gap-1 rounded-full relative flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
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
              className="h-8 w-8 p-0 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
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
              {HIGHLIGHT_COLORS.map((colorOption) => {
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
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading highlights...</p>
          </div>
        </div>
      ) : highlights.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            No highlights yet. Select text to create one!
          </p>
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
          className="flex-1 overflow-y-auto"
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
                  className="border-b border-gray-200 dark:border-gray-700"
                >
                  <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
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
                        onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
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
                          {/* Metadata: Section and Date */}
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
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
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onJumpToHighlight(highlight.sectionIndex);
                            }}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                            title="Jump to highlight"
                          >
                            <MapPin className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                          </button>
                          <ChevronDown
                            className={`h-4 w-4 text-gray-400 transition-transform ${
                              expandedIndex === index ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded View */}
                    {isExpanded && (
                      <div className="mt-3 ml-5 space-y-3 border-l border-gray-200 dark:border-gray-600 pl-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {highlight.text}
                        </p>

                        {/* Metadata */}
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          {highlight.sectionIndex !== undefined && (
                            <span className="font-medium">Section {highlight.sectionIndex + 1}</span>
                          )}
                          {highlight.sectionIndex !== undefined && highlight.createdAt && (
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
                            {!editingNoteId || editingNoteId !== highlight.id ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditNote(highlight.id, highlight.note)}
                                className="text-xs h-6 px-2"
                              >
                                {highlight.note ? 'Edit' : 'Add Note'}
                              </Button>
                            ) : null}
                          </div>

                          {isEditingNote ? (
                            <div className="space-y-2">
                              <Textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Add your note here... (max 500 characters)"
                                maxLength={500}
                                rows={3}
                                className="text-xs resize-none"
                                autoFocus
                              />
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  {noteText.length}/500
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
                            {HIGHLIGHT_COLORS.map((option) => (
                              <button
                                key={option.color}
                                type="button"
                                onClick={() => onChangeColor(highlight.id)}
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
                            onClick={() => onJumpToHighlight(highlight.sectionIndex)}
                            className="text-xs h-7 px-2"
                          >
                            Jump to
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyText(highlight.text, index)}
                            className="text-xs h-7 px-2"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            {copiedIndex === index ? 'Copied!' : 'Copy'}
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
        </div>
      )}
    </div>
  );
}
