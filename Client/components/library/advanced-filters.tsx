"use client";

import { useState, memo } from 'react';
import { Calendar, Tag, Globe, SortAsc, SidebarOpen, FileText } from 'lucide-react';
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
          className="h-12 px-4 border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-800 backdrop-blur-sm text-gray-700 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:border-blue-300/50 dark:hover:border-blue-700/50 group text-sm font-medium rounded-xl transition-all duration-200 shadow-sm gap-2"
        >
          <SidebarOpen className="h-4 w-4 text-gray-500 group-hover:text-blue-500 transition-colors" />
          <span className="hidden sm:inline">Filters</span>
          
          {activeFiltersCount > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-[10px] font-bold text-blue-600 dark:text-blue-400">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="flex flex-col h-full border-l border-gray-200/50 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl w-full sm:max-w-md p-0 overflow-hidden">

        {/* SheetHeader */}
        <SheetHeader className="flex-none px-6 py-6 border-b border-gray-100 dark:border-gray-800">
          <SheetTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">Advanced Filters</SheetTitle>
          <SheetDescription className="text-gray-500 dark:text-gray-400">
            Refine your library search with specific criteria
          </SheetDescription>
        </SheetHeader>

        {/* Filters */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Genre Filter */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                <Tag className="h-4 w-4 mr-2 text-blue-500" />
                Genres
              </Label>
              {filters.genre.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearGenres}
                  className="h-6 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Clear
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => handleGenreToggle(genre)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                    filters.genre.includes(genre)
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800" />

          {/* Language Filter */}
          <div className="space-y-4">
            <Label className="flex items-center text-sm font-semibold text-gray-900 dark:text-gray-100">
              <Globe className="h-4 w-4 mr-2 text-purple-500" />
              Language
            </Label>
            <Select 
              value={filters.language === '' ? 'all' : filters.language} 
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger className="h-11 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:ring-purple-500/20">
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

          <div className="h-px bg-gray-100 dark:bg-gray-800" />

          {/* Date Range Filter */}
          <div className="space-y-4">
            <Label className="flex items-center text-sm font-semibold text-gray-900 dark:text-gray-100">
              <Calendar className="h-4 w-4 mr-2 text-orange-500" />
              Upload Date
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 dark:text-gray-400 ml-1">From</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleDateFromChange(e.target.value)}
                  className="h-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus-visible:ring-orange-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 dark:text-gray-400 ml-1">To</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleDateToChange(e.target.value)}
                  className="h-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus-visible:ring-orange-500/20"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800" />

          {/* Format Filter */}
          <div className="space-y-4">
            <Label className="flex items-center text-sm font-semibold text-gray-900 dark:text-gray-100">
              <FileText className="h-4 w-4 mr-2 text-green-500" />
              Format
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {['PDF', 'EPUB', 'TXT'].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleFormatToggle(fmt)}
                  className={`flex items-center justify-center py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                    filters.format!.includes(fmt)
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 shadow-sm'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800" />

          {/* Sort Options */}
          <div className="space-y-4">
            <Label className="flex items-center text-sm font-semibold text-gray-900 dark:text-gray-100">
              <SortAsc className="h-4 w-4 mr-2 text-pink-500" />
              Sort By
            </Label>
            <div className="grid grid-cols-[1fr,auto] gap-3">
              <Select value={filters.sortBy} onValueChange={handleSortByChange}>
                <SelectTrigger className="h-11 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:ring-pink-500/20">
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
                onClick={handleSortOrderToggle}
                className="h-11 w-11 px-0 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {filters.sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <SheetFooter className="flex-none p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 flex-row gap-3 sm:justify-between">
          <Button 
            variant="ghost" 
            onClick={handleReset} 
            className="flex-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Reset All
          </Button>
          <SheetClose asChild>
            <Button className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
              Apply Filters
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
});

export default AdvancedFiltersComponent;
