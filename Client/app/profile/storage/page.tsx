"use client";

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Trash2, 
  FileText, 
  AlertCircle, 
  HardDrive, 
  Cloud
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useTokenCache } from '@/hooks/useTokenCache';
import { fetchBooks, deleteBook, deleteBooks, Book } from '@/lib/api';
import { fetchUserProfile } from '@/lib/api/user-profile';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function StoragePage() {
  const router = useRouter();
  const getAccessToken = useTokenCache();
  const queryClient = useQueryClient();
  
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortConfig, setSortConfig] = useState<string>('size_desc');

  // Parse sort config
  const [sortBy, sortOrder] = sortConfig === 'date_desc' ? ['uploadedAt', 'desc'] :
                             sortConfig === 'date_asc' ? ['uploadedAt', 'asc'] :
                             sortConfig === 'size_asc' ? ['fileSize', 'asc'] :
                             ['fileSize', 'desc']; // default size_desc

  // Fetch user profile for total usage
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', 'storage'],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) return null;
      return fetchUserProfile('user', token, ['usedStorage']);
    }
  });

  // Fetch books sorted by size
  const { data: books, isLoading, error } = useQuery({
    queryKey: ['books', 'storage-management', sortBy, sortOrder],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error('Please sign in to manage storage');
      
      return fetchBooks(token, {
        sortBy: sortBy as 'fileSize' | 'uploadedAt',
        sortOrder: sortOrder as 'asc' | 'desc'
      });
    }
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDelete = async () => {
    if (!bookToDelete && selectedBooks.length === 0) return;

    try {
      setIsDeleting(true);
      const token = await getAccessToken();
      if (!token) return;

      if (bookToDelete) {
        await deleteBook(bookToDelete.id, token);
      } else {
        await deleteBooks(selectedBooks, token);
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      
      setBookToDelete(null);
      setSelectedBooks([]);
    } catch (error) {
      console.error('Failed to delete book(s):', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelection = (bookId: string) => {
    setSelectedBooks(prev => 
      prev.includes(bookId) 
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const toggleAll = () => {
    if (!books) return;
    if (selectedBooks.length === books.length) {
      setSelectedBooks([]);
    } else {
      setSelectedBooks(books.map(b => b.id));
    }
  };

  const totalStorage = 5 * 1024 * 1024 * 1024; // 5 GB
  const usedStorage = userProfile?.usedStorage || 0;
  const percentage = Math.min((usedStorage / totalStorage) * 100, 100);
  const isHighUsage = percentage > 80;

  // Calculate storage by type
  const storageByType = books?.reduce((acc, book) => {
    const type = (book.fileType || 'other').toUpperCase();
    acc[type] = (acc[type] || 0) + book.fileSize;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(storageByType || {}).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const selectedSize = useMemo(() => {
    if (!books) return 0;
    return books
      .filter(b => selectedBooks.includes(b.id))
      .reduce((acc, b) => acc + b.fileSize, 0);
  }, [books, selectedBooks]);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8 pt-24 md:pt-32 max-w-5xl">
        {/* Header Section */}
        <div className="mb-8 space-y-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="pl-0 hover:bg-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Button>
          
          <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-stretch">
            {/* Title & Info */}
            <div className="flex-1 space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                Storage Management
              </h1>
              <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl">
                View and manage your uploaded files. Keep track of your storage usage to ensure you have space for new books.
              </p>
            </div>

            {/* Storage Card & Chart Container */}
            <div className="flex flex-col md:flex-row gap-6 w-full lg:w-auto">

              {/* Chart Card */}
              {books && books.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 w-full lg:w-80">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Storage by Type</h3>
                  <div className="h-[200px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => formatBytes(value)}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 block">Total</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{formatBytes(usedStorage)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {chartData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-gray-600 dark:text-gray-300">{entry.name}</span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{formatBytes(entry.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Storage Card */}
              <div className={cn(
                "w-full lg:w-80 p-6 rounded-2xl shadow-lg transition-all duration-300",
                "bg-gradient-to-br from-blue-600 to-indigo-700 text-white",
                "dark:from-blue-900 dark:to-indigo-950"
              )}>
                <div className="flex items-center justify-between mb-6">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <Cloud className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                    {percentage.toFixed(1)}% Used
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm font-medium mb-2 opacity-90">
                      <span>{formatBytes(usedStorage)}</span>
                      <span>{formatBytes(totalStorage)}</span>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000 ease-out",
                          isHighUsage ? "bg-red-400" : "bg-white"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-blue-100/80 leading-relaxed">
                    {isHighUsage 
                      ? "You're running low on storage. Consider deleting some large files to free up space."
                      : "You have plenty of storage space available for more books."}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/30 dark:bg-gray-900/50">
            <div className="flex items-center gap-4">
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <FileText className="w-4 h-4 mr-2" />
                {books?.length || 0} Files
              </div>
              {selectedBooks.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {selectedBooks.length} selected
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setBookToDelete({} as Book)} // Trigger bulk delete dialog
                    className="h-8 px-3 text-xs cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3 " />
                    Delete Selected
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 hidden sm:inline-block">Sort by:</span>
              <Select value={sortConfig} onValueChange={setSortConfig}>
                <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="size_desc">Largest First</SelectItem>
                  <SelectItem value="size_asc">Smallest First</SelectItem>
                  <SelectItem value="date_desc">Newest First</SelectItem>
                  <SelectItem value="date_asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="p-20 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading your library...</p>
            </div>
          ) : error ? (
            <div className="p-20 text-center text-red-500 bg-red-50/50 dark:bg-red-900/10">
              <AlertCircle className="h-10 w-10 mx-auto mb-4" />
              <p>Failed to load files. Please try again later.</p>
            </div>
          ) : books && books.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50/50 border-gray-100 dark:border-gray-800">
                    <TableHead className="w-[50px] pl-6">
                      <Checkbox 
                        checked={selectedBooks.length === books.length}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead className="w-[40%]">File Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {books.map((book) => (
                    <TableRow 
                      key={book.id} 
                      className={cn(
                        "group transition-colors border-gray-100 dark:border-gray-800",
                        selectedBooks.includes(book.id) 
                          ? "bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50/70 dark:hover:bg-blue-900/30"
                          : "hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
                      )}
                    >
                      <TableCell className="pl-6">
                        <Checkbox 
                          checked={selectedBooks.includes(book.id)}
                          onCheckedChange={() => toggleSelection(book.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div className={cn(
                            "p-2.5 rounded-xl mr-4 transition-colors",
                            book.fileType === 'pdf' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" :
                            book.fileType === 'epub' ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" :
                            "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                          )}>
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1 mb-0.5">
                              {book.title}
                            </div>
                            {book.author && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                {book.author}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 uppercase tracking-wide">
                          {book.fileType || 'UNK'}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-gray-600 dark:text-gray-300">
                        {formatBytes(book.fileSize)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(book.uploadedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setBookToDelete(book)}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-24 text-center">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <HardDrive className="h-10 w-10 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No files found</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                You haven&apos;t uploaded any books yet. Once you do, they&apos;ll appear here for you to manage.
              </p>
            </div>
          )}
        </div>

        <AlertDialog open={!!bookToDelete || (selectedBooks.length > 0 && !!bookToDelete)} onOpenChange={(open) => !open && setBookToDelete(null)}>
          <AlertDialogContent className="sm:max-w-[425px] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
            <AlertDialogHeader>
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4 mx-auto">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-center text-xl">
                {bookToDelete?.id ? 'Delete File?' : `Delete ${selectedBooks.length} Files?`}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center pt-2">
                {bookToDelete?.id ? (
                  <>
                    Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">&quot;{bookToDelete.title}&quot;</span>? 
                    <br />
                    This will permanently remove the file and free up <span className="font-medium text-gray-900 dark:text-white">{formatBytes(bookToDelete.fileSize)}</span>.
                  </>
                ) : (
                  <>
                    Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">{selectedBooks.length} selected files</span>?
                    <br />
                    This will permanently remove them and free up <span className="font-medium text-gray-900 dark:text-white">{formatBytes(selectedSize)}</span>.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center gap-2 mt-4">
              <AlertDialogCancel disabled={isDeleting} className="w-full sm:w-auto mt-0">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white border-0"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
