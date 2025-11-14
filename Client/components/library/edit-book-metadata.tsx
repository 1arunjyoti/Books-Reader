'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/label';
import { X, Upload, Loader2 } from 'lucide-react';
import { useTokenCache } from '@/hooks/useTokenCache';
import { API_ENDPOINTS } from '@/lib/config';

/**
 * Edit Book Metadata Component
 * Allows users to edit comprehensive book metadata including cover, description, genres, etc.
 */

interface Book {
  id: string;
  title: string;
  author?: string | null;
  description?: string | null;
  genre?: string[];
  publicationYear?: number | null;
  isbn?: string | null;
  publisher?: string | null;
  language?: string | null;
  coverUrl?: string | null;
}

interface EditBookMetadataProps {
  book: Book;
  onClose: () => void;
  onSave: (updatedBook: Book) => void;
}

const COMMON_GENRES = [
  'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 'Thriller',
  'Romance', 'Horror', 'Biography', 'History', 'Self-Help', 'Business',
  'Science', 'Technology', 'Philosophy', 'Poetry', 'Drama'
];

export default function EditBookMetadata({ book, onClose, onSave }: EditBookMetadataProps) {
  // Use secure token cache hook instead of fetching directly
  const getAccessToken = useTokenCache();
  
  const [formData, setFormData] = useState({
    title: book.title || '',
    author: book.author || '',
    description: book.description || '',
    genre: book.genre || [],
    publicationYear: book.publicationYear?.toString() || '',
    isbn: book.isbn || '',
    publisher: book.publisher || '',
    language: book.language || 'en',
  });
  
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(book.coverUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenreToggle = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genre: prev.genre.includes(genre)
        ? prev.genre.filter(g => g !== genre)
        : [...prev.genre, genre]
    }));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Cover image must be less than 5MB');
        return;
      }

      setCoverFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Use secure token cache instead of direct fetch
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Authentication required. Please sign in again.');
      }

      // Use environment-based API URL instead of hardcoded localhost
      const API_BASE_URL = API_ENDPOINTS.BASE;

      // Upload cover if changed
      let coverUrl = book.coverUrl;
      if (coverFile) {
        const coverFormData = new FormData();
        coverFormData.append('cover', coverFile);

        const coverResponse = await fetch(`${API_BASE_URL}/api/books/${book.id}/cover`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: coverFormData,
        });

        if (!coverResponse.ok) {
          throw new Error('Failed to upload cover image');
        }

        const coverData = await coverResponse.json();
        coverUrl = coverData.coverUrl;
      }

      // Update book metadata - only include fields that have values
      const updateData = {
        title: formData.title,
        ...(formData.author && { author: formData.author }),
        ...(formData.description && { description: formData.description }),
        ...(formData.genre?.length > 0 && { genre: formData.genre }),
        ...(formData.publicationYear && { publicationYear: parseInt(formData.publicationYear) }),
        ...(formData.isbn && { isbn: formData.isbn }),
        ...(formData.publisher && { publisher: formData.publisher }),
        ...(formData.language && { language: formData.language }),
      };

      const response = await fetch(`${API_BASE_URL}/api/books/${book.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update book metadata');
      }

      const { book: updatedBook } = await response.json();
      onSave({ ...updatedBook, coverUrl });
      onClose();
    } catch (err) {
      console.error('Error updating book:', err);
      setError(err instanceof Error ? err.message : 'Failed to update book');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[60vh] sm:max-h-[90vh] overflow-y-auto">

        {/* SheetHeader */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Book Metadata
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-8 h-8 p-1 rounded-full  bg-gray-300 dark:bg-gray-700" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Cover Image */}
          <div>
            <Label htmlFor="cover">Cover Image</Label>
            <div className="mt-2 flex items-center gap-4">
              {coverPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverPreview}
                  alt="Book cover preview"
                  className="w-32 h-48 object-cover rounded border border-gray-300 dark:border-gray-600"
                />
              )}
              <div className="flex-1">
                <input
                  type="file"
                  id="cover"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('cover')?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {coverPreview ? 'Change Cover' : 'Upload Cover'}
                </Button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  JPEG, PNG, or WebP. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
              className="mt-2"
            />
          </div>

          {/* Author */}
          <div>
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) => handleInputChange('author', e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
              rows={4}
              className="mt-2 h-6"
              placeholder="Enter a description or summary of the book..."
            />
          </div>

          {/* Genres */}
          <div>
            <Label>Genres</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {COMMON_GENRES.map(genre => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => handleGenreToggle(genre)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    formData.genre.includes(genre)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Publication Year */}
          <div>
            <Label htmlFor="publicationYear">Publication Year</Label>
            <Input
              id="publicationYear"
              type="number"
              value={formData.publicationYear}
              onChange={(e) => handleInputChange('publicationYear', e.target.value)}
              className="mt-2"
              placeholder="e.g., 2024"
              min="1000"
              max={new Date().getFullYear() + 1}
            />
          </div>

          {/* ISBN */}
          <div>
            <Label htmlFor="isbn">ISBN</Label>
            <Input
              id="isbn"
              value={formData.isbn}
              onChange={(e) => handleInputChange('isbn', e.target.value)}
              className="mt-2"
              placeholder="e.g., 978-3-16-148410-0"
            />
          </div>

          {/* Publisher */}
          <div>
            <Label htmlFor="publisher">Publisher</Label>
            <Input
              id="publisher"
              value={formData.publisher}
              onChange={(e) => handleInputChange('publisher', e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Language */}
          <div>
            <Label htmlFor="language">Language</Label>
            <select
              id="language"
              value={formData.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
              className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="en">English</option>
              <option value="bn">Bangla</option>
              <option value="hi">Hindi</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="ru">Russian</option>
              <option value="ja">Japanese</option>
              <option value="zh">Chinese</option>
              <option value="ko">Korean</option>              
              
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
