"use client";

import { useState, useRef, useCallback, ChangeEvent } from 'react';
import { Upload, Link as LinkIcon, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { uploadMultipleFiles, UploadProgress, UploadResult } from '@/lib/upload';
import { uploadFromUrl } from '@/lib/api';
import { useTokenCache } from '@/hooks/useTokenCache';
import { logger } from '@/lib/logger';

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
const ACCEPTED_MIME_TYPES = ["application/pdf", "application/epub+zip", "text/plain"];
const ACCEPTED_EXTENSIONS = [".pdf", ".epub", ".txt"];

export type FileUploadState = {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  result?: UploadResult;
};

interface UploadDialogProps {
  onUploadComplete?: (results: UploadResult[]) => void;
  onUploadError?: (error: string) => void;
}

const isValidFileType = (file: File) => {
  if (ACCEPTED_MIME_TYPES.includes(file.type)) {
    return true;
  }
  const lowerName = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
};

const isValidFileSize = (file: File) => file.size <= MAX_FILE_SIZE_BYTES;

export function UploadDialog({ onUploadComplete, onUploadError }: UploadDialogProps) {
  const getAccessToken = useTokenCache();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'files' | 'url'>('files');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // File upload states
  const [uploadStates, setUploadStates] = useState<FileUploadState[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // URL upload states
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isUrlUploading, setIsUrlUploading] = useState(false);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: File[]) => {
    setIsUploading(true);

    try {
      const accessToken = await getAccessToken();
      
      if (!accessToken) {
        throw new Error('Please sign in to upload files');
      }

      const results = await uploadMultipleFiles(
        files,
        (fileIndex, progress: UploadProgress) => {
          setUploadStates(prev => {
            const newStates = [...prev];
            newStates[fileIndex] = {
              ...newStates[fileIndex],
              progress: progress.percentage,
              status: 'uploading',
            };
            return newStates;
          });
        },
        (completed, total) => {
          logger.debug(`Uploaded ${completed} of ${total} files`);
        },
        accessToken
      );

      setUploadStates(prev => {
        return prev.map((state, index) => {
          const result = results[index];
          if (result) {
            return {
              ...state,
              status: 'success',
              progress: 100,
              result,
            };
          }
          return {
            ...state,
            status: 'error',
            error: 'Upload failed',
          };
        });
      });

      onUploadComplete?.(results);

      // Auto close after successful upload
      setTimeout(() => {
        setOpen(false);
        setUploadStates([]);
      }, 2000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);

      setUploadStates(prev => {
        return prev.map(state => {
          if (state.status === 'pending' || state.status === 'uploading') {
            return {
              ...state,
              status: 'error',
              error: errorMessage,
            };
          }
          return state;
        });
      });
    } finally {
      setIsUploading(false);
    }
  }, [getAccessToken, onUploadComplete, onUploadError]);

  // Process selected files
  const processFiles = useCallback(async (files: File[]) => {
    setValidationError(null);

    if (files.length === 0) {
      return;
    }

    const invalidType = files.find((file) => !isValidFileType(file));
    if (invalidType) {
      setValidationError(`"${invalidType.name}" is not a supported file type. Only PDF, EPUB, and TXT files are allowed.`);
      return;
    }

    const oversizedFile = files.find((file) => !isValidFileSize(file));
    if (oversizedFile) {
      setValidationError(`"${oversizedFile.name}" exceeds the 100MB size limit.`);
      return;
    }

    const initialStates: FileUploadState[] = files.map(file => ({
      file,
      progress: 0,
      status: 'pending',
    }));
    setUploadStates(initialStates);

    await handleFileUpload(files);
  }, [handleFileUpload]);

  // Handle drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFiles(files);
    }
  }, [processFiles]);

  // Handle file input change
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    await processFiles(files);
    event.target.value = "";
  };

  // Handle URL upload
  const handleUrlUpload = async () => {
    if (!url.trim()) {
      setUrlError('Please enter a valid URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setUrlError('Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    setIsUrlUploading(true);
    setUrlError(null);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Please sign in to upload files');
      }

      await uploadFromUrl(url, accessToken);
      
      setUrl('');
      onUploadComplete?.([]);
      
      // Auto close after successful upload
      setTimeout(() => {
        setOpen(false);
      }, 1000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file from URL';
      setUrlError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsUrlUploading(false);
    }
  };

  // Remove file from upload list
  const handleRemoveFile = (index: number) => {
    setUploadStates(prev => prev.filter((_, i) => i !== index));
  };

  // Trigger file input
  const handleBrowseClick = () => {
    setValidationError(null);
    fileInputRef.current?.click();
  };

  // Reset dialog state
  const handleOpenChange = (newOpen: boolean) => {
    if (!isUploading && !isUrlUploading) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset states when closing
        setUploadStates([]);
        setValidationError(null);
        setUrl('');
        setUrlError(null);
        setActiveTab('files');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>

      {/* Dialog Trigger button*/}
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="default"
          className="h-12 px-4 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-md font-medium shadow-sm rounded-lg"
        >
          Upload Books
          <Upload className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      {/* Dialog Content */}
      <DialogContent className="rounded-lg max-w-[40vh] sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">

        {/* Dialog Header */}
        <DialogHeader>
          <DialogTitle>Upload Books to Your Library</DialogTitle>
          <DialogDescription>
            Upload files from your device or provide a URL to add books to your library
          </DialogDescription>
        </DialogHeader>

        {/* Tabs for Upload Methods */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'files' | 'url')} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Upload Files
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Upload from URL
            </TabsTrigger>
          </TabsList>

          {/* Upload Files Tab */}
          <TabsContent value="files" className="flex-1 flex flex-col overflow-hidden mt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.epub,.txt,application/pdf,application/epub+zip,text/plain"
              className="hidden"
              multiple
              onChange={handleFileChange}
              disabled={isUploading}
            />

            {/* Drag and Drop Area */}
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${isDragging 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }
                ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
              `}
              onClick={handleBrowseClick}
            >
              <div className="flex flex-col items-center gap-3">
                <div className={`p-3 rounded-full ${isDragging ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Upload className={`h-8 w-8 ${isDragging ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} />
                </div>
                <div>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    or click to browse
                  </p>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Supports PDF, EPUB, and TXT files up to 100MB each
                </p>
              </div>
            </div>

            {/* Validation Error */}
            {validationError && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    {validationError}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setValidationError(null);
                  }}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            )}

            {/* Upload Progress */}
            {uploadStates.length > 0 && (
              <div className="mt-4 flex-1 overflow-y-auto">
                <div className="space-y-3">
                  {uploadStates.map((state, index) => (
                    <div 
                      key={`${state.file.name}-${index}`}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {state.file.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {(state.file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            {state.status === 'pending' && !isUploading && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFile(index);
                                }}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                              >
                                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              </button>
                            )}
                            {state.status === 'success' && (
                              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-xs font-medium">Uploaded</span>
                              </div>
                            )}
                            {state.status === 'error' && (
                              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-xs font-medium">Failed</span>
                              </div>
                            )}
                          </div>
                          
                          {state.status === 'uploading' && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  Uploading...
                                </span>
                                <span className="text-xs font-medium text-gray-900 dark:text-white">
                                  {state.progress}%
                                </span>
                              </div>
                              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500 transition-all duration-300"
                                  style={{ width: `${state.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {state.status === 'error' && state.error && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              {state.error}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Upload from URL Tab */}
          <TabsContent value="url" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="url-input" className="text-sm font-medium text-gray-900 dark:text-white">
                  Book URL
                </label>
                <Input
                  id="url-input"
                  type="url"
                  placeholder="https://example.com/document.pdf"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setUrlError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isUrlUploading) {
                      handleUrlUpload();
                    }
                  }}
                  disabled={isUrlUploading}
                  className="h-10"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter a direct link to a PDF, EPUB, or TXT file (max 100MB)
                </p>
              </div>

              {urlError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-200 flex-1">
                    {urlError}
                  </p>
                  <button
                    onClick={() => setUrlError(null)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded transition-colors"
                  >
                    <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              )}

              <Button 
                onClick={handleUrlUpload} 
                disabled={isUrlUploading || !url.trim()}
                className="w-full"
              >
                {isUrlUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload from URL
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
