"use client";

import { useState, memo } from 'react';
import { X, Calendar, Tag, Globe, SortAsc, SidebarOpen, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/label';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AdvancedFilters {
  search: string;
  status: string;
  genre: string[];
  format?: string[];
  language: string;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface AdvancedFiltersProps {
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  onReset: () => void;
}

const GENRES = [
  'Fiction',
  'Non-Fiction',
  'Science Fiction',
  'Fantasy',
  'Mystery',
  'Thriller',
  'Romance',
  'Horror',
  'Biography',
  'History',
  'Science',
  'Technology',
  'Self-Help',
  'Business',
  'Philosophy',
  'Poetry',
  'Drama',
  'Other'
];

const LANGUAGES = [
  { value: 'all', label: 'All Languages' },
  { value: 'English', label: 'English' },
  { value: 'Bangla', label: 'Bangla' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Russian', label: 'Russian' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Korean', label: 'Korean' },
  
];

const SORT_OPTIONS = [
  { value: 'uploadedAt', label: 'Upload Date' },
  { value: 'lastReadAt', label: 'Last Read' },
  { value: 'title', label: 'Title' },
  { value: 'author', label: 'Author' },
  { value: 'progress', label: 'Reading Progress' },
  
];

const AdvancedFiltersComponent = memo(function AdvancedFiltersComponent({ filters, onFiltersChange, onReset }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Ensure formats exists on filters
  if (!filters.format) filters.format = [];

  const handleGenreToggle = (genre: string) => {
    const newGenres = filters.genre.includes(genre)
      ? filters.genre.filter(g => g !== genre)
      : [...filters.genre, genre];
    
    onFiltersChange({ ...filters, genre: newGenres });
  };

  const handleClearGenres = () => {
    onFiltersChange({ ...filters, genre: [] });
  };

  const handleLanguageChange = (language: string) => {
    // Convert 'all' to empty string for API
    const languageValue = language === 'all' ? '' : language;
    onFiltersChange({ ...filters, language: languageValue });
  };

  const handleDateFromChange = (dateFrom: string) => {
    onFiltersChange({ ...filters, dateFrom });
  };

  const handleDateToChange = (dateTo: string) => {
    onFiltersChange({ ...filters, dateTo });
  };

  const handleFormatToggle = (format: string) => {
    const newFormats = filters.format!.includes(format)
      ? filters.format!.filter(f => f !== format)
      : [...filters.format!, format];

    onFiltersChange({ ...filters, format: newFormats });
  };

  const handleSortByChange = (sortBy: string) => {
    onFiltersChange({ ...filters, sortBy });
  };

  const handleSortOrderToggle = () => {
    onFiltersChange({ 
      ...filters, 
      sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
    });
  };

  const handleReset = () => {
    onReset();
    setIsOpen(false);
  };

  const activeFiltersCount = [
    filters.genre.length > 0,
    filters.language !== '',
    (filters.format && filters.format.length > 0),
    filters.dateFrom !== '',
    filters.dateTo !== '',
    filters.status !== 'all',
  ].filter(Boolean).length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>

      {/* SheetTrigger button*/}
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="h-auto w-auto justify-between border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 group text-sm sm:text-base gap-2"
        >
          <SidebarOpen className="h-4 w-4" />
          
          {activeFiltersCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500 text-white">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="overflow-y-auto border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">

        {/* SheetHeader */}
        <SheetHeader>
          <SheetTitle>Advanced Filters</SheetTitle>
          <SheetDescription>
            Refine your library search with advanced filtering options
          </SheetDescription>
        </SheetHeader>

        {/* Filters */}
        <div className="py-4 space-y-4">
          {/* Genre Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center text-base font-semibold">
                <Tag className="h-4 w-4 mr-2" />
                Genres
              </Label>
              {filters.genre.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearGenres}
                  className="h-7 text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {GENRES.map((genre) => (
                <Button
                  key={genre}
                  variant={filters.genre.includes(genre) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleGenreToggle(genre)}
                  className="justify-start text-sm"
                >
                  {genre}
                  {filters.genre.includes(genre) && (
                    <X className="ml-auto h-3 w-3" />
                  )}
                </Button>
              ))}
            </div>
            {filters.genre.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {filters.genre.length} genre{filters.genre.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Language Filter */}
          <div className="space-y-3">
            <Label className="flex items-center text-base font-semibold">
              <Globe className="h-4 w-4 mr-2" />
              Language
            </Label>
            <Select 
              value={filters.language === '' ? 'all' : filters.language} 
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Languages" />
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

          {/* Date Range Filter */}
          <div className="space-y-3">
            <Label className="flex items-center text-base font-semibold">
              <Calendar className="h-4 w-4 mr-2" />
              Upload Date Range
            </Label>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleDateFromChange(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleDateToChange(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Format Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center text-base font-semibold">
                <FileText className="h-4 w-4 mr-2" />
                Format
              </Label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['PDF', 'EPUB', 'TXT'].map((fmt) => (
                <Button
                  key={fmt}
                  variant={filters.format!.includes(fmt) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFormatToggle(fmt)}
                  className="justify-center text-sm"
                >
                  {fmt}
                </Button>
              ))}
            </div>
            {filters.format && filters.format.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {filters.format.length} format{filters.format.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Sort Options */}
          <div className="space-y-3">
            <Label className="flex items-center text-base font-semibold">
              <SortAsc className="h-4 w-4 mr-2" />
              Sort By
            </Label>
            <div className="space-y-2">
              <Select value={filters.sortBy} onValueChange={handleSortByChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSortOrderToggle}
                className="w-full"
              >
                {filters.sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <SheetFooter className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            Reset All
          </Button>
          <SheetClose asChild>
            <Button className="flex-1">Apply Filters</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
});

export default AdvancedFiltersComponent;
