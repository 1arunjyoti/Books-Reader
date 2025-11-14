/**
 * Upload API utilities for handling file uploads to the server
 */

import { logger } from './logger';
import { API_ENDPOINTS } from './config';

const SERVER_URL = API_ENDPOINTS.BASE;

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  fileName: string;
  fileUrl: string;
  fileId: string;
  metadata: {
    originalName: string;
    uploadedAt: string;
    size: number;
    userId: string;
  };
}

export interface UploadError {
  error: string;
  message?: string;
}

/**
 * Upload a single file to the server
 * @param file - The file to upload
 * @param onProgress - Optional callback for upload progress
 * @param accessToken - Auth0 access token for authentication
 * @returns Promise with upload result
 */
export async function uploadFile(
  file: File,
  onProgress?: (progress: UploadProgress) => void,
  accessToken?: string
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        });
      }
    });

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch {
          reject(new Error('Failed to parse server response'));
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          reject(new Error(errorResponse.error || 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error occurred during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was cancelled'));
    });

    // Open and send request
    xhr.open('POST', `${SERVER_URL}/api/upload`);
    
    // Add Authorization header if token is provided
    if (accessToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    }
    
    xhr.send(formData);
  });
}

/**
 * Upload multiple files sequentially
 * @param files - Array of files to upload
 * @param onFileProgress - Callback for individual file progress
 * @param onOverallProgress - Callback for overall progress
 * @param accessToken - Auth0 access token for authentication
 * @returns Promise with array of upload results
 */
export async function uploadMultipleFiles(
  files: File[],
  onFileProgress?: (fileIndex: number, progress: UploadProgress) => void,
  onOverallProgress?: (completed: number, total: number) => void,
  accessToken?: string
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  const errors: { file: string; error: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadFile(
        files[i],
        (progress) => {
          onFileProgress?.(i, progress);
        },
        accessToken
      );
      results.push(result);
      onOverallProgress?.(i + 1, files.length);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push({
        file: files[i].name,
        error: errorMessage,
      });
      logger.error(`Failed to upload ${files[i].name}:`, error);
    }
  }

  if (errors.length > 0 && results.length === 0) {
    throw new Error(
      `All uploads failed. First error: ${errors[0].error}`
    );
  }

  if (errors.length > 0) {
    logger.warn('Some uploads failed:', errors);
  }

  return results;
}
