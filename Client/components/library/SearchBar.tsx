"use client";

import React, { memo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

type SearchBarProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  id?: string;
};

const SearchBar = memo(function SearchBar({
  value,
  onChange,
  placeholder = 'Search by title, author, or genre...',
  className = '',
  id,
}: SearchBarProps) {
  return (
    <div className={`flex-1 min-w-0 ${className}`}>
      <div className="relative h-12">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <Input
          id={id}
          type="text"
          className="h-12 pl-11 pr-4 text-sm bg-white dark:bg-gray-800 border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent transition-all"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
});

export default SearchBar;
