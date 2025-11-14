import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface Props {
  colorFilter: 'none' | 'sepia' | 'dark' | 'custom';
  customBgColor: string;
  setColorFilter: (v: 'none' | 'sepia' | 'dark' | 'custom') => void;
  setCustomBgColor: (c: string) => void;
  onClose: () => void;
}

export default function EpubColorFilterPanel({
  colorFilter,
  customBgColor,
  setColorFilter,
  setCustomBgColor,
  onClose,
}: Props) {
  return (
    <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-lg z-30 w-64">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Reading Themes</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        <button
          onClick={() => setColorFilter('none')}
          className={`w-full text-left px-3 py-2 rounded-md text-sm ${
            colorFilter === 'none'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          None (Default)
        </button>
        <button
          onClick={() => setColorFilter('sepia')}
          className={`w-full text-left px-3 py-2 rounded-md text-sm ${
            colorFilter === 'sepia'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Sepia (Warm)
        </button>
        <button
          onClick={() => setColorFilter('dark')}
          className={`w-full text-left px-3 py-2 rounded-md text-sm ${
            colorFilter === 'dark'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Night Mode
        </button>
        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
          <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Custom Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={customBgColor}
              onChange={(e) => {
                setCustomBgColor(e.target.value);
                setColorFilter('custom');
              }}
              className="h-8 w-full rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
