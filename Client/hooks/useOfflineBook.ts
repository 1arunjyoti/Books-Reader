import { useState, useEffect, useCallback } from 'react';
import { Book, getPresignedUrl } from '@/lib/api';
import { offlineStorage } from '@/lib/offline-storage';
import { useTokenCache } from '@/contexts/AuthTokenContext';
import { toast } from 'sonner';

export function useOfflineBook(bookId: string, book?: Book) {
  const [isOffline, setIsOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const getAccessToken = useTokenCache();

  const checkOfflineStatus = useCallback(async () => {
    try {
      const status = await offlineStorage.isBookOffline(bookId);
      setIsOffline(status);
    } catch (error) {
      console.error('Error checking offline status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    checkOfflineStatus();
  }, [checkOfflineStatus]);

  const saveOffline = async () => {
    if (!book) return;
    
    try {
      setIsDownloading(true);
      const token = await getAccessToken();
      if (!token) throw new Error('No access token');

      // Get download URL
      const url = await getPresignedUrl(book.id, token);
      
      // Fetch the file
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to download file');
      
      const blob = await response.blob();
      
      // Save to IndexedDB
      await offlineStorage.saveBookOffline(book, blob);
      
      setIsOffline(true);
      toast.success('Book downloaded for offline reading');
    } catch (error) {
      console.error('Error saving book offline:', error);
      toast.error('Failed to download book');
    } finally {
      setIsDownloading(false);
    }
  };

  const removeOffline = async () => {
    try {
      setIsDownloading(true); // Reusing loading state
      await offlineStorage.removeOfflineBook(bookId);
      setIsOffline(false);
      toast.success('Book removed from device');
    } catch (error) {
      console.error('Error removing book offline:', error);
      toast.error('Failed to remove book');
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    isOffline,
    isLoading,
    isDownloading,
    saveOffline,
    removeOffline,
    refreshStatus: checkOfflineStatus
  };
}
