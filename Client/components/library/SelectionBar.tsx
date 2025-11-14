"use client";

import React, { memo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

type Props = {
  selectedCount: number;
  allSelected: boolean;
  onToggleSelectAll: () => void;
  onAddToCollection: () => void;
  onClearSelection: () => void;
};

const SelectionBar = memo(function SelectionBar({ selectedCount, allSelected, onToggleSelectAll, onAddToCollection, onClearSelection }: Props) {
  return (
    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4 flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-0">
      <div className="flex items-center gap-4">
        <Checkbox
          checked={allSelected}
          onCheckedChange={onToggleSelectAll}
        />
        <span className='text-md font-medium'> Select all</span>
        <span className="text-sm font-medium">
          {selectedCount} {selectedCount === 1 ? 'book' : 'books'} selected
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={onAddToCollection}
        >
          Add to Collection
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
        >
          Clear Selection
        </Button>
      </div>
    </div>
  );
});

export default SelectionBar;
