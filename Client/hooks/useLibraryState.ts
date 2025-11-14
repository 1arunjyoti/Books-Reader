import { useState, useCallback } from 'react';
import type { Book } from '@/lib/api';

export const useLibraryState = () => {
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleBookSelection = useCallback((bookId: string) => {
    setSelectedBookIds(prev => {
      const next = new Set(prev);
      if (next.has(bookId)) {
        next.delete(bookId);
      } else {
        next.add(bookId);
      }
      return next;
    });
  }, []);

  const selectAllBooks = useCallback((bookIds: string[]) => {
    setSelectedBookIds(new Set(bookIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedBookIds(new Set());
  }, []);

  return {
    selectedBookIds,
    toggleBookSelection,
    selectAllBooks,
    clearSelection,
    editingBook,
    setEditingBook,
    bookToDelete,
    setBookToDelete,
    deleteDialogOpen,
    setDeleteDialogOpen,
    isDeleting,
    setIsDeleting,
  };
};
