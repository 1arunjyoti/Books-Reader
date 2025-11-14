"use client";

import { useState, useEffect } from 'react';
import { 
  Folder, 
  Plus, 
  Edit2, 
  Trash2,
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  addBooksToCollection,
  Collection,
  CreateCollectionData,
  UpdateCollectionData
} from '@/lib/api';
import { logger } from '@/lib/logger';

interface CollectionsManagerProps {
  accessToken: string;
  selectedBookIds?: string[];
  onCollectionChange?: () => void;
}

const COLLECTION_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Teal', value: '#14b8a6' },
];

const COLLECTION_ICONS = [
  { name: 'Folder', value: 'folder' },
  { name: 'Open Folder', value: 'folder-open' },
  { name: 'Star', value: 'star' },
  { name: 'Heart', value: 'heart' },
  { name: 'Book', value: 'book' },
  { name: 'Bookmark', value: 'bookmark' },
];

export function CollectionsManager({ 
  accessToken, 
  selectedBookIds = [],
  onCollectionChange 
}: CollectionsManagerProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState(COLLECTION_COLORS[0].value);
  const [formIcon, setFormIcon] = useState(COLLECTION_ICONS[0].value);

  useEffect(() => {
    loadCollections();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCollections = async () => {
    try {
      setIsLoading(true);
      const data = await getCollections(accessToken);
      setCollections(data);
    } catch (error) {
        logger.error('Error loading collections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!formName.trim()) {
      alert('Please enter a collection name');
      return;
    }

    try {
      const data: CreateCollectionData = {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        color: formColor,
        icon: formIcon
      };

      await createCollection(data, accessToken);
      setShowCreateDialog(false);
      resetForm();
      await loadCollections();
      onCollectionChange?.();
    } catch (error) {
        logger.error('Error creating collection:', error);
      alert(error instanceof Error ? error.message : 'Failed to create collection');
    }
  };

  const handleUpdateCollection = async () => {
    if (!editingCollection) return;
    
    if (!formName.trim()) {
      alert('Please enter a collection name');
      return;
    }

    try {
      const data: UpdateCollectionData = {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        color: formColor,
        icon: formIcon
      };

      await updateCollection(editingCollection.id, data, accessToken);
      setShowEditDialog(false);
      setEditingCollection(null);
      resetForm();
      await loadCollections();
      onCollectionChange?.();
    } catch (error) {
        logger.error('Error updating collection:', error);
      alert(error instanceof Error ? error.message : 'Failed to update collection');
    }
  };

  const handleDeleteCollection = async (collection: Collection) => {
    if (!confirm(`Are you sure you want to delete "${collection.name}"?`)) {
      return;
    }

    try {
      await deleteCollection(collection.id, accessToken);
      await loadCollections();
      onCollectionChange?.();
    } catch (error) {
        logger.error('Error deleting collection:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete collection');
    }
  };

  const handleAddBooksToCollection = async (collectionId: string) => {
    if (selectedBookIds.length === 0) {
      alert('No books selected');
      return;
    }

    try {
      await addBooksToCollection(collectionId, selectedBookIds, accessToken);
      await loadCollections();
      onCollectionChange?.();
    } catch (error) {
        logger.error('Error adding books to collection:', error);
      alert(error instanceof Error ? error.message : 'Failed to add books to collection');
    }
  };

  const openEditDialog = (collection: Collection) => {
    setEditingCollection(collection);
    setFormName(collection.name);
    setFormDescription(collection.description || '');
    setFormColor(collection.color || COLLECTION_COLORS[0].value);
    setFormIcon(collection.icon || COLLECTION_ICONS[0].value);
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormColor(COLLECTION_COLORS[0].value);
    setFormIcon(COLLECTION_ICONS[0].value);
  };

  const handleOpenCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Collections</h2>
        <Button onClick={handleOpenCreateDialog} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Collection
        </Button>
      </div>

      {collections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No collections yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Create collections to organize your books
            </p>
            <Button onClick={handleOpenCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Collection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Card key={collection.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: collection.color || '#3b82f6' }}
                    >
                      {collection.icon === 'folder-open' ? (
                        <FolderOpen className="h-5 w-5 text-white" />
                      ) : (
                        <Folder className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{collection.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {collection.bookIds.length} {collection.bookIds.length === 1 ? 'book' : 'books'}
                      </p>
                    </div>
                  </div>
                  {!collection.isDefault && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEditDialog(collection)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDeleteCollection(collection)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                {collection.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {collection.description}
                  </p>
                )}
                {selectedBookIds.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleAddBooksToCollection(collection.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add {selectedBookIds.length} {selectedBookIds.length === 1 ? 'book' : 'books'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Collection Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
            <DialogDescription>
              Organize your books into collections
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Collection Name</Label>
              <Input
                id="name"
                placeholder="e.g., Science Fiction, To Read"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Brief description of this collection"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLLECTION_COLORS.map((color) => (
                  <button
                    key={color.value}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formColor === color.value ? 'border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setFormColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCollection}>Create Collection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Collection Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
            <DialogDescription>
              Update collection details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Collection Name</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Science Fiction, To Read"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Input
                id="edit-description"
                placeholder="Brief description of this collection"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLLECTION_COLORS.map((color) => (
                  <button
                    key={color.value}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formColor === color.value ? 'border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setFormColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCollection}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
