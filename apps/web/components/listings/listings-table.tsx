'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, Edit, Copy, MoreHorizontal, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface Listing {
  id: string;
  title: string;
  state: string;
  price: number;
  currencyCode: string;
  quantity: number;
  views: number;
  favoritersCount: number;
  sku?: string | null;
  url: string;
  images?: { id: string; url: string }[];
  updatedAt: Date;
}

interface ListingsTableProps {
  listings: Listing[];
  selectedListings: string[];
  onSelectionChange: (listingIds: string[]) => void;
}

export function ListingsTable({ listings, selectedListings, onSelectionChange }: ListingsTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(listings.map(l => l.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (listingId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedListings, listingId]);
    } else {
      onSelectionChange(selectedListings.filter(id => id !== listingId));
    }
  };

  const getStateVariant = (state: string) => {
    switch (state) {
      case 'ACTIVE':
        return 'default';
      case 'INACTIVE':
        return 'secondary';
      case 'DRAFT':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStateBadgeClass = (state: string) => {
    switch (state) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return '';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox
                checked={selectedListings.length === listings.length && listings.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead className="w-[60px]">Image</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Views</TableHead>
            <TableHead>Favorites</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listings.map((listing) => (
            <TableRow key={listing.id}>
              <TableCell>
                <Checkbox
                  checked={selectedListings.includes(listing.id)}
                  onCheckedChange={(checked) => handleSelectOne(listing.id, checked as boolean)}
                />
              </TableCell>
              <TableCell>
                {listing.images && listing.images[0] ? (
                  <img
                    src={listing.images[0].url}
                    alt={listing.title}
                    className="w-10 h-10 rounded object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted" />
                )}
              </TableCell>
              <TableCell className="font-medium">
                <Link href={`/dashboard/listings/${listing.id}`} className="hover:underline">
                  {listing.title}
                </Link>
                {listing.sku && (
                  <p className="text-xs text-muted-foreground">SKU: {listing.sku}</p>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={getStateVariant(listing.state)} className={getStateBadgeClass(listing.state)}>
                  {listing.state}
                </Badge>
              </TableCell>
              <TableCell>${listing.price.toFixed(2)} {listing.currencyCode}</TableCell>
              <TableCell>
                {listing.quantity}
                {listing.quantity <= 5 && listing.quantity > 0 && (
                  <p className="text-xs text-red-600">Low stock</p>
                )}
              </TableCell>
              <TableCell>{listing.views.toLocaleString()}</TableCell>
              <TableCell>{listing.favoritersCount}</TableCell>
              <TableCell>{format(new Date(listing.updatedAt), 'MMM d, yyyy')}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/listings/${listing.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/listings/${listing.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={listing.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View on Etsy
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}