"use client";

import { useState, useEffect } from "react";
import { Folder, FolderOpen, Library, ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getCollections, Collection, deleteCollection } from "@/lib/api";
import { useTokenCache } from "@/hooks/useTokenCache";
import { logger } from '@/lib/logger';

interface CollectionFilterProps {
  selectedCollectionId: string | null;
  onCollectionChange: (collectionId: string | null) => void;
}

export function CollectionFilter({
  selectedCollectionId,
  onCollectionChange
}: CollectionFilterProps) {
  const getAccessToken = useTokenCache();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    
    const fetchCollections = async () => {
      try {
        setIsLoading(true);
        const token = await getAccessToken();
        if (!token || !isMounted) return;
        
        // Note: getCollections would need to accept signal parameter for abort to work
        // For now, we still protect against state updates on unmounted component
        const data = await getCollections(token);
        
        if (isMounted) {
          // Defensive: Ensure data is an array
          if (Array.isArray(data)) {
            setCollections(data);
          } else {
            logger.warn("getCollections returned non-array data:", data);
            setCollections([]);
          }
        }
      } catch (error) {
        // Ignore AbortError when component unmounts
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        if (isMounted) {
          logger.error("Error loading collections:", error);
          setCollections([]); // Ensure collections is always an array even on error
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCollections();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [getAccessToken]);

  const loadCollections = async () => {
    try {
      setIsLoading(true);
      const token = await getAccessToken();
      if (!token) return;
      
      const data = await getCollections(token);
      
      // Defensive: Ensure data is an array
      if (Array.isArray(data)) {
        setCollections(data);
      } else {
        logger.warn("getCollections returned non-array data:", data);
        setCollections([]);
      }
    } catch (error) {
      logger.error("Error loading collections:", error);
      setCollections([]); // Ensure collections is always an array even on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (collection: Collection, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollectionToDelete(collection);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!collectionToDelete) return;
    
    try {
      setIsDeleting(true);
      const token = await getAccessToken();
      if (!token) return;
      
      await deleteCollection(collectionToDelete.id, token);
      
      if (selectedCollectionId === collectionToDelete.id) {
        onCollectionChange(null);
      }
      
      await loadCollections();
      
      setDeleteDialogOpen(false);
      setCollectionToDelete(null);
    } catch (error) {
      logger.error("Error deleting collection:", error);
      alert("Failed to delete collection. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedCollection = Array.isArray(collections) 
    ? collections.find(c => c.id === selectedCollectionId) 
    : undefined;
  const displayText = selectedCollection ? selectedCollection.name : "All Collections";

  return (
    <>
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-auto w-auto justify-between border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-800 backdrop-blur-sm text-gray-700 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:border-blue-300/50 dark:hover:border-blue-700/50 group text-sm font-medium rounded-xl transition-all duration-200 shadow-sm gap-2"
        >
          <div className="flex items-center">
            <Library className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
            <span className="truncate">{displayText}</span>
          </div>
          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-blue-500  transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-45 sm:w-50 ring-1 ring-border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
        <DropdownMenuLabel className="px-8">Filter by Collection</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuCheckboxItem
          checked={selectedCollectionId === null}
          onCheckedChange={() => onCollectionChange(null)}
          className="cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            <span>All Collections</span>
          </div>
        </DropdownMenuCheckboxItem>
        
        {isLoading ? (
          <div className="px-2 py-3 text-center">
            <span className="text-sm text-muted-foreground">Loading collections...</span>
          </div>
        ) : collections.length === 0 ? (
          <div className="px-2 py-3 text-center">
            <span className="text-sm text-muted-foreground">No collections yet</span>
          </div>
        ) : (
          collections.map((collection) => (
            <DropdownMenuCheckboxItem
              key={collection.id}
              checked={selectedCollectionId === collection.id}
              onCheckedChange={() => onCollectionChange(collection.id)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2 flex-1">
                <div 
                  className="w-4 h-4 rounded flex items-center justify-center"
                  style={{ backgroundColor: collection.color || "#3b82f6" }}
                >
                  {collection.icon === "folder-open" ? (
                    <FolderOpen className="h-2.5 w-2.5 text-white" />
                  ) : (
                    <Folder className="h-2.5 w-2.5 text-white" />
                  )}
                </div>
                <span className="truncate w-16">{collection.name}</span>
                <span className="text-xs text-muted-foreground ml-1">
                  ({collection.bookIds.length})
                </span>
                <button
                  onClick={(e) => handleDeleteClick(collection, e)}
                  className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                  title="Delete collection"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                </button>
              </div>
            </DropdownMenuCheckboxItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
    
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Collection</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the collection &quot;{collectionToDelete?.name}&quot;?
            This action cannot be undone. Books in this collection will not be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
