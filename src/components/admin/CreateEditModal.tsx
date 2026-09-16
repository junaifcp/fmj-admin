import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ManagedItem } from '@/types/admin';

interface CreateEditModalProps<T extends ManagedItem> {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; notes?: string }) => Promise<void>;
  item: T | null;
  title: string;
  loading?: boolean;
}

export function CreateEditModal<T extends ManagedItem>({
  isOpen,
  onClose,
  onSubmit,
  item,
  title,
  loading = false
}: CreateEditModalProps<T>) {
  const [formData, setFormData] = useState({
    name: '',
    notes: ''
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        notes: item.notes || ''
      });
    } else {
      setFormData({
        name: '',
        notes: ''
      });
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      await onSubmit({
        name: formData.name.trim(),
        notes: formData.notes.trim() || undefined
      });
      onClose();
    } catch (error) {
      // Error handling should be done in parent component
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {item ? `Edit ${title}` : `Create ${title}`}
          </DialogTitle>
          <DialogDescription>
            {item 
              ? `Update the details for this ${title.toLowerCase()}.`
              : `Add a new ${title.toLowerCase()} to the system.`
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={`Enter ${title.toLowerCase()} name`}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any additional notes or descriptions"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.name.trim() || loading}
            >
              {loading ? 'Saving...' : (item ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}