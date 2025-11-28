'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Upload, Loader2, Book, User, Calendar, Hash, Building2, Globe, FileText } from 'lucide-react';
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

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'bn', label: 'Bangla' },
  { value: 'hi', label: 'Hindi' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ko', label: 'Korean' },
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
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-800 shadow-2xl rounded-2xl">
        
        {/* Header */}
        <DialogHeader className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
            Edit Metadata
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            Update the details and cover image for this book
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form id="edit-book-form" onSubmit={handleSubmit} className="p-6 space-y-8">
            
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-8">
              
              {/* Left Column: Cover Image */}
              <div className="w-full md:w-1/3 space-y-4">
                <Label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Cover Image</Label>
                <div className="relative group aspect-[2/3] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shadow-sm transition-all hover:shadow-md">
                  {coverPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverPreview}
                      alt="Book cover preview"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                      <Book className="w-12 h-12 mb-2 opacity-50" />
                      <span className="text-xs">No Cover</span>
                    </div>
                  )}
                  
                  {/* Overlay for upload */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-[2px]">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="bg-white/90 hover:bg-white text-gray-900 shadow-lg"
                      onClick={() => document.getElementById('cover-upload')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Change Cover
                    </Button>
                  </div>
                </div>
                
                <input
                  type="file"
                  id="cover-upload"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Recommended: 2:3 aspect ratio, max 5MB
                </p>
              </div>

              {/* Right Column: Metadata Fields */}
              <div className="flex-1 space-y-6">
                
                {/* Title & Author */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Book className="w-3.5 h-3.5" /> Title
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                      className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus-visible:ring-blue-500/20 h-11"
                      placeholder="Book Title"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="author" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <User className="w-3.5 h-3.5" /> Author
                    </Label>
                    <Input
                      id="author"
                      value={formData.author}
                      onChange={(e) => handleInputChange('author', e.target.value)}
                      className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus-visible:ring-blue-500/20 h-11"
                      placeholder="Author Name"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <FileText className="w-3.5 h-3.5" /> Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus-visible:ring-blue-500/20 resize-none"
                    placeholder="Enter a brief summary..."
                  />
                </div>

                {/* Secondary Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="publicationYear" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Calendar className="w-3.5 h-3.5" /> Year
                    </Label>
                    <Input
                      id="publicationYear"
                      type="number"
                      value={formData.publicationYear}
                      onChange={(e) => handleInputChange('publicationYear', e.target.value)}
                      className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus-visible:ring-blue-500/20"
                      placeholder="YYYY"
                      min="1000"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="isbn" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Hash className="w-3.5 h-3.5" /> ISBN
                    </Label>
                    <Input
                      id="isbn"
                      value={formData.isbn}
                      onChange={(e) => handleInputChange('isbn', e.target.value)}
                      className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus-visible:ring-blue-500/20"
                      placeholder="978-..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="publisher" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Building2 className="w-3.5 h-3.5" /> Publisher
                    </Label>
                    <Input
                      id="publisher"
                      value={formData.publisher}
                      onChange={(e) => handleInputChange('publisher', e.target.value)}
                      className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus-visible:ring-blue-500/20"
                      placeholder="Publisher Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Globe className="w-3.5 h-3.5" /> Language
                    </Label>
                    <Select 
                      value={formData.language} 
                      onValueChange={(value) => handleInputChange('language', value)}
                    >
                      <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:ring-blue-500/20">
                        <SelectValue placeholder="Select Language" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Genres */}
                <div className="space-y-3">
                  <Label className="text-gray-700 dark:text-gray-300">Genres</Label>
                  <div className="flex flex-wrap gap-2 p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                    {COMMON_GENRES.map(genre => (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => handleGenreToggle(genre)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                          formData.genre.includes(genre)
                            ? 'bg-blue-500 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                            : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-5 border-t border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex-shrink-0 gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-book-form"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 min-w-[120px]"
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
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
