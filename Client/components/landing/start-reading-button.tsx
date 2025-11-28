'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export function StartReadingButton() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isSignedIn) {
      router.push('/library');
    } else {
      // Use fallback_redirect_url query param (new Clerk convention)
      router.push('/sign-in?fallback_redirect_url=/library');
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Start reading — open your library"
      className="bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xl text-white font-medium py-3 px-8 rounded-lg transition-colors flex items-center gap-2 justify-center cursor-pointer"
    >
      Start Reading <ArrowRight size={20} aria-hidden="true" />
    </button>
  );
}
