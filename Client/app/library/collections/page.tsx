"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CollectionsManager } from '@/components/library/collections-manager';
import { getAccessToken } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function CollectionsPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await getAccessToken();
        setAccessToken(token);
      } catch (error) {
        console.error('Error loading access token:', error);
      } finally {
        setLoading(false);
      }
    };

    loadToken();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to manage your collections
          </p>
          <Button onClick={() => router.push('/sign-in')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => router.push('/library')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Library
        </Button>
        <h1 className="text-3xl font-bold mb-2">Manage Collections</h1>
        <p className="text-muted-foreground">
          Organize your books into collections for easy access
        </p>
      </div>

      {/* Collections Manager */}
      <CollectionsManager
        accessToken={accessToken}
        onCollectionChange={() => {
          // Optionally refresh data or show notification
        }}
      />
    </div>
  );
}
