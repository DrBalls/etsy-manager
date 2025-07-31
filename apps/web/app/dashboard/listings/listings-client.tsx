'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Package, Plus, Grid, List } from 'lucide-react';
import { ListingsTable } from '@/components/listings/listings-table';
import { ListingsFilters } from '@/components/listings/listings-filters';
import { BulkActions } from '@/components/listings/bulk-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Heart } from 'lucide-react';
import Link from 'next/link';

interface ListingsClientProps {
  initialListings: any[];
  shopId: string;
}

export function ListingsClient({ initialListings, shopId }: ListingsClientProps) {
  const router = useRouter();
  const [listings, setListings] = useState(initialListings);
  const [filteredListings, setFilteredListings] = useState(initialListings);
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const handleFilterChange = (filters: any) => {
    let filtered = [...listings];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        listing.sku?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // State filter
    if (filters.state !== 'all') {
      filtered = filtered.filter(listing =>
        listing.state.toLowerCase() === filters.state.toLowerCase()
      );
    }

    // Stock level filter
    if (filters.stockLevel !== 'all') {
      switch (filters.stockLevel) {
        case 'in_stock':
          filtered = filtered.filter(listing => listing.quantity > 5);
          break;
        case 'low_stock':
          filtered = filtered.filter(listing => listing.quantity > 0 && listing.quantity <= 5);
          break;
        case 'out_of_stock':
          filtered = filtered.filter(listing => listing.quantity === 0);
          break;
      }
    }

    // Price range filter
    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(v => v === '+' ? Infinity : parseInt(v));
      filtered = filtered.filter(listing => {
        if (max === Infinity) return listing.price >= min;
        return listing.price >= min && listing.price <= max;
      });
    }

    // Sort
    const [sortBy, sortOrder] = filters.sortBy.split('_');
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'updated':
          aVal = new Date(a.updatedAt).getTime();
          bVal = new Date(b.updatedAt).getTime();
          break;
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'views':
          aVal = a.views;
          bVal = b.views;
          break;
        case 'favorites':
          aVal = a.favoritersCount;
          bVal = b.favoritersCount;
          break;
        case 'stock':
          aVal = a.quantity;
          bVal = b.quantity;
          break;
        default:
          return 0;
      }
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    setFilteredListings(filtered);
  };

  const handleBulkAction = async (action: string, listingIds: string[]) => {
    switch (action) {
      case 'delete':
        if (confirm(`Are you sure you want to delete ${listingIds.length} listings?`)) {
          // Implement delete
          for (const id of listingIds) {
            await fetch(`/api/listings/${id}`, { method: 'DELETE' });
          }
          setListings(listings.filter(l => !listingIds.includes(l.id)));
          setFilteredListings(filteredListings.filter(l => !listingIds.includes(l.id)));
          setSelectedListings([]);
        }
        break;
      case 'deactivate':
        // Implement deactivate
        for (const id of listingIds) {
          await fetch(`/api/listings/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: 'INACTIVE' }),
          });
        }
        router.refresh();
        break;
      case 'edit':
        if (listingIds.length === 1) {
          router.push(`/dashboard/listings/${listingIds[0]}/edit`);
        }
        break;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Listings</h1>
        <div className="flex items-center gap-2">
          <BulkActions
            selectedListings={selectedListings}
            onSelectionChange={setSelectedListings}
            onBulkAction={handleBulkAction}
          />
          <div className="flex rounded-lg border">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-l-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => router.push('/dashboard/listings/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Listing
          </Button>
        </div>
      </div>

      <ListingsFilters onFilterChange={handleFilterChange} />

      {filteredListings.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Listings Found</h2>
          <p className="text-muted-foreground mb-4">
            {listings.length === 0 
              ? "Create your first listing or sync from Etsy"
              : "Try adjusting your filters"}
          </p>
          {listings.length === 0 && (
            <div className="flex gap-2 justify-center">
              <Button onClick={() => router.push('/dashboard/listings/new')}>
                Create Listing
              </Button>
              <Button variant="outline">Sync from Etsy</Button>
            </div>
          )}
        </div>
      ) : (
        <div>
          {viewMode === 'table' ? (
            <ListingsTable
              listings={filteredListings}
              selectedListings={selectedListings}
              onSelectionChange={setSelectedListings}
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredListings.map((listing) => (
                <Link key={listing.id} href={`/dashboard/listings/${listing.id}`}>
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-2">{listing.title}</CardTitle>
                        <Badge className={getStateBadgeClass(listing.state)}>
                          {listing.state}
                        </Badge>
                      </div>
                      <CardDescription>
                        ${listing.price.toFixed(2)} {listing.currencyCode}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {listing.images && listing.images[0] && (
                        <img
                          src={listing.images[0].url}
                          alt={listing.title}
                          className="w-full h-48 object-cover rounded-md"
                        />
                      )}
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <Package className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                          <p className="font-medium">{listing.quantity}</p>
                          <p className="text-xs text-muted-foreground">Stock</p>
                        </div>
                        <div className="text-center">
                          <Eye className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                          <p className="font-medium">{listing.views.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Views</p>
                        </div>
                        <div className="text-center">
                          <Heart className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                          <p className="font-medium">{listing.favoritersCount}</p>
                          <p className="text-xs text-muted-foreground">Favorites</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}