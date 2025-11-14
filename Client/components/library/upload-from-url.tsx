"use client";

import { useState } from 'react';
import { Link as LinkIcon, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { uploadFromUrl } from '@/lib/api';
import { useTokenCache } from '@/hooks/useTokenCache';

interface UploadFromUrlProps {
  onUploadComplete?: () => void;
  onUploadError?: (error: string) => void;
}

export function UploadFromUrl({ onUploadComplete, onUploadError }: UploadFromUrlProps) {
  const getAccessToken = useTokenCache();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Please sign in to upload files');
      }

      await uploadFromUrl(url, accessToken);
      
      setUrl('');
      setOpen(false);
      onUploadComplete?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file from URL';
      setError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isUploading) {
      setOpen(newOpen);
      if (!newOpen) {
        setUrl('');
        setError(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className='w-full h-full sm:h-auto sm:w-auto justify-between border-gray-500 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 group text-sm sm:text-base'>
          <LinkIcon className="h-4 w-4 gap-2" />
          <span className="hidden sm:inline">Upload from URL</span>
          <span className="sm:hidden">URL</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload PDF from URL</DialogTitle>
          <DialogDescription>
            Enter a direct link to a PDF file to add it to your library
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              type="url"
              placeholder="https://example.com/document.pdf"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isUploading) {
                  handleUpload();
                }
              }}
              disabled={isUploading}
            />
            {error && (
              <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              The URL must be a direct link to a PDF file (max 100MB)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isUploading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isUploading || !url.trim()}>
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
