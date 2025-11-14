"use client";

import { useState, useEffect, useCallback } from "react";
import { Folder, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  getCollections,
  addBooksToCollection,
  removeBooksFromCollection,
  createCollection,
  Collection,
  CreateCollectionData
} from "@/lib/api";
import { logger } from '@/lib/logger';
import { useTokenCache } from "@/hooks/useTokenCache";

interface AddToCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookIds: string[];
  onSuccess?: () => void;
}

export function AddToCollectionDialog({
  open,
  onOpenChange,
  bookIds,
  onSuccess
}: AddToCollectionDialogProps) {
  const getAccessToken = useTokenCache();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");

  const loadCollections = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getAccessToken();
      if (!token) return;
      
      const data = await getCollections(token);
      setCollections(data);
      
      const preselected = new Set<string>();
      data.forEach(collection => {
        if (bookIds.some(bookId => collection.bookIds.includes(bookId))) {
          preselected.add(collection.id);
        }
      });
      setSelectedCollections(preselected);
    } catch (error) {
      logger.error("Error loading collections:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken, bookIds]);

  useEffect(() => {
    if (open) {
      loadCollections();
    }
  }, [open, loadCollections]);

  const handleToggleCollection = (collectionId: string) => {
    setSelectedCollections(prev => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      alert("Please enter a collection name");
      return;
    }

    try {
      setIsSaving(true);
      const token = await getAccessToken();
      if (!token) return;
      
      const data: CreateCollectionData = {
        name: newCollectionName.trim(),
      };
      
      await createCollection(data, token);
      setNewCollectionName("");
      setShowCreateForm(false);
      await loadCollections();
    } catch (error) {
      logger.error("Error creating collection:", error);
      alert(error instanceof Error ? error.message : "Failed to create collection");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = await getAccessToken();
      if (!token) return;

      const toAdd: string[] = [];
      const toRemove: string[] = [];

      collections.forEach(collection => {
        const hasBooks = bookIds.some(bookId => collection.bookIds.includes(bookId));
        const isSelected = selectedCollections.has(collection.id);

        if (isSelected && !hasBooks) {
          toAdd.push(collection.id);
        } else if (!isSelected && hasBooks) {
          toRemove.push(collection.id);
        }
      });

      await Promise.all([
        ...toAdd.map(collectionId => 
          addBooksToCollection(collectionId, bookIds, token)
        ),
        ...toRemove.map(collectionId => 
          removeBooksFromCollection(collectionId, bookIds, token)
        )
      ]);

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      logger.error("Error updating collections:", error);
      alert(error instanceof Error ? error.message : "Failed to update collections");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[40vh] sm:max-w-lg rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle>Add to Collection</DialogTitle>
          <DialogDescription>
            {bookIds.length === 1 
              ? "Choose which collections to add this book to" 
              : `Choose which collections to add ${bookIds.length} books to`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : collections.length === 0 && !showCreateForm ? (
            <div className="text-center py-8">
              <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                No collections yet. Create one now!
              </p>
              <Button size="sm" onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Collection
              </Button>
            </div>
          ) : collections.length === 0 && showCreateForm ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-collection-name">Collection Name</Label>
                <Input
                  id="new-collection-name"
                  placeholder="e.g., Science Fiction, To Read"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isSaving) {
                      handleCreateCollection();
                    } else if (e.key === "Escape") {
                      setShowCreateForm(false);
                      setNewCollectionName("");
                    }
                  }}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateCollection} 
                  disabled={isSaving || !newCollectionName.trim()}
                  className="flex-1"
                >
                  {isSaving ? "Creating..." : "Create Collection"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewCollectionName("");
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {!showCreateForm && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setShowCreateForm(true)}
                >
                  <Plus className="h-4 w-4" />
                  Create New Collection
                </Button>
              )}
              
              {showCreateForm && (
                <div className="space-y-3 p-3 border rounded-lg bg-muted/50 mb-3">
                  <div>
                    <Label htmlFor="quick-collection-name" className="text-sm">New Collection Name</Label>
                    <Input
                      id="quick-collection-name"
                      placeholder="e.g., Science Fiction"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isSaving) {
                          handleCreateCollection();
                        } else if (e.key === "Escape") {
                          setShowCreateForm(false);
                          setNewCollectionName("");
                        }
                      }}
                      autoFocus
                      className="h-9"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCreateCollection} 
                      disabled={isSaving || !newCollectionName.trim()}
                      size="sm"
                      className="flex-1"
                    >
                      {isSaving ? "Creating..." : "Create"}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewCollectionName("");
                      }}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="max-h-[400px] overflow-y-auto space-y-2">
              {collections.map((collection) => (
                <div 
                  key={collection.id} 
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => handleToggleCollection(collection.id)}
                >
                  <Checkbox
                    id={collection.id}
                    checked={selectedCollections.has(collection.id)}
                    onCheckedChange={() => handleToggleCollection(collection.id)}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <div 
                      className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: collection.color || "#3b82f6" }}
                    >
                      <Folder className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label 
                        htmlFor={collection.id} 
                        className="text-sm font-medium cursor-pointer"
                      >
                        {collection.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {collection.bookIds.length} {collection.bookIds.length === 1 ? "book" : "books"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>

          <Button onClick={handleSave} disabled={isLoading || isSaving || collections.length === 0}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
        
      </DialogContent>
    </Dialog>
  );
}
