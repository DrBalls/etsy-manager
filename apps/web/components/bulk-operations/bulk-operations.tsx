'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { BulkEditForm } from './bulk-edit-form';
import { BulkImport } from './bulk-import';
import { BulkExport } from './bulk-export';
import { BulkActions } from './bulk-actions';
import { ListingSelector } from './listing-selector';
import { Listing } from '@prisma/client';
import { 
  Package, 
  Upload, 
  Download, 
  Zap,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';

interface BulkOperationsProps {
  listings: Listing[];
  shopId: string;
}

interface BulkOperation {
  id: string;
  type: 'edit' | 'import' | 'export' | 'action';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  total: number;
  message: string;
  errors?: string[];
}

export function BulkOperations({ listings, shopId }: BulkOperationsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [activeOperation, setActiveOperation] = useState<BulkOperation | null>(null);
  const [operationHistory, setOperationHistory] = useState<BulkOperation[]>([]);

  const handleListingSelect = useCallback((listingIds: string[]) => {
    setSelectedListings(listingIds);
  }, []);

  const handleBulkEdit = useCallback(async (updates: any) => {
    if (selectedListings.length === 0) {
      toast({
        title: 'No listings selected',
        description: 'Please select at least one listing to edit',
      });
      return;
    }

    const operation: BulkOperation = {
      id: `op-${Date.now()}`,
      type: 'edit',
      status: 'processing',
      progress: 0,
      total: selectedListings.length,
      message: 'Updating listings...',
    };

    setActiveOperation(operation);

    try {
      const response = await fetch('/api/bulk/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingIds: selectedListings,
          updates,
        }),
      });

      if (!response.ok) throw new Error('Failed to update listings');

      const result = await response.json();

      operation.status = 'completed';
      operation.progress = operation.total;
      operation.message = `Successfully updated ${result.updated} listings`;

      toast({
        title: 'Bulk edit completed',
        description: operation.message,
      });

      router.refresh();
    } catch (error: any) {
      operation.status = 'failed';
      operation.message = 'Failed to update listings';
      operation.errors = [error.message];

      toast({
        title: 'Bulk edit failed',
        description: error.message,
      });
    } finally {
      setActiveOperation(null);
      setOperationHistory(prev => [...prev, operation]);
    }
  }, [selectedListings, router, toast]);

  const handleImport = useCallback(async (file: File, mapping: any) => {
    const operation: BulkOperation = {
      id: `op-${Date.now()}`,
      type: 'import',
      status: 'processing',
      progress: 0,
      total: 0,
      message: 'Processing import file...',
    };

    setActiveOperation(operation);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mapping));
      formData.append('shopId', shopId);

      const response = await fetch('/api/bulk/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to import listings');

      const result = await response.json();

      operation.status = 'completed';
      operation.total = result.total;
      operation.progress = result.imported;
      operation.message = `Imported ${result.imported} of ${result.total} listings`;
      if (result.errors?.length > 0) {
        operation.errors = result.errors;
      }

      toast({
        title: 'Import completed',
        description: operation.message,
      });

      router.refresh();
    } catch (error: any) {
      operation.status = 'failed';
      operation.message = 'Import failed';
      operation.errors = [error.message];

      toast({
        title: 'Import failed',
        description: error.message,
      });
    } finally {
      setActiveOperation(null);
      setOperationHistory(prev => [...prev, operation]);
    }
  }, [shopId, router, toast]);

  const handleExport = useCallback(async (options: any) => {
    const listingsToExport = options.selectedOnly && selectedListings.length > 0 
      ? selectedListings 
      : listings.map(l => l.id);

    if (listingsToExport.length === 0) {
      toast({
        title: 'No listings to export',
        description: 'Please select listings or enable "Export all"',
      });
      return;
    }

    const operation: BulkOperation = {
      id: `op-${Date.now()}`,
      type: 'export',
      status: 'processing',
      progress: 0,
      total: listingsToExport.length,
      message: 'Preparing export...',
    };

    setActiveOperation(operation);

    try {
      const response = await fetch('/api/bulk/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingIds: listingsToExport,
          format: options.format,
          fields: options.fields,
        }),
      });

      if (!response.ok) throw new Error('Failed to export listings');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `listings-export-${new Date().toISOString().split('T')[0]}.${options.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      operation.status = 'completed';
      operation.progress = operation.total;
      operation.message = `Exported ${listingsToExport.length} listings`;

      toast({
        title: 'Export completed',
        description: operation.message,
      });
    } catch (error: any) {
      operation.status = 'failed';
      operation.message = 'Export failed';
      operation.errors = [error.message];

      toast({
        title: 'Export failed',
        description: error.message,
      });
    } finally {
      setActiveOperation(null);
      setOperationHistory(prev => [...prev, operation]);
    }
  }, [selectedListings, listings, toast]);

  const handleBulkAction = useCallback(async (action: string, params?: any) => {
    if (selectedListings.length === 0) {
      toast({
        title: 'No listings selected',
        description: 'Please select at least one listing',
      });
      return;
    }

    const operation: BulkOperation = {
      id: `op-${Date.now()}`,
      type: 'action',
      status: 'processing',
      progress: 0,
      total: selectedListings.length,
      message: `Performing ${action}...`,
    };

    setActiveOperation(operation);

    try {
      const response = await fetch(`/api/bulk/action/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingIds: selectedListings,
          ...params,
        }),
      });

      if (!response.ok) throw new Error(`Failed to perform ${action}`);

      const result = await response.json();

      operation.status = 'completed';
      operation.progress = result.processed;
      operation.total = result.total;
      operation.message = result.message;

      toast({
        title: 'Action completed',
        description: operation.message,
      });

      router.refresh();
    } catch (error: any) {
      operation.status = 'failed';
      operation.message = `Failed to perform ${action}`;
      operation.errors = [error.message];

      toast({
        title: 'Action failed',
        description: error.message,
      });
    } finally {
      setActiveOperation(null);
      setOperationHistory(prev => [...prev, operation]);
    }
  }, [selectedListings, router, toast]);

  const stats = useMemo(() => ({
    total: listings.length,
    selected: selectedListings.length,
    active: listings.filter(l => l.state === 'ACTIVE').length,
    draft: listings.filter(l => l.state === 'DRAFT').length,
    sold: listings.filter(l => l.state === 'SOLD_OUT').length,
  }), [listings, selectedListings]);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Selected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.selected}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sold Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.sold}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Operation */}
      {activeOperation && (
        <Card className="border-primary">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <CardTitle className="text-lg">
                  {activeOperation.type === 'edit' && 'Bulk Edit in Progress'}
                  {activeOperation.type === 'import' && 'Import in Progress'}
                  {activeOperation.type === 'export' && 'Export in Progress'}
                  {activeOperation.type === 'action' && 'Bulk Action in Progress'}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-2">{activeOperation.message}</p>
            <Progress 
              value={(activeOperation.progress / activeOperation.total) * 100} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {activeOperation.progress} of {activeOperation.total} processed
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Operations */}
      <Tabs defaultValue="select" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="select" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Select
          </TabsTrigger>
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Actions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="select" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Listings</CardTitle>
              <CardDescription>
                Choose listings to perform bulk operations on
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ListingSelector
                listings={listings}
                selectedIds={selectedListings}
                onSelectionChange={handleListingSelect}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Edit</CardTitle>
              <CardDescription>
                Update multiple listings at once. Only filled fields will be updated.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BulkEditForm
                selectedCount={selectedListings.length}
                onSubmit={handleBulkEdit}
                disabled={activeOperation !== null}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Import</CardTitle>
              <CardDescription>
                Import listings from CSV or Excel files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BulkImport
                onImport={handleImport}
                disabled={activeOperation !== null}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Export</CardTitle>
              <CardDescription>
                Export listings to CSV or Excel format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BulkExport
                selectedCount={selectedListings.length}
                totalCount={listings.length}
                onExport={handleExport}
                disabled={activeOperation !== null}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Actions</CardTitle>
              <CardDescription>
                Perform quick actions on selected listings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BulkActions
                selectedCount={selectedListings.length}
                onAction={handleBulkAction}
                disabled={activeOperation !== null}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Operation History */}
      {operationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {operationHistory.slice(-5).reverse().map((op) => (
                <div
                  key={op.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {op.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium capitalize">{op.type} Operation</p>
                      <p className="text-sm text-muted-foreground">{op.message}</p>
                    </div>
                  </div>
                  {op.errors && op.errors.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        toast({
                          title: 'Operation Errors',
                          description: op.errors?.join('\n') || 'Unknown error',
                        });
                      }}
                    >
                      View Errors
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}