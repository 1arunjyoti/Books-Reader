import Skeletons from '@/components/library/Skeletons';

export default function Loading() {
  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-6 py-4 max-w-7xl">
      <div className="mb-4 sm:mb-6 md:mb-4 p-4 sm:p-6 md:p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-sm">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
        <div className="h-6 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      
      {/* Search Bar Skeleton */}
      <div className="md:sticky top-0 z-50 bg-white dark:bg-gray-900 mb-6 rounded-sm py-2">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>

      <Skeletons viewMode="grid" skeletonCount={10} />
    </div>
  );
}
