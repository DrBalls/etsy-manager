'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { ShoppingCart, Package, Truck, CheckCircle, Clock, Search, Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { OrderDetailsDialog } from '@/components/orders/order-details-dialog';
import { BulkOrderActions } from '@/components/orders/bulk-order-actions';
import { toast } from 'sonner';

interface Order {
  id: string;
  etsyOrderId: string;
  orderNumber: string;
  status: string;
  buyerName: string;
  buyerEmail: string | null;
  totalAmount: number;
  currencyCode: string;
  shippingMethod?: string | null;
  trackingNumber?: string | null;
  orderDate: Date;
  shipByDate?: Date | null;
  items: Array<{
    id: string;
    listingId: string;
    listing?: {
      title: string;
      images?: { url: string }[];
    };
    quantity: number;
    price: number;
  }>;
  shippingAddress?: {
    name: string;
    line1: string;
    line2?: string | null;
    city: string;
    state?: string | null;
    postalCode: string;
    country: string;
  } | null;
}

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  completedOrders: number;
  totalRevenue: number;
}

interface OrdersClientProps {
  initialOrders: Order[];
  orderStats: OrderStats;
  shopId: string;
}

export function OrdersClient({ initialOrders, orderStats, shopId: _shopId }: OrdersClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [filteredOrders, setFilteredOrders] = useState(initialOrders);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    filterOrders(term, statusFilter, dateFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    filterOrders(searchTerm, status, dateFilter);
  };

  const handleDateFilter = (range: string) => {
    setDateFilter(range);
    filterOrders(searchTerm, statusFilter, range);
  };

  const filterOrders = (search: string, status: string, date: string) => {
    let filtered = [...orders];

    // Search filter
    if (search) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        order.buyerName.toLowerCase().includes(search.toLowerCase()) ||
        (order.buyerEmail && order.buyerEmail.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Status filter
    if (status !== 'all') {
      filtered = filtered.filter(order => order.status === status);
    }

    // Date filter
    if (date !== 'all') {
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      
      switch (date) {
        case 'today':
          filtered = filtered.filter(order => 
            new Date(order.orderDate) >= startOfDay
          );
          break;
        case 'week':
          const weekAgo = new Date(now.setDate(now.getDate() - 7));
          filtered = filtered.filter(order => 
            new Date(order.orderDate) >= weekAgo
          );
          break;
        case 'month':
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
          filtered = filtered.filter(order => 
            new Date(order.orderDate) >= monthAgo
          );
          break;
      }
    }

    setFilteredOrders(filtered);
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsDialog(true);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedOrders.length === 0) return;

    switch (action) {
      case 'print-labels':
        // Implement print labels
        toast.success(`Printing labels for ${selectedOrders.length} orders`);
        break;
      case 'mark-shipped':
        // Implement mark as shipped
        toast.success(`Marked ${selectedOrders.length} orders as shipped`);
        break;
      case 'export':
        // Implement export
        toast.success('Exporting selected orders');
        break;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <ShoppingCart className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Orders
          </Button>
          <Button>
            <Printer className="mr-2 h-4 w-4" />
            Print Packing Slips
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.pendingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.processingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipped</CardTitle>
            <Truck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.shippedOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <span className="text-sm text-muted-foreground">This month</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${orderStats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={handleDateFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <BulkOrderActions
          selectedOrders={selectedOrders}
          onAction={handleBulkAction}
        />
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrders(filteredOrders.map(o => o.id));
                      } else {
                        setSelectedOrders([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Ship By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow 
                  key={order.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleOrderClick(order)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrders([...selectedOrders, order.id]);
                        } else {
                          setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">#{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.orderDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.buyerName}</p>
                      <p className="text-xs text-muted-foreground">{order.buyerEmail || 'No email'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</span>
                      {order.items[0]?.listing?.images?.[0] && (
                        <img
                          src={order.items[0].listing.images[0].url}
                          alt=""
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${order.totalAmount.toFixed(2)} {order.currencyCode}
                  </TableCell>
                  <TableCell>
                    {order.shipByDate ? (
                      <div>
                        <p className="text-sm">{format(new Date(order.shipByDate), 'MMM d')}</p>
                        {new Date(order.shipByDate) < new Date() && (
                          <p className="text-xs text-red-600">Overdue</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        Print Label
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <OrderDetailsDialog
          order={selectedOrder}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          onStatusUpdate={(newStatus) => {
            setOrders(orders.map(o => 
              o.id === selectedOrder.id ? { ...o, status: newStatus } : o
            ));
            setFilteredOrders(filteredOrders.map(o => 
              o.id === selectedOrder.id ? { ...o, status: newStatus } : o
            ));
          }}
        />
      )}
    </div>
  );
}