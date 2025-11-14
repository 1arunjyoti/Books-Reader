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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isEditing ? 'Edit Bookmark' : 'Add Bookmark'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <Label htmlFor="page" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Page Number
            </Label>
            <Input
              id="page"
              type="number"
              value={pageNumber}
              disabled
              className="mt-1 bg-gray-50 dark:bg-gray-900"
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
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                       placeholder:text-gray-400 dark:placeholder:text-gray-500
                       resize-none"
              maxLength={500}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {note.length}/500 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
