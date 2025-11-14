"use client";

import { useEffect, useState } from 'react';
import { X, ChevronRight, ChevronDown, BookMarked } from 'lucide-react';
import { Button } from '@/components/ui/button';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PDFDocumentProxy = any;

interface OutlineItem {
  title: string;
  dest: string | null;
  pageNumber?: number;
  items?: OutlineItem[];
  expanded?: boolean;
}

interface TOCPanelProps {
  pdfDoc: PDFDocumentProxy | null;
  currentPage: number;
  onJumpToPage: (page: number) => void;
  onClose: () => void;
}

export default function TOCPanel({
  pdfDoc,
  currentPage,
  onJumpToPage,
  onClose,
}: TOCPanelProps) {
  const [outline, setOutline] = useState<OutlineItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Load PDF outline/table of contents
  useEffect(() => {
    const loadOutline = async () => {
      if (!pdfDoc) return;

      try {
        setLoading(true);
        const outlineData = await pdfDoc.getOutline();

        if (!outlineData || outlineData.length === 0) {
          setOutline(null);
          setLoading(false);
          return;
        }

        // Resolve page numbers for each outline item
        const resolvePageNumbers = async (items: OutlineItem[]): Promise<OutlineItem[]> => {
          const resolved = [];
          for (const item of items) {
            const resolvedItem = { ...item };
            
            // Get page number from destination
            if (item.dest) {
              try {
                const dest = typeof item.dest === 'string' 
                  ? await pdfDoc.getDestination(item.dest)
                  : item.dest;
                
                if (dest && dest[0]) {
                  const pageRef = dest[0];
                  const pageIndex = await pdfDoc.getPageIndex(pageRef);
                  resolvedItem.pageNumber = pageIndex + 1; // 1-indexed
                }
              } catch (err) {
                console.error('Error resolving page number:', err);
              }
            }

            // Recursively resolve nested items
            if (item.items && item.items.length > 0) {
              resolvedItem.items = await resolvePageNumbers(item.items);
            }

            resolved.push(resolvedItem);
          }
          return resolved;
        };

        const resolvedOutline = await resolvePageNumbers(outlineData);
        setOutline(resolvedOutline);
      } catch (err) {
        console.error('Error loading outline:', err);
        setOutline(null);
      } finally {
        setLoading(false);
      }
    };

    loadOutline();
  }, [pdfDoc]);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const renderOutlineItem = (item: OutlineItem, level: number = 0) => {
    const hasChildren = item.items && item.items.length > 0;
    const isExpanded = expandedItems.has(item.title);
    const isActive = item.pageNumber === currentPage;

    return (
      <div key={item.title} className="select-none">
        <div
          className={`
            flex items-center gap-2 py-2 px-3 cursor-pointer rounded-md transition-colors
            ${isActive 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }
          `}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={() => {
            if (item.pageNumber) {
              onJumpToPage(item.pageNumber);
            }
            if (hasChildren) {
              toggleExpanded(item.title);
            }
          }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(item.title);
              }}
              className="flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          
          <span className="flex-1 text-sm truncate" title={item.title}>
            {item.title}
          </span>
          
          {item.pageNumber && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
              {item.pageNumber}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {item.items!.map((child) => renderOutlineItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookMarked className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Table of Contents
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Loading table of contents...
            </div>
          </div>
        ) : outline && outline.length > 0 ? (
          <div className="space-y-1">
            {outline.map((item) => renderOutlineItem(item))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <BookMarked className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              This PDF doesn&apos;t have a table of contents.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
