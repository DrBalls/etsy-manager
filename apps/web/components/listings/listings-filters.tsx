'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Filter, X } from 'lucide-react';

interface ListingsFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

interface FilterState {
  search: string;
  state: string;
  stockLevel: string;
  priceRange: string;
  sortBy: string;
}

export function ListingsFilters({ onFilterChange }: ListingsFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    state: 'all',
    stockLevel: 'all',
    priceRange: 'all',
    sortBy: 'updated_desc',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const defaultFilters: FilterState = {
      search: '',
      state: 'all',
      stockLevel: 'all',
      priceRange: 'all',
      sortBy: 'updated_desc',
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const hasActiveFilters = 
    filters.search !== '' ||
    filters.state !== 'all' ||
    filters.stockLevel !== 'all' ||
    filters.priceRange !== 'all';

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search listings..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filters.state} onValueChange={(value) => handleFilterChange('state', value)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated_desc">Recently Updated</SelectItem>
            <SelectItem value="updated_asc">Oldest Updated</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
            <SelectItem value="views_desc">Most Views</SelectItem>
            <SelectItem value="favorites_desc">Most Favorites</SelectItem>
            <SelectItem value="stock_asc">Stock: Low to High</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Filter className="h-4 w-4" />
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearFilters}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showAdvanced && (
        <div className="rounded-lg border p-4 space-y-4">
          <h3 className="font-medium text-sm">Advanced Filters</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="stock-level">Stock Level</Label>
              <Select value={filters.stockLevel} onValueChange={(value) => handleFilterChange('stockLevel', value)}>
                <SelectTrigger id="stock-level">
                  <SelectValue placeholder="All Stock Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock Levels</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock (≤5)</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-range">Price Range</Label>
              <Select value={filters.priceRange} onValueChange={(value) => handleFilterChange('priceRange', value)}>
                <SelectTrigger id="price-range">
                  <SelectValue placeholder="All Prices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="0-25">$0 - $25</SelectItem>
                  <SelectItem value="25-50">$25 - $50</SelectItem>
                  <SelectItem value="50-100">$50 - $100</SelectItem>
                  <SelectItem value="100-250">$100 - $250</SelectItem>
                  <SelectItem value="250+">$250+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}