'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface CategoryMigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryToDelete: string;
  affectedCount: number;
  availableCategories: string[];
  onConfirm: (replacementCategory: string) => void;
  isConfirming?: boolean;
}

export function CategoryMigrationDialog({
  open,
  onOpenChange,
  categoryToDelete,
  affectedCount,
  availableCategories,
  onConfirm,
  isConfirming = false,
}: CategoryMigrationDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState('');

  const handleConfirm = () => {
    if (selectedCategory) {
      onConfirm(selectedCategory);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!isConfirming) {
        onOpenChange(open);
        if (!open) setSelectedCategory('');
      }
    }}>
      <DialogContent className="sm:max-w-[420px] bg-card/95 backdrop-blur-2xl border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Migrate Category</DialogTitle>
          <DialogDescription className="text-white/60">
            The category <strong className="text-white">"{categoryToDelete}"</strong> is currently used by {affectedCount} transaction{affectedCount !== 1 ? 's' : ''}. 
            Please select a replacement category to migrate these transactions to before deleting.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Select 
            value={selectedCategory} 
            onValueChange={(val) => setSelectedCategory(val || '')}
            disabled={isConfirming}
          >
            <SelectTrigger className="w-full bg-black/20 border-white/10 text-white">
              <SelectValue placeholder="Select replacement category" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-white/10">
              {availableCategories.length === 0 ? (
                <div className="p-2 text-sm text-white/50 text-center">
                  No other categories available.
                </div>
              ) : (
                availableCategories.map(cat => (
                  <SelectItem key={cat} value={cat} className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white cursor-pointer">
                    {cat}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedCategory('');
            }}
            disabled={isConfirming}
            className="border-white/10 bg-transparent text-white hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedCategory || isConfirming}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isConfirming ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Migrate & Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
