"use client";

import React, { memo } from 'react';
import { Grid3x3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  viewMode: 'grid' | 'list';
  setViewMode: (m: 'grid' | 'list') => void;
};

const ViewModeToggle = memo(function ViewModeToggle({ viewMode, setViewMode }: Props) {
  return (
    <div className="flex items-center p-1 bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-sm h-12">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setViewMode('grid')}
        className={`h-10 px-3 rounded-lg transition-all duration-200 ${
          viewMode === 'grid'
            ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
            : ' hover:text-gray-700 dark:hover:text-gray-200 hover:bg-transparent'
        }`}
        title="Grid view"
      >
        <Grid3x3 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setViewMode('list')}
        className={`h-10 px-3 rounded-lg transition-all duration-200 ${
          viewMode === 'list'
            ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
            : ' hover:text-gray-700 dark:hover:text-gray-200 hover:bg-transparent'
        }`}
        title="List view"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
});

export default ViewModeToggle;
