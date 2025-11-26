"use client";

import React, { memo } from 'react';
import { Filter, ChevronDown, BookOpen, Bookmark, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

export type BookStatus = 'all' | 'reading' | 'want-to-read' | 'read' | 'unread';

type Props = {
  value: BookStatus;
  onChange: (s: BookStatus) => void;
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'reading':
      return <BookOpen className="w-4 h-4 text-blue-500" />;
    case 'want-to-read':
      return <Bookmark className="w-4 h-4 text-yellow-500" />;
    case 'read':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'unread':
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return null;
  }
};

const getStatusLabel = (status: string) => {
  return status.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const StatusFilter = memo(function StatusFilter({ value, onChange }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-auto w-auto justify-between border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-800 backdrop-blur-sm text-gray-700 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:border-blue-300/50 dark:hover:border-blue-700/50 group text-sm font-medium rounded-xl transition-all duration-200 shadow-sm gap-2 data-[state=open]:bg-white dark:data-[state=open]:bg-gray-700 "
        >
          <Filter className="h-4 w-4 mr-1 text-gray-500 group-hover:text-blue-500 transition-colors" />
          <span className="text-md font-medium">
            {value === 'all' ? 'Status' : getStatusLabel(value)}
          </span>
          <ChevronDown className="h-4 w-4  text-gray-400 group-hover:text-blue-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-45 sm:w-50 ml-2 sm:ml-0 ring-1 ring-border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
        <DropdownMenuLabel className='px-8'>Filter by Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {['all', 'reading', 'want-to-read', 'read', 'unread'].map((status) => (
          <DropdownMenuCheckboxItem
            key={status}
            checked={value === status}
            onCheckedChange={() => onChange(status as BookStatus)}
            className="cursor-pointer"
          >
            <div className="flex items-center">
              {status !== 'all' && (
                <span className="mr-2">
                  {getStatusIcon(status)}
                </span>
              )}
              {status === 'all' ? 'All Books' : getStatusLabel(status)}
            </div>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

export default StatusFilter;
