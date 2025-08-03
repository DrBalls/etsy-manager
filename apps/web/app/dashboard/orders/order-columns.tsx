'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Order, OrderStatus } from '@/types/db';
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
import { MoreHorizontal, Package, Eye, Printer, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<OrderStatus, string> = {
  [OrderStatus.PAID]: 'bg-blue-100 text-blue-800',
  [OrderStatus.SHIPPED]: 'bg-purple-100 text-purple-800',
  [OrderStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
};

export const OrderColumns: ColumnDef<Order>[] = [
  {
    accessorKey: 'orderNumber',
    header: 'Order #',
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          #{row.getValue('orderNumber')}
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as Date;
      return format(new Date(date), 'MMM d, yyyy');
    },
  },
  {
    accessorKey: 'buyerEmail',
    header: 'Customer',
    cell: ({ row }) => {
      const order = row.original;
      return (
        <div>
          <div className="font-medium">{order.buyerName || 'Guest'}</div>
          <div className="text-sm text-muted-foreground">
            {order.buyerEmail}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as OrderStatus;
      return (
        <Badge className={statusColors[status]} variant="secondary">
          {status.toLowerCase()}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'orderItems',
    header: 'Items',
    cell: ({ row }) => {
      const items = row.getValue('orderItems') as any[];
      const itemCount = items?.length || 0;
      const totalQuantity = items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      return `${itemCount} item${itemCount !== 1 ? 's' : ''} (${totalQuantity} qty)`;
    },
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ row }) => {
      const total = parseFloat(row.getValue('total'));
      const currency = row.original.currencyCode;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(total);
    },
  },
  {
    id: 'actions',
    cell: () => {
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
              <Eye className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Package className="mr-2 h-4 w-4" />
              Mark as shipped
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Printer className="mr-2 h-4 w-4" />
              Print label
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <MessageSquare className="mr-2 h-4 w-4" />
              Message customer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];