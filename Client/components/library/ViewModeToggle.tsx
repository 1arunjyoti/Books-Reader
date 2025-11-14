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
    <div className="flex items-center gap-0.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <Button
        variant={viewMode === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('grid')}
        className={`h-8 px-3 rounded-md transition-all ${
          viewMode === 'grid'
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
        }`}
        title="Grid view"
      >
        <Grid3x3 className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('list')}
        className={`h-8 px-3 rounded-md transition-all ${
          viewMode === 'list'
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
        }`}
        title="List view"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
});

export default ViewModeToggle;
