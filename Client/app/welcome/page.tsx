"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import WelcomeScreen from '@/components/library/welcome-screen';
import { fetchUserProfile } from '@/lib/api/user-profile';
import { useTokenCache } from '@/hooks/useTokenCache';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { logger } from '@/lib/logger';

function WelcomePageContent() {
  const router = useRouter();
  const getAccessToken = useTokenCache();
  const [userName, setUserName] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          logger.warn('[Welcome Page] No access token available');
          setIsLoading(false);
          return;
        }

        const userProfile = await fetchUserProfile('user', token, ['name']);
        if (userProfile?.name) {
          setUserName(userProfile.name);
        }
      } catch (error) {
        logger.warn('[Welcome Page] Failed to fetch user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserName();
  }, [getAccessToken]);

  // Handle closing welcome screen - navigate back to library
  const handleCloseWelcome = useCallback(() => {
    router.push('/library');
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading welcome screen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <WelcomeScreen 
        onClose={handleCloseWelcome}
        userName={userName}
      />
    </div>
  );
}

export default function WelcomePage() {
  return (
    <ErrorBoundary>
      <WelcomePageContent />
    </ErrorBoundary>
  );
}
