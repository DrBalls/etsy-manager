'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Edit, Archive, Trash, Copy, Tag, Package } from 'lucide-react';

interface BulkActionsProps {
  selectedListings: string[];
  onSelectionChange: (listingIds: string[]) => void;
  onBulkAction: (action: string, listingIds: string[]) => void;
}

export function BulkActions({ selectedListings, onSelectionChange, onBulkAction }: BulkActionsProps) {
  const hasSelection = selectedListings.length > 0;

  const handleBulkAction = (action: string) => {
    if (!hasSelection) return;
    onBulkAction(action, selectedListings);
  };

  return (
    <div className="flex items-center gap-4">
      {hasSelection && (
        <>
          <p className="text-sm text-muted-foreground">
            {selectedListings.length} {selectedListings.length === 1 ? 'item' : 'items'} selected
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectionChange([])}
          >
            Clear selection
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Bulk Actions
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleBulkAction('edit')}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Selected
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('duplicate')}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('updateTags')}>
                <Tag className="mr-2 h-4 w-4" />
                Update Tags
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('updateInventory')}>
                <Package className="mr-2 h-4 w-4" />
                Update Inventory
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleBulkAction('deactivate')}>
                <Archive className="mr-2 h-4 w-4" />
                Deactivate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleBulkAction('delete')}
                className="text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}