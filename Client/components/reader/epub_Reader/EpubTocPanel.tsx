'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronRight } from 'lucide-react';
import type { NavItem } from 'epubjs';

interface EpubTocPanelProps {
  toc: NavItem[];
  onItemClick: (href: string) => void;
  onClose: () => void;
}

export default function EpubTocPanel({ toc, onItemClick, onClose }: EpubTocPanelProps) {
  return (
    <div className="absolute top-16 left-0 h-full w-80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 shadow-2xl overflow-auto z-20 flex flex-col">
      <div className="sticky top-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Table of Contents</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="h-8 w-8 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="p-2 flex-1 overflow-y-auto custom-scrollbar">
        {toc.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>No table of contents available</p>
          </div>
        ) : (
          <div className="space-y-1">
            {toc.map((item, index) => (
              <button
                key={index}
                onClick={() => onItemClick(item.href)}
                className="w-full text-left px-4 py-3 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-lg text-gray-700 dark:text-gray-300 text-sm transition-colors flex items-center justify-between group"
              >
                <span className="line-clamp-2">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
