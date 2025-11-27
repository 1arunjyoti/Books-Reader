"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
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
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    const timeout = copyTimeoutRef.current;
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

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
      
      // Clear previous timeout if exists
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedId(null);
        copyTimeoutRef.current = null;
      }, 2000);
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
    estimateSize: () => 120,
    overscan: 5,
  });

  return (
    <div className="absolute top-16 right-0 bottom-0 w-80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-l border-gray-200/50 dark:border-gray-700/50 shadow-2xl z-20 flex flex-col overflow-y-auto custom-scrollbar">
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
              className={`h-8 gap-1 relative transition-all ${
                activeFilterCount > 0 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50' 
                  : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
              }`}
            >
              <Filter className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[10px] flex items-center justify-center shadow-sm">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="px-4 pb-4 space-y-3 border-t border-gray-200/50 dark:border-gray-700/50 pt-3 bg-gray-50/30 dark:bg-gray-800/30 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by Color
              </span>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-6 text-xs px-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                >
                  Clear All
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {PDF_HIGHLIGHT_COLORS.map((colorOption) => {
                const count = highlights.filter(h => h.color === colorOption.color).length;
                return (
                  <div key={colorOption.color} className="flex items-center gap-2 group">
                    <Checkbox
                      id={`filter-${colorOption.color}`}
                      checked={selectedColors.has(colorOption.color)}
                      onCheckedChange={() => toggleColorFilter(colorOption.color)}
                      disabled={count === 0}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label
                      htmlFor={`filter-${colorOption.color}`}
                      className={`flex items-center gap-2 text-sm flex-1 cursor-pointer transition-opacity ${
                        count === 0 ? 'opacity-40' : 'group-hover:opacity-80'
                      }`}
                    >
                      <div
                        className="h-3 w-3 rounded-full shadow-sm"
                        style={{ 
                          backgroundColor: colorOption.hex,
                          opacity: 0.9
                        }}
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        {colorOption.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto font-mono">
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
        className="flex-1 overflow-y-auto custom-scrollbar"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-gray-400">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              Loading highlights...
            </div>
          </div>
        ) : highlights.length === 0 ? (
          <div className="flex items-center justify-center p-4 h-full">
            <div className="flex flex-col items-center text-center">
              <div className="p-4 rounded-full bg-yellow-50 dark:bg-yellow-900/20 mb-3">
                <StickyNote className="w-8 h-8 text-yellow-500/50" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                No highlights yet
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px]">
                Select text in the document to create a highlight
              </p>
            </div>
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
              const isExpanded = expandedId === highlight.id;
              
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
                  className={`border-b border-gray-200/50 dark:border-gray-700/50 transition-all duration-200 ${
                    isExpanded ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className="p-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                  
                {/* Highlight Text Preview */}
                <div className="flex items-start gap-3">
                  <div 
                    className="h-3 w-3 rounded-full mt-1.5 flex-shrink-0 shadow-sm ring-2 ring-white dark:ring-gray-800"
                    style={{ 
                      backgroundColor: highlight.hex,
                      opacity: 0.9
                    }}
                  />
                  <div 
                    onClick={() => setExpandedId(isExpanded ? null : highlight.id)}
                    className="w-full text-left group cursor-pointer flex items-start gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm text-gray-700 dark:text-gray-300 break-words transition-all ${isExpanded ? '' : 'line-clamp-2'}`}>
                        &quot;{highlight.text}&quot;
                      </p>
                      {!isExpanded && highlight.note && (
                        <div className="flex items-center gap-1.5 mt-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md w-fit max-w-full">
                          <StickyNote className="h-3 w-3 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                          <p className="text-xs text-yellow-700 dark:text-yellow-400 line-clamp-1 truncate">
                            {highlight.note}
                          </p>
                        </div>
                      )}
                      {/* Metadata: Page and Date */}
                      {!isExpanded && (
                        <div className="flex items-center gap-2 mt-2 text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">
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
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onJumpToHighlight(highlight);
                        }}
                        className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Jump to highlight"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                      </button>
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 hover:text-blue-600 dark:hover:text-blue-400 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded View */}
                {isExpanded && (
                  <div className="mt-4 ml-6 space-y-4 animate-in fade-in slide-in-from-top-1">
                    {/* Metadata */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700/50 pb-2">
                      {highlight.pageNumber && (
                        <span className="font-medium text-gray-700 dark:text-gray-300">Page {highlight.pageNumber}</span>
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
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                          <StickyNote className="h-3.5 w-3.5 text-gray-400" />
                          Note
                        </label>
                        {editingNoteId !== highlight.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditNote(highlight.id, highlight.note)}
                            className="text-xs h-6 px-2 rounded-md transition-colors  hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                          >
                            {highlight.note ? 'Edit' : 'Add Note'}
                          </Button>
                        )}
                      </div>

                      {editingNoteId === highlight.id ? (
                        <div className="space-y-2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                          <Textarea
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                            placeholder="Add your note here... (max 200 characters)"
                            maxLength={200}
                            rows={3}
                            className="text-xs resize-none border-0 focus-visible:ring-0 p-2 bg-transparent"
                            autoFocus
                          />
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                            <span className="text-[10px] text-gray-400">
                              {noteDraft.length}/200
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
                                className="text-xs h-6 px-2 bg-blue-600 hover:bg-blue-700"
                                disabled={savingNoteId === highlight.id}
                              >
                                <Save className="h-3 w-3" />
                                {savingNoteId === highlight.id ? 'Saving...' : 'Save'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : highlight.note ? (
                        <p className="text-xs text-gray-600 dark:text-gray-300 bg-yellow-50/50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
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
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Change color</span>
                      <div className="flex flex-wrap gap-2">
                        {PDF_HIGHLIGHT_COLORS.map((option) => (
                          <button
                            key={option.color}
                            type="button"
                            onClick={() => onChangeColor(highlight.id, option.color, option.hex)}
                            className={`h-6 w-6 rounded-full border-2 transition-all duration-200 ${
                              highlight.color === option.color
                                ? 'border-gray-400 dark:border-gray-400 scale-110 shadow-sm'
                                : 'border-transparent hover:scale-110'
                            }`}
                            style={{ backgroundColor: option.hex }}
                            title={option.name}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-100 dark:border-gray-700/50">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onJumpToHighlight(highlight)}
                        className="text-xs h-7 px-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Jump to
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(highlight.id, highlight.text)}
                        className="text-xs h-7 px-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Copy className="h-3 w-3 mr-1.5" />
                        {copiedId === highlight.id ? 'Copied!' : 'Copy text'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRemoveHighlight(highlight.id)}
                        className="text-xs h-7 px-3 ml-auto text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/30"
                      >
                        <Trash2 className="h-3 w-3 mr-1.5" />
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
        )}
      </div>
    </div>
  );
}
