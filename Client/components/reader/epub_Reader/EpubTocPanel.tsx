import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { NavItem } from 'epubjs';

interface EpubTocPanelProps {
  toc: NavItem[];
  onItemClick: (href: string) => void;
  onClose: () => void;
}

export default function EpubTocPanel({ toc, onItemClick, onClose }: EpubTocPanelProps) {
  return (
    <div className="absolute top-0 left-0 h-full w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg overflow-auto z-20">
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Table of Contents</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="p-2">
        {toc.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No table of contents available</p>
        ) : (
          toc.map((item, index) => (
            <button
              key={index}
              onClick={() => onItemClick(item.href)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300"
            >
              {item.label}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
