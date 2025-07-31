'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Printer, Truck, Download, Tag, MessageSquare } from 'lucide-react';

interface BulkOrderActionsProps {
  selectedOrders: string[];
  onAction: (action: string) => void;
}

export function BulkOrderActions({ selectedOrders, onAction }: BulkOrderActionsProps) {
  if (selectedOrders.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <p className="text-sm text-muted-foreground">
        {selectedOrders.length} {selectedOrders.length === 1 ? 'order' : 'orders'} selected
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Bulk Actions
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onAction('print-labels')}>
            <Printer className="mr-2 h-4 w-4" />
            Print Shipping Labels
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction('print-slips')}>
            <Printer className="mr-2 h-4 w-4" />
            Print Packing Slips
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onAction('mark-shipped')}>
            <Truck className="mr-2 h-4 w-4" />
            Mark as Shipped
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction('add-tracking')}>
            <Tag className="mr-2 h-4 w-4" />
            Add Tracking Numbers
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onAction('send-message')}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Send Message
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction('export')}>
            <Download className="mr-2 h-4 w-4" />
            Export Orders
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}