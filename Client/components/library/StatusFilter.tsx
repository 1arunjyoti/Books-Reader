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
          variant="ghost"
          className="h-8 px-3 hover:bg-white dark:hover:bg-gray-700 data-[state=open]:bg-white dark:data-[state=open]:bg-gray-700 transition-all"
        >
          <Filter className="h-4 w-4 mr-1 text-gray-500" />
          <span className="text-md font-medium">
            {value === 'all' ? 'Status' : getStatusLabel(value)}
          </span>
          <ChevronDown className="h-4 w-4  text-gray-400 transition-transform duration-200" />
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
