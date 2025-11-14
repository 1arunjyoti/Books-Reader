"use client";

import React, { memo } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPrev: () => void;
  onNext: () => void;
};

function range(start: number, end: number) {
  const res = [] as number[];
  for (let i = start; i <= end; i++) res.push(i);
  return res;
}

const LibraryPagination = memo(function LibraryPagination({ currentPage, totalPages, onPageChange, onPrev, onNext }: Props) {
  if (totalPages <= 1) return null;

  // Simple windowed pagination
  const maxButtons = 7;
  let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  const end = Math.min(totalPages, start + maxButtons - 1);
  if (end - start + 1 < maxButtons) {
    start = Math.max(1, end - maxButtons + 1);
  }

  const pages = range(start, end);

  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <Button size="sm" variant="ghost" onClick={onPrev} disabled={currentPage <= 1}>
        Prev
      </Button>
      {pages.map(p => (
        <Button
          key={p}
          size="sm"
          variant={p === currentPage ? 'default' : 'ghost'}
          onClick={() => onPageChange(p)}
          className={p === currentPage ? 'font-bold' : ''}
        >
          {p}
        </Button>
      ))}
      <Button size="sm" variant="ghost" onClick={onNext} disabled={currentPage >= totalPages}>
        Next
      </Button>
    </div>
  );
});

export default LibraryPagination;
