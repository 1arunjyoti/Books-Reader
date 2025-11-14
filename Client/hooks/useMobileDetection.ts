"use client";

import { useState, useEffect } from 'react';

/**
 * Hook to detect if the device is mobile based on screen width and user agent
 * Implements debouncing on resize events to prevent excessive re-renders
 * 
 * @param breakpoint - Width in pixels to consider as mobile (default: 768px)
 * @returns boolean indicating if the device is mobile
 */
export function useMobileDetection(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check user agent for mobile devices
    const checkMobile = () => {
      if (typeof window === 'undefined') return false;
      
      const userAgent = window.navigator.userAgent.toLowerCase();
      const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
      const isMobileUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword));
      
      // Also check screen width
      const isMobileWidth = window.innerWidth < breakpoint;
      
      return isMobileUserAgent || isMobileWidth;
    };

    // Set initial value
    setIsMobile(checkMobile());

    // Debounce resize events to prevent excessive re-renders
    // 150ms delay waits for resize to finish before updating state
    let resizeTimeout: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setIsMobile(checkMobile());
      }, 150);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [breakpoint]);

  return isMobile;
}
