"use client";

import { Progress } from "@/components/ui/progress";
import { Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface UsedStorageSectionProps {
  usedStorage: number;
}

const UsedStorageSection = ({ usedStorage }: UsedStorageSectionProps) => {
  const safeUsedStorage = Number(usedStorage) || 0;
  const totalStorage = 5 * 1024 * 1024 * 1024; // 5 GB
  const percentage = Math.min((safeUsedStorage / totalStorage) * 100, 100);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-left">
            <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">Storage</h3>
            <p className="text-xs text-muted-foreground">
              {formatBytes(safeUsedStorage)} of {formatBytes(totalStorage)}
            </p>
          </div>
        </div>
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {percentage.toFixed(0)}%
        </span>
      </div>
      
      <Progress value={percentage} className="h-2 bg-gray-100 dark:bg-gray-800" indicatorClassName="bg-gradient-to-r from-blue-500 to-purple-600" />
      
      <div className="pt-1">
        <Link href="/profile/storage" className="w-full">
          <Button variant="outline" size="sm" className="w-full text-xs h-8 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
            Manage Storage
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default UsedStorageSection;