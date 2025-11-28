"use client";

import React, { memo, useCallback } from 'react';
import { MoreVertical, Edit, Download, CheckCircle, BookOpen, Bookmark, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { Book } from '@/lib/api';
import { getPresignedUrl } from "@/lib/api";
import { useTokenCache } from "@/contexts/AuthTokenContext";

type Props = {
  book: Book;
  setEditingBook: (b: Book | null) => void;
  handleUpdateStatus: (bookId: string, newStatus: string) => void;
  handleDeleteBook: (bookId: string) => void;
};

const ActionMenu = memo(function ActionMenu({ book, setEditingBook, handleUpdateStatus, handleDeleteBook }: Props) {
  const getAccessToken = useTokenCache();

  // Memoize callbacks to prevent re-renders
  const onEdit = useCallback(() => setEditingBook(book), [book, setEditingBook]);
  const onMarkRead = useCallback(() => handleUpdateStatus(book.id, 'read'), [book.id, handleUpdateStatus]);
  const onMarkReading = useCallback(() => handleUpdateStatus(book.id, 'reading'), [book.id, handleUpdateStatus]);
  const onMarkWantToRead = useCallback(() => handleUpdateStatus(book.id, 'want-to-read'), [book.id, handleUpdateStatus]);
  const onDelete = useCallback(() => handleDeleteBook(book.id), [book.id, handleDeleteBook]);

  const handleDownload = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const url = await getPresignedUrl(book.id, token);

      const link = document.createElement("a");
      link.href = url;
      link.download = book.originalName || book.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download book:", error);
    }
  }, [book.id, book.originalName, book.title, getAccessToken]);

  return (
    <div className="absolute top-3 right-3 z-20" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-md hover:bg-white dark:hover:bg-gray-700 lg:opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 ring-1 ring-gray-900/5 dark:ring-white/10"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="ml-2 lg:ml-6 w-45 sm:w-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl ring-1 ring-border border-gray-300 dark:border-gray-700" align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit Metadata</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            <span>Download Book</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onMarkRead}>
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            <span>Mark as Read</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onMarkReading}>
            <BookOpen className="mr-2 h-4 w-4 text-blue-500" />
            <span>Currently Reading</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onMarkWantToRead}>
            <Bookmark className="mr-2 h-4 w-4 text-yellow-500" />
            <span>Want to Read</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onDelete}
            className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete Book</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if book data actually changed
  return (
    prevProps.book.id === nextProps.book.id &&
    prevProps.book.status === nextProps.book.status &&
    prevProps.book.title === nextProps.book.title &&
    prevProps.book.fileUrl === nextProps.book.fileUrl
  );
});

export default ActionMenu;
