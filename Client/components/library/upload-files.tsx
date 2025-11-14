"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Info, Upload } from "lucide-react";
import { logger } from "@/lib/logger";

import { Button } from "@/components/ui/button";
import { uploadMultipleFiles, UploadProgress, UploadResult } from "@/lib/upload";
import { useTokenCache } from "@/hooks/useTokenCache";

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

type UploadFilesProps = {
  onUploadComplete?: (results: UploadResult[]) => void;
  onUploadError?: (error: string) => void;
  onUploadStatesChange?: (states: FileUploadState[]) => void;
  onValidationError?: (error: string | null) => void;
};

const isValidFileType = (file: File) => {
  if (ACCEPTED_MIME_TYPES.includes(file.type)) {
    return true;
  }

  const lowerName = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
};

const isValidFileSize = (file: File) => file.size <= MAX_FILE_SIZE_BYTES;

export function UploadFiles({ onUploadComplete, onUploadError, onUploadStatesChange, onValidationError }: UploadFilesProps) {
  const getAccessToken = useTokenCache();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Use a ref to track current upload states without causing re-renders
  const uploadStatesRef = useRef<FileUploadState[]>([]);

  // Notify parent component when upload states change
  const updateUploadStates = (statesOrUpdater: FileUploadState[] | ((prev: FileUploadState[]) => FileUploadState[])) => {
    const newStates = typeof statesOrUpdater === 'function' ? statesOrUpdater(uploadStatesRef.current) : statesOrUpdater;
    uploadStatesRef.current = newStates;
    onUploadStatesChange?.(newStates);
  };

  // Notify parent component when validation error occurs
  const setValidationError = (errorMessage: string | null) => {
    onValidationError?.(errorMessage);
  };

  const handleTriggerInput = () => {
    setValidationError(null);
    inputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      updateUploadStates([]);
      setValidationError(null);
      return;
    }

    const invalidType = files.find((file) => !isValidFileType(file));
    if (invalidType) {
      setValidationError("Only PDF, EPUB, and TXT files are allowed.");
      updateUploadStates([]);
      event.target.value = "";
      return;
    }

    const oversizedFile = files.find((file) => !isValidFileSize(file));
    if (oversizedFile) {
      setValidationError("Each file must be 100MB or smaller.");
      updateUploadStates([]);
      event.target.value = "";
      return;
    }

    setValidationError(null);
    
    const initialStates: FileUploadState[] = files.map(file => ({
      file,
      progress: 0,
      status: 'pending',
    }));
    updateUploadStates(initialStates);

    await handleUpload(files);
    
    event.target.value = "";
  };

  const handleUpload = async (files: File[]) => {
    setIsUploading(true);

    try {
      // Get access token for authentication
      const accessToken = await getAccessToken();
      
      if (!accessToken) {
        throw new Error('Please sign in to upload files');
      }

      const results = await uploadMultipleFiles(
        files,
        (fileIndex, progress: UploadProgress) => {
          updateUploadStates(prev => {
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
          logger.log(`Uploaded ${completed} of ${total} files`);
        },
        accessToken
      );

      updateUploadStates(prev => {
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

      setTimeout(() => {
        updateUploadStates([]);
      }, 3000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);

      updateUploadStates(prev => {
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
  };

  return (
    <div className="flex w-full flex-col sm:w-auto">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.epub,.txt,application/pdf,application/epub+zip,text/plain"
        className="hidden"
        multiple
        onChange={handleFileChange}
        disabled={isUploading}
      />
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <Button
          type="button"
          variant="outline"
          size="default"
          className="w-full h-full sm:w-auto sm:h-auto justify-between border-gray-500 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 group text-sm sm:text-base"
          onClick={handleTriggerInput}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload Files'}
          <Upload className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="hidden h-9 w-9 border border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:text-gray-100 sm:inline-flex"
          title="Supports PDF, EPUB, and TXT formats up to 100MB each"
          aria-label="Upload requirements"
          onClick={(event) => {
            event.preventDefault();
          }}
        >
          <Info className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 sm:hidden">
        Supports PDF, EPUB, TXT up to 100MB each.
      </p>
    </div>
  );
}
