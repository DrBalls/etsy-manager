'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';

interface ShippingLabelProps {
  order: {
    id: string;
    orderNumber: string;
    shippingAddress: {
      name: string;
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postalCode: string;
      country: string;
    };
    shippingMethod?: string;
    trackingNumber?: string;
    trackingCarrier?: string;
  };
  shopInfo: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postalCode: string;
      country: string;
    };
  };
}

export function ShippingLabel({ order, shopInfo }: ShippingLabelProps) {
  const labelRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (labelRef.current) {
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Shipping Label</title>');
        printWindow.document.write('<style>');
        printWindow.document.write('@page { size: 4in 6in; margin: 0; }');
        printWindow.document.write('body { margin: 0; padding: 10px; font-family: Arial, sans-serif; }');
        printWindow.document.write('.label { width: 4in; height: 6in; box-sizing: border-box; }');
        printWindow.document.write('</style></head><body>');
        printWindow.document.write(labelRef.current.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Shipping Label</h3>
        <Button onClick={handlePrint} size="sm">
          <Printer className="mr-2 h-4 w-4" />
          Print Label
        </Button>
      </div>

      <div ref={labelRef}>
        <Card className="label border-2 border-black p-4 space-y-4">
          <div className="border-b pb-2">
            <p className="text-xs font-bold">FROM:</p>
            <p className="text-sm font-semibold">{shopInfo.name}</p>
            <p className="text-xs">{shopInfo.address.line1}</p>
            {shopInfo.address.line2 && <p className="text-xs">{shopInfo.address.line2}</p>}
            <p className="text-xs">
              {shopInfo.address.city}, {shopInfo.address.state || ''} {shopInfo.address.postalCode}
            </p>
            <p className="text-xs">{shopInfo.address.country}</p>
          </div>

          <div className="flex-1">
            <p className="text-xs font-bold mb-2">TO:</p>
            <p className="text-lg font-bold">{order.shippingAddress.name}</p>
            <p className="text-sm">{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && <p className="text-sm">{order.shippingAddress.line2}</p>}
            <p className="text-sm">
              {order.shippingAddress.city}, {order.shippingAddress.state || ''} {order.shippingAddress.postalCode}
            </p>
            <p className="text-sm font-semibold">{order.shippingAddress.country}</p>
          </div>

          <div className="border-t pt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span>Order #:</span>
              <span className="font-bold">{order.orderNumber}</span>
            </div>
            {order.trackingNumber && (
              <div className="flex justify-between text-xs">
                <span>Tracking:</span>
                <span className="font-bold">{order.trackingNumber}</span>
              </div>
            )}
            {order.trackingCarrier && (
              <div className="flex justify-between text-xs">
                <span>Carrier:</span>
                <span className="font-bold uppercase">{order.trackingCarrier}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span>Date:</span>
              <span>{format(new Date(), 'MM/dd/yyyy')}</span>
            </div>
          </div>

          {/* Barcode placeholder */}
          <div className="border-t pt-2">
            <div className="h-12 bg-black opacity-80" style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, white 2px, white 4px)',
            }} />
            <p className="text-center text-xs mt-1 font-mono">
              {order.trackingNumber || order.orderNumber}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}