'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package, Truck, MessageSquare, Clock, CheckCircle, Printer, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface OrderDetailsDialogProps {
  order: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate: (status: string) => void;
}

export function OrderDetailsDialog({ order, open, onOpenChange, onStatusUpdate }: OrderDetailsDialogProps) {
  const [status, setStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [trackingCarrier, setTrackingCarrier] = useState(order.trackingCarrier || 'usps');
  const [internalNotes, setInternalNotes] = useState(order.internalNotes || '');
  const [customerMessage, setCustomerMessage] = useState('');

  const handleStatusUpdate = async () => {
    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        onStatusUpdate(status);
        toast.success('Order status updated');
      }
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleTrackingUpdate = async () => {
    try {
      const response = await fetch(`/api/orders/${order.id}/tracking`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingNumber,
          trackingCarrier,
          status: 'shipped',
        }),
      });

      if (response.ok) {
        onStatusUpdate('shipped');
        toast.success('Tracking information added');
      }
    } catch (error) {
      toast.error('Failed to update tracking information');
    }
  };

  const handleSendMessage = async () => {
    if (!customerMessage.trim()) return;

    try {
      const response = await fetch(`/api/orders/${order.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: customerMessage }),
      });

      if (response.ok) {
        setCustomerMessage('');
        toast.success('Message sent to customer');
      }
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const copyAddress = () => {
    const address = `${order.shippingAddress.name}
${order.shippingAddress.line1}
${order.shippingAddress.line2 ? order.shippingAddress.line2 + '\n' : ''}${order.shippingAddress.city}, ${order.shippingAddress.state || ''} ${order.shippingAddress.postalCode}
${order.shippingAddress.country}`;
    
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
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
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order #{order.orderNumber}</span>
            <Badge className="ml-2">
              <span className="flex items-center gap-1">
                {getStatusIcon(order.status)}
                {order.status}
              </span>
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Placed on {format(new Date(order.orderDate), 'PPP')}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-medium">{order.buyerName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{order.buyerEmail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
                <CardDescription>Update the order processing status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleStatusUpdate} disabled={status === order.status}>
                    Update Status
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
                <CardDescription>Notes visible only to your team</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Add internal notes about this order..."
                  rows={3}
                />
                <Button className="mt-2" size="sm">Save Notes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
                <CardDescription>{order.items.length} {order.items.length === 1 ? 'item' : 'items'} in this order</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      {item.listing?.images?.[0] && (
                        <img
                          src={item.listing.images[0].url}
                          alt={item.listing.title}
                          className="w-20 h-20 rounded object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.listing?.title || 'Unknown Product'}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                        {item.variations && (
                          <p className="text-sm text-muted-foreground">
                            Variations: {JSON.stringify(item.variations)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${(item.quantity * item.price).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between items-center pt-2">
                    <p className="font-medium">Total</p>
                    <p className="text-xl font-bold">
                      ${order.totalAmount.toFixed(2)} {order.currencyCode}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
                <CardDescription>Where to ship this order</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{order.shippingAddress.name}</p>
                      <p>{order.shippingAddress.line1}</p>
                      {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                      <p>
                        {order.shippingAddress.city}, {order.shippingAddress.state || ''} {order.shippingAddress.postalCode}
                      </p>
                      <p>{order.shippingAddress.country}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={copyAddress}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tracking Information</CardTitle>
                <CardDescription>Add tracking details when you ship</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tracking">Tracking Number</Label>
                    <Input
                      id="tracking"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carrier">Carrier</Label>
                    <Select value={trackingCarrier} onValueChange={setTrackingCarrier}>
                      <SelectTrigger id="carrier">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usps">USPS</SelectItem>
                        <SelectItem value="ups">UPS</SelectItem>
                        <SelectItem value="fedex">FedEx</SelectItem>
                        <SelectItem value="dhl">DHL</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleTrackingUpdate} disabled={!trackingNumber}>
                  <Truck className="mr-2 h-4 w-4" />
                  Mark as Shipped
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Communication</CardTitle>
                <CardDescription>Send messages to the customer about their order</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={customerMessage}
                    onChange={(e) => setCustomerMessage(e.target.value)}
                    placeholder="Type your message to the customer..."
                    rows={4}
                  />
                </div>
                <Button onClick={handleSendMessage} disabled={!customerMessage.trim()}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Message History</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No messages yet</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print Packing Slip
          </Button>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print Shipping Label
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}