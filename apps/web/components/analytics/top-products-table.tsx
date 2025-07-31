'use client';

import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TopProductsTableProps {
  products: Array<{
    id: string;
    title: string;
    revenue: number;
    units: number;
    orders: number;
    imageUrl?: string;
  }>;
}

export function TopProductsTable({ products }: TopProductsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Units Sold</TableHead>
          <TableHead className="text-right">Orders</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product, index) => (
          <TableRow key={product.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  #{index + 1}
                </span>
                {product.imageUrl && (
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    width={40}
                    height={40}
                    className="rounded-md object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="line-clamp-1 text-sm font-medium">
                    {product.title}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-right">{product.units}</TableCell>
            <TableCell className="text-right">{product.orders}</TableCell>
            <TableCell className="text-right">
              ${product.revenue.toFixed(2)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}