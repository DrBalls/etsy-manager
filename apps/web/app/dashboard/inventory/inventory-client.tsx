'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Package, AlertTriangle, TrendingDown, Edit, Plus, Minus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { MovementHistory } from '@/components/inventory/movement-history';
import { StockForecast } from '@/components/inventory/stock-forecast';

interface InventoryItem {
  id: string;
  listingId: string;
  listing?: {
    id: string;
    title: string;
    etsyListingId?: string;
    images?: { url: string }[];
  };
  sku?: string | null;
  quantity: number;
  price: any; // Prisma Decimal type
  lowStockAlert?: number | null;
  updatedAt?: Date;
  isTracking?: boolean;
  productId?: string;
  propertyValues?: any;
  createdAt?: Date;
}

interface InventoryClientProps {
  initialInventory: InventoryItem[];
  lowStockItems: InventoryItem[];
  shopId: string;
}

export function InventoryClient({ initialInventory, lowStockItems, shopId }: InventoryClientProps) {
  const [inventory, setInventory] = useState(initialInventory);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  const handleQuickAdjust = async (item: InventoryItem, amount: number) => {
    try {
      const response = await fetch(`/api/inventory/${item.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adjustment: amount,
          reason: 'Quick adjustment',
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setInventory(inventory.map(i => i.id === item.id ? updated : i));
        toast.success('Inventory updated');
      }
    } catch (error) {
      toast.error('Failed to update inventory');
    }
  };

  const handleDetailedAdjustment = async () => {
    if (!selectedItem || !adjustmentAmount) return;

    const amount = parseInt(adjustmentAmount);
    const finalAmount = adjustmentType === 'subtract' ? -amount : amount;

    try {
      const response = await fetch(`/api/inventory/${selectedItem.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adjustment: finalAmount,
          reason: adjustmentReason || 'Manual adjustment',
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setInventory(inventory.map(i => i.id === selectedItem.id ? updated : i));
        toast.success('Inventory updated');
        setShowAdjustDialog(false);
        setAdjustmentAmount('');
        setAdjustmentReason('');
      }
    } catch (error) {
      toast.error('Failed to update inventory');
    }
  };

  const handleUpdateLowStockAlert = async (item: InventoryItem, threshold: number) => {
    try {
      const response = await fetch(`/api/inventory/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lowStockAlert: threshold }),
      });

      if (response.ok) {
        const updated = await response.json();
        setInventory(inventory.map(i => i.id === item.id ? updated : i));
        toast.success('Low stock alert updated');
      }
    } catch (error) {
      toast.error('Failed to update low stock alert');
    }
  };

  const totalValue = inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const outOfStock = inventory.filter(item => item.quantity === 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <Button>
          <Package className="mr-2 h-4 w-4" />
          Import from CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Items below threshold</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStock}</div>
            <p className="text-xs text-muted-foreground">Unavailable items</p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="low-stock">
            Low Stock ({lowStockItems.length})
          </TabsTrigger>
          <TabsTrigger value="out-of-stock">
            Out of Stock ({outOfStock})
          </TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>Manage stock levels across all listings</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Low Stock Alert</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {item.listing?.images?.[0] && (
                            <img
                              src={item.listing.images[0].url}
                              alt={item.listing.title}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium line-clamp-1">
                              {item.listing?.title || 'Unknown Product'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.sku || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.quantity}</span>
                          {item.quantity <= 5 && item.quantity > 0 && (
                            <Badge variant="outline" className="text-yellow-600">
                              Low
                            </Badge>
                          )}
                          {item.quantity === 0 && (
                            <Badge variant="outline" className="text-red-600">
                              Out
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>${(item.price * item.quantity).toFixed(2)}</TableCell>
                      <TableCell>
                        {editingItem === item.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              defaultValue={item.lowStockAlert || 5}
                              className="w-20"
                              onBlur={(e) => {
                                handleUpdateLowStockAlert(item, parseInt(e.target.value));
                                setEditingItem(null);
                              }}
                            />
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingItem(item.id)}
                          >
                            {item.lowStockAlert || 5}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleQuickAdjust(item, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleQuickAdjust(item, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedItem(item);
                              setShowAdjustDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Items</CardTitle>
              <CardDescription>Items that need restocking soon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {item.listing?.images?.[0] && (
                        <img
                          src={item.listing.images[0].url}
                          alt={item.listing.title}
                          className="w-16 h-16 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">{item.listing?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          SKU: {item.sku || 'N/A'} • {item.quantity} remaining
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedItem(item);
                        setShowAdjustDialog(true);
                      }}
                    >
                      Restock
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="out-of-stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Out of Stock Items</CardTitle>
              <CardDescription>Items currently unavailable</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventory.filter(item => item.quantity === 0).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                    <div className="flex items-center gap-4">
                      {item.listing?.images?.[0] && (
                        <img
                          src={item.listing.images[0].url}
                          alt={item.listing.title}
                          className="w-16 h-16 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">{item.listing?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          SKU: {item.sku || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setSelectedItem(item);
                        setShowAdjustDialog(true);
                      }}
                    >
                      Restock Now
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <StockForecast shopId={shopId} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <MovementHistory shopId={shopId} />
        </TabsContent>
      </Tabs>

      {/* Adjustment Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Inventory</DialogTitle>
            <DialogDescription>
              Update stock for {selectedItem?.listing?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span>Current Stock:</span>
              <span className="font-bold">{selectedItem?.quantity || 0}</span>
            </div>
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <div className="flex gap-2">
                <Button
                  variant={adjustmentType === 'add' ? 'default' : 'outline'}
                  onClick={() => setAdjustmentType('add')}
                  className="flex-1"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Stock
                </Button>
                <Button
                  variant={adjustmentType === 'subtract' ? 'default' : 'outline'}
                  onClick={() => setAdjustmentType('subtract')}
                  className="flex-1"
                >
                  <Minus className="mr-2 h-4 w-4" />
                  Remove Stock
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Input
                id="reason"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="e.g., Restock, Damage, Sale"
              />
            </div>
            {adjustmentAmount && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm">New Stock Level:</p>
                <p className="text-xl font-bold">
                  {adjustmentType === 'add'
                    ? (selectedItem?.quantity || 0) + parseInt(adjustmentAmount || '0')
                    : (selectedItem?.quantity || 0) - parseInt(adjustmentAmount || '0')}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDetailedAdjustment}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}