import React, { useState } from 'react';
import Image from 'next/image';
import { GutenbergBook } from '@/lib/gutenberg';
import { BookOpen, Download, Check, Loader2 } from 'lucide-react';
import { importGutenbergBook } from '@/lib/api';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface GutenbergBookCardProps {
  book: GutenbergBook;
  onImportSuccess?: (bookTitle: string) => void;
  onImportError?: (error: string) => void;
}

export default function GutenbergBookCard({ book, onImportSuccess, onImportError }: GutenbergBookCardProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [isImported, setIsImported] = useState(false);
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();

  const handleImport = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    try {
      setIsImporting(true);
      const token = await getToken();
      if (!token) {
        throw new Error('Failed to get access token');
      }

      await importGutenbergBook(token, book);
      
      setIsImported(true);
      if (onImportSuccess) {
        onImportSuccess(book.title);
      }
    } catch (error) {
      console.error('Import failed:', error);
      if (onImportError) {
        onImportError(error instanceof Error ? error.message : 'Failed to import book');
      }
    } finally {
      setIsImporting(false);
    }
  };

  const coverUrl = book.formats['image/jpeg'];
  // const authorName = book.authors.map(a => a.name).join(', ').replace(/, /g, ', ').split(', ').reverse().join(' ').trim() || 'Unknown Author';
  // Gutenberg authors are often "Last, First", so we might want to format them better, but simple join is fine for now.

  return (
    <div className="group relative flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
      {/* Cover Image */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={`Cover of ${book.title}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <BookOpen className="w-12 h-12" />
          </div>
        )}
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1" title={book.title}>
          {book.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-4">
          {book.authors.length > 0 ? book.authors.map(a => a.name).join(', ') : 'Unknown Author'}
        </p>

        <div className="mt-auto pt-2">
          <button
            onClick={handleImport}
            disabled={isImporting || isImported}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isImported
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-default'
                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Adding...</span>
              </>
            ) : isImported ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Add to Library</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
