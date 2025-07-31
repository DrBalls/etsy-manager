'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Listing, ListingState } from '@/types/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Copy, Archive, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const stateColors: Record<ListingState, string> = {
  [ListingState.ACTIVE]: 'bg-green-100 text-green-800',
  [ListingState.INACTIVE]: 'bg-gray-100 text-gray-800',
  [ListingState.SOLD_OUT]: 'bg-red-100 text-red-800',
  [ListingState.DRAFT]: 'bg-yellow-100 text-yellow-800',
  [ListingState.EXPIRED]: 'bg-orange-100 text-orange-800',
};

export const ListingColumns: ColumnDef<Listing>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => {
      const listing = row.original;
      return (
        <div className="flex items-center space-x-3">
          {listing.images?.[0] && (
            <img
              src={listing.images[0].thumbnailUrl || listing.images[0].url}
              alt={listing.title}
              className="h-10 w-10 rounded object-cover"
            />
          )}
          <div>
            <div className="font-medium">{listing.title}</div>
            <div className="text-sm text-muted-foreground">
              SKU: {listing.sku || 'N/A'}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'state',
    header: 'Status',
    cell: ({ row }) => {
      const state = row.getValue('state') as ListingState;
      return (
        <Badge className={stateColors[state]} variant="secondary">
          {state.toLowerCase()}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => {
      const price = parseFloat(row.getValue('price'));
      const currency = row.original.currencyCode;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(price);
    },
  },
  {
    accessorKey: 'quantity',
    header: 'Stock',
    cell: ({ row }) => {
      const quantity = row.getValue('quantity') as number;
      return (
        <div className="text-center">
          <span className={quantity <= 5 ? 'text-red-600 font-medium' : ''}>
            {quantity}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'views',
    header: 'Views',
    cell: ({ row }) => row.getValue('views')?.toLocaleString() || '0',
  },
  {
    accessorKey: 'favoritersCount',
    header: 'Favorites',
    cell: ({ row }) => row.getValue('favoritersCount') || '0',
  },
  {
    accessorKey: 'updatedAt',
    header: 'Last Updated',
    cell: ({ row }) => {
      const date = row.getValue('updatedAt') as Date;
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const listing = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit listing
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Etsy
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];