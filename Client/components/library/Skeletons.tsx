"use client";

import React from 'react';

type Props = {
  viewMode: 'grid' | 'list';
  skeletonCount: number;
};

export default function Skeletons({ viewMode, skeletonCount }: Props) {
  return (
    <>
      {viewMode === 'grid' ? (
        <div className="grid items-stretch grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div
              key={`skeleton-grid-${i}`}
              className="h-full flex flex-col relative rounded-xl overflow-hidden shadow-sm transition-all duration-300 border border-gray-200/30 dark:border-gray-700/30 bg-white/40 dark:bg-gray-800/40 animate-pulse"
            >
              <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-700" />
              <div className="p-3 sm:p-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div
              key={`skeleton-list-${i}`}
              className="group relative rounded-lg shadow-sm transition-all duration-300 border border-gray-200/30 dark:border-gray-700/30 overflow-hidden bg-white/40 dark:bg-gray-800/40 animate-pulse"
            >
              <div className="relative flex gap-3 p-3 lg:p-4 items-start">
                <div className="w-28 h-40 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
