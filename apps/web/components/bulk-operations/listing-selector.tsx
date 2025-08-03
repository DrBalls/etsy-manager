'use client';

import { useState, useCallback, useMemo } from 'react';
import { Listing } from '@prisma/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, CheckSquare, Square } from 'lucide-react';

interface ListingSelectorProps {
  listings: Listing[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function ListingSelector({
  listings,
  selectedIds,
  onSelectionChange,
}: ListingSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('title');

  const categories = useMemo(() => {
    const cats = new Set<string>();
    listings.forEach(listing => {
      if (listing.categoryPath && listing.categoryPath.length > 0 && listing.categoryPath[0]) {
        cats.add(listing.categoryPath[0]);
      }
    });
    return Array.from(cats).sort();
  }, [listings]);

  const filteredListings = useMemo(() => {
    let filtered = [...listings];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply state filter
    if (stateFilter !== 'all') {
      filtered = filtered.filter(listing => listing.state === stateFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(listing =>
        listing.categoryPath && listing.categoryPath[0]?.startsWith(categoryFilter)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'price':
          return (a.price?.toNumber() || 0) - (b.price?.toNumber() || 0);
        case 'quantity':
          return a.quantity - b.quantity;
        case 'views':
          return b.views - a.views;
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [listings, searchQuery, stateFilter, categoryFilter, sortBy]);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === filteredListings.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredListings.map(l => l.id));
    }
  }, [filteredListings, selectedIds, onSelectionChange]);

  const handleSelectListing = useCallback((listingId: string) => {
    if (selectedIds.includes(listingId)) {
      onSelectionChange(selectedIds.filter(id => id !== listingId));
    } else {
      onSelectionChange([...selectedIds, listingId]);
    }
  }, [selectedIds, onSelectionChange]);

  const handleSelectByCondition = useCallback((condition: string) => {
    let selected: string[] = [];

    switch (condition) {
      case 'active':
        selected = listings.filter(l => l.state === 'ACTIVE').map(l => l.id);
        break;
      case 'draft':
        selected = listings.filter(l => l.state === 'DRAFT').map(l => l.id);
        break;
      case 'low-stock':
        selected = listings.filter(l => l.quantity < 5).map(l => l.id);
        break;
      // case 'no-images':
      //   selected = listings.filter(l => !l.images || l.images.length === 0).map(l => l.id);
      //   break;
      case 'high-price':
        const avgPrice = listings.reduce((sum, l) => sum + (l.price?.toNumber() || 0), 0) / listings.length;
        selected = listings.filter(l => (l.price?.toNumber() || 0) > avgPrice * 1.5).map(l => l.id);
        break;
    }

    onSelectionChange(selected);
  }, [listings, onSelectionChange]);

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SOLD_OUT">Sold Out</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="price">Price</SelectItem>
            <SelectItem value="quantity">Quantity</SelectItem>
            <SelectItem value="views">Views</SelectItem>
            <SelectItem value="createdAt">Created Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Select Options */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
        >
          {selectedIds.length === filteredListings.length ? (
            <>
              <Square className="h-4 w-4 mr-2" />
              Deselect All
            </>
          ) : (
            <>
              <CheckSquare className="h-4 w-4 mr-2" />
              Select All
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSelectByCondition('active')}
        >
          Select Active
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSelectByCondition('draft')}
        >
          Select Drafts
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSelectByCondition('low-stock')}
        >
          Select Low Stock
        </Button>
      </div>

      {/* Listings Table */}
      <div className="border rounded-lg">
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedIds.length === filteredListings.length && filteredListings.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Views</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredListings.map((listing) => (
                <TableRow
                  key={listing.id}
                  className={selectedIds.includes(listing.id) ? 'bg-muted/50' : ''}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(listing.id)}
                      onCheckedChange={() => handleSelectListing(listing.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{listing.title}</TableCell>
                  <TableCell>{listing.skuNumber || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        listing.state === 'ACTIVE' ? 'default' :
                        listing.state === 'DRAFT' ? 'secondary' :
                        'outline'
                      }
                    >
                      {listing.state}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    ${listing.price?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell className="text-right">{listing.quantity}</TableCell>
                  <TableCell className="text-right">{listing.views}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Selection Summary */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium">
          {selectedIds.length} of {listings.length} listings selected
        </p>
        {selectedIds.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectionChange([])}
          >
            Clear Selection
          </Button>
        )}
      </div>
    </div>
  );
}