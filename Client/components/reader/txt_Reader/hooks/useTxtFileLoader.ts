import { useState, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

interface UseTxtFileLoaderOptions {
  fileUrl: string | null;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  maxFileSize?: number; // in MB, default 50MB
  sectionSize?: number; // characters per section, default 5000
}

interface UseTxtFileLoaderReturn {
  sections: string[];
  currentSection: number;
  setCurrentSection: (section: number) => void;
  isLoading: boolean;
  error: string | null;
  sectionRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  scrollContainerRef: React.MutableRefObject<HTMLDivElement | null>;
}

/**
 * Custom hook for loading and managing TXT file sections
 * Handles file fetching, size validation, section splitting, and section tracking
 */
export function useTxtFileLoader({
  fileUrl,
  currentPage = 0,
  onPageChange,
  maxFileSize = 50,
  sectionSize = 5000,
}: UseTxtFileLoaderOptions): UseTxtFileLoaderReturn {
  const [sections, setSections] = useState<string[]>([]);
  const [currentSection, setCurrentSection] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load text file and split into sections
  useEffect(() => {
    if (!fileUrl) {
      setError('No file URL provided');
      setIsLoading(false);
      return;
    }

    const loadTextFile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error('Failed to load text file');
        }

        // SECURITY: Check file size before loading
        const contentLength = response.headers.get('content-length');
        const maxBytes = maxFileSize * 1024 * 1024;
        if (contentLength && parseInt(contentLength) > maxBytes) {
          throw new Error(`File too large. Maximum size is ${maxFileSize}MB.`);
        }

        const text = await response.text();
        
        // SECURITY: Validate text length after loading
        if (text.length > maxBytes) {
          throw new Error('File content exceeds maximum size limit.');
        }

        // Split into sections
        const textSections: string[] = [];
        for (let i = 0; i < text.length; i += sectionSize) {
          textSections.push(text.slice(i, i + sectionSize));
        }

        setSections(textSections);
        
        // Set current section from saved page
        const initialSection = Math.min(currentPage, textSections.length - 1);
        setCurrentSection(initialSection);

        setIsLoading(false);
      } catch (err) {
        logger.error('Error loading text file:', err);
        setError(err instanceof Error ? err.message : 'Failed to load text file');
        setIsLoading(false);
      }
    };

    loadTextFile();
  }, [fileUrl, currentPage, maxFileSize, sectionSize]);

  // Initialize section refs array when sections change
  useEffect(() => {
    if (sections.length > 0) {
      sectionRefs.current = new Array(sections.length);
    }
  }, [sections.length, currentPage]);

  // PERFORMANCE: Track visible section with Intersection Observer for scroll-based navigation
  useEffect(() => {
    if (sections.length === 0 || !scrollContainerRef.current) return;
    
    let observer: IntersectionObserver | null = null;
    
    // Wait for refs to be populated (next tick after render)
    const timeoutId = setTimeout(() => {
      const observerOptions = {
        root: scrollContainerRef.current,
        rootMargin: '0px', // Simple margin - detect anything visible
        threshold: [0, 0.1, 0.5], // Multiple thresholds for better detection
      };

      const observerCallback = (entries: IntersectionObserverEntry[]) => {
        // Find the section with highest visibility
        const visibleSections = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleSections.length > 0) {
          const topEntry = visibleSections[0];
          const sectionIndex = parseInt(
            topEntry.target.getAttribute('data-section-index') || '0'
          );
          setCurrentSection(sectionIndex);
          if (onPageChange) {
            onPageChange(sectionIndex);
          }
        }
      };

      observer = new IntersectionObserver(observerCallback, observerOptions);

      // Observe all section elements
      sectionRefs.current.forEach((section) => {
        if (section && observer) {
          observer.observe(section);
        }
      });
    }, 50); // Small delay to ensure DOM is ready

    return () => {
      clearTimeout(timeoutId);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [sections, onPageChange]); // Re-run when sections change

  return {
    sections,
    currentSection,
    setCurrentSection,
    isLoading,
    error,
    sectionRefs,
    scrollContainerRef,
  };
}
