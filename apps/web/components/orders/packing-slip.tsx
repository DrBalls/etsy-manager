'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';

interface PackingSlipProps {
  order: {
    id: string;
    orderNumber: string;
    orderDate: Date;
    buyerName: string;
    buyerEmail: string;
    shippingAddress: {
      name: string;
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postalCode: string;
      country: string;
    };
    items: Array<{
      id: string;
      listing?: {
        title: string;
        sku?: string;
      };
      quantity: number;
      price: number;
      variations?: any;
    }>;
    totalAmount: number;
    currencyCode: string;
    personalMessage?: string;
  };
  shopInfo: {
    name: string;
    logo?: string;
    website?: string;
    email?: string;
    phone?: string;
  };
}

export function PackingSlip({ order, shopInfo }: PackingSlipProps) {
  const slipRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (slipRef.current) {
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Packing Slip</title>');
        printWindow.document.write('<style>');
        printWindow.document.write('@page { size: 8.5in 11in; margin: 0.5in; }');
        printWindow.document.write('body { margin: 0; font-family: Arial, sans-serif; }');
        printWindow.document.write('table { width: 100%; border-collapse: collapse; }');
        printWindow.document.write('th, td { padding: 8px; text-align: left; }');
        printWindow.document.write('.border-b { border-bottom: 1px solid #e5e5e5; }');
        printWindow.document.write('</style></head><body>');
        printWindow.document.write(slipRef.current.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Packing Slip</h3>
        <Button onClick={handlePrint} size="sm">
          <Printer className="mr-2 h-4 w-4" />
          Print Packing Slip
        </Button>
      </div>

      <div ref={slipRef}>
        <Card className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold mb-2">{shopInfo.name}</h1>
              {shopInfo.website && <p className="text-sm text-muted-foreground">{shopInfo.website}</p>}
              {shopInfo.email && <p className="text-sm text-muted-foreground">{shopInfo.email}</p>}
              {shopInfo.phone && <p className="text-sm text-muted-foreground">{shopInfo.phone}</p>}
            </div>
            <div className="text-right">
              <h2 className="text-xl font-semibold mb-2">Packing Slip</h2>
              <p className="text-sm">Order #{order.orderNumber}</p>
              <p className="text-sm">{format(new Date(order.orderDate), 'MMMM d, yyyy')}</p>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Ship To */}
          <div className="mb-8">
            <h3 className="font-semibold mb-2">Ship To:</h3>
            <p>{order.shippingAddress.name}</p>
            <p>{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state || ''} {order.shippingAddress.postalCode}
            </p>
            <p>{order.shippingAddress.country}</p>
          </div>

          {/* Items */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-2">Item</th>
                  <th className="text-center pb-2">Qty</th>
                  <th className="text-right pb-2">Price</th>
                  <th className="text-right pb-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-4">
                      <p className="font-medium">{item.listing?.title || 'Unknown Product'}</p>
                      {item.listing?.sku && (
                        <p className="text-sm text-muted-foreground">SKU: {item.listing.sku}</p>
                      )}
                      {item.variations && (
                        <p className="text-sm text-muted-foreground">
                          {Object.entries(item.variations).map(([key, value]) => 
                            `${key}: ${value}`
                          ).join(', ')}
                        </p>
                      )}
                    </td>
                    <td className="text-center py-4">{item.quantity}</td>
                    <td className="text-right py-4">
                      ${item.price.toFixed(2)} {order.currencyCode}
                    </td>
                    <td className="text-right py-4">
                      ${(item.price * item.quantity).toFixed(2)} {order.currencyCode}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="text-right pt-4 font-semibold">Total:</td>
                  <td className="text-right pt-4 font-bold">
                    ${order.totalAmount.toFixed(2)} {order.currencyCode}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Personal Message */}
          {order.personalMessage && (
            <div className="mb-8 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Gift Message:</h3>
              <p className="italic">{order.personalMessage}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground pt-8 border-t">
            <p>Thank you for your order!</p>
            <p>If you have any questions, please contact us at {shopInfo.email || 'support@shop.com'}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}