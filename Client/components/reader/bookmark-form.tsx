'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/label';
import { X } from 'lucide-react';
import { sanitizeBookmarkNote } from '@/lib/sanitize-text';
import { logger } from '@/lib/logger';

interface BookmarkFormProps {
  pageNumber: number;
  initialNote?: string;
  onSubmit: (note: string) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

function BookmarkForm({
  pageNumber,
  initialNote = '',
  onSubmit,
  onCancel,
  isEditing = false,
}: BookmarkFormProps) {
  const [note, setNote] = useState(initialNote);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Sanitize the note before submitting
      const sanitizedNote = sanitizeBookmarkNote(note.trim());
      await onSubmit(sanitizedNote);
    } catch (err) {
      // Log the error but don't rethrow to prevent unhandled rejections
      logger.error('Error saving bookmark:', err);
      // Parent component should handle errors via callback if needed
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md border border-gray-200/50 dark:border-gray-700/50 overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            {isEditing ? 'Edit Bookmark' : 'Add Bookmark'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <Label htmlFor="page" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Page Number
            </Label>
            <Input
              id="page"
              type="number"
              value={pageNumber}
              disabled
              className="mt-1.5 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-700/50 text-gray-500"
            />
          </div>

          <div>
            <Label htmlFor="note" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Note (optional)
            </Label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note to remember why you bookmarked this page..."
              rows={4}
              className="mt-1.5 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm 
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 
                       bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100
                       placeholder:text-gray-400 dark:placeholder:text-gray-500
                       resize-none transition-all"
              maxLength={500}
              autoFocus
            />
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500 text-right">
              {note.length}/500 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 border-0"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isEditing ? 'Saving...' : 'Adding...'}
                </div>
              ) : (
                isEditing ? 'Save Changes' : 'Add Bookmark'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const propsAreEqual = (prevProps: BookmarkFormProps, nextProps: BookmarkFormProps) => {
  return (
    prevProps.pageNumber === nextProps.pageNumber &&
    prevProps.initialNote === nextProps.initialNote &&
    prevProps.onSubmit === nextProps.onSubmit &&
    prevProps.onCancel === nextProps.onCancel &&
    prevProps.isEditing === nextProps.isEditing
  );
};

export default React.memo(BookmarkForm, propsAreEqual);
