'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Package, ShoppingCart, RefreshCw, AlertCircle } from 'lucide-react';

interface InventoryLog {
  id: string;
  inventoryItemId: string;
  listingId: string;
  listing?: {
    title: string;
  };
  changeType: string;
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  orderId?: string;
  createdAt: Date;
}

interface MovementHistoryProps {
  shopId: string;
  inventoryItemId?: string;
}

export function MovementHistory({ shopId, inventoryItemId }: MovementHistoryProps) {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [shopId, inventoryItemId]);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({ shopId });
      if (inventoryItemId) {
        params.append('inventoryItemId', inventoryItemId);
      }
      
      const response = await fetch(`/api/inventory/logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Error fetching inventory logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'adjustment_increase':
      case 'restock':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'adjustment_decrease':
      case 'damage':
      case 'loss':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'sale':
        return <ShoppingCart className="h-4 w-4 text-blue-600" />;
      case 'return':
        return <RefreshCw className="h-4 w-4 text-orange-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getChangeLabel = (changeType: string) => {
    const labels: Record<string, string> = {
      'adjustment_increase': 'Stock Added',
      'adjustment_decrease': 'Stock Removed',
      'sale': 'Sale',
      'return': 'Return',
      'restock': 'Restock',
      'damage': 'Damage',
      'loss': 'Loss',
    };
    return labels[changeType] || changeType;
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'adjustment_increase':
      case 'restock':
      case 'return':
        return 'text-green-600';
      case 'adjustment_decrease':
      case 'damage':
      case 'loss':
      case 'sale':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Movement History</CardTitle>
        <CardDescription>
          Track all inventory changes and adjustments
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>No inventory movements recorded yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Before</TableHead>
                <TableHead>After</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">
                    {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.listing?.title || 'Unknown Product'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getChangeIcon(log.changeType)}
                      <Badge variant="outline">
                        {getChangeLabel(log.changeType)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className={getChangeColor(log.changeType)}>
                    {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                  </TableCell>
                  <TableCell>{log.previousQuantity}</TableCell>
                  <TableCell className="font-medium">{log.newQuantity}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.reason || '-'}
                    {log.orderId && (
                      <span className="block text-xs">
                        Order: {log.orderId}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}