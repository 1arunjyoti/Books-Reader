"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface DeleteGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalId: string;
  goalType: string;
  goalPeriod: string;
  onConfirmDelete: (goalId: string) => Promise<void>;
}

export function DeleteGoalDialog({
  open,
  onOpenChange,
  goalId,
  goalType,
  goalPeriod,
  onConfirmDelete,
}: DeleteGoalDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format goal description
  const formatGoalDescription = () => {
    const typeLabel = goalType.charAt(0).toUpperCase() + goalType.slice(1);
    const periodLabel = goalPeriod.charAt(0).toUpperCase() + goalPeriod.slice(1);
    return `${periodLabel} ${typeLabel} Goal`;
  };

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setError(null);
    }
    onOpenChange(newOpen);
  };

  // Handle delete action
  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);

    try {
      await onConfirmDelete(goalId);
      // Close dialog on success
      handleOpenChange(false);
    } catch (err) {
      console.error('Delete goal error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete goal. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-md rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle>Delete Reading Goal</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this goal? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Goal Information */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/50">
            <p className="text-sm font-medium">
              {formatGoalDescription()}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-3">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-800 dark:text-red-300">
                {error}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
