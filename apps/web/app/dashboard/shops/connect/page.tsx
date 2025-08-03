'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Store, ArrowRight } from 'lucide-react';

export default function ConnectShopPage() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectEtsy = async () => {
    setIsConnecting(true);
    
    try {
      // In a real implementation, this would initiate the OAuth flow
      // For now, we'll simulate it
      toast({
        title: 'Connecting to Etsy',
        description: 'Redirecting to Etsy authorization...',
      });
      
      // TODO: Implement actual OAuth flow
      setTimeout(() => {
        toast({
          title: 'Connection Required',
          description: 'OAuth implementation pending. Please check back later.',
          variant: 'destructive',
        });
        setIsConnecting(false);
      }, 2000);
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to Etsy. Please try again.',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Connect Your Shop</h1>
        <p className="text-muted-foreground mt-2">
          Connect your Etsy shop to start managing your business
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-orange-100 p-3">
              <Store className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <CardTitle>Connect Etsy Shop</CardTitle>
              <CardDescription>
                Authorize Etsy Manager to access your shop data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">What we'll access:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Shop information and settings</li>
              <li>Product listings and inventory</li>
              <li>Order and customer data</li>
              <li>Shop analytics and statistics</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">What we won't do:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Make changes without your permission</li>
              <li>Share your data with third parties</li>
              <li>Store your Etsy password</li>
            </ul>
          </div>

          <Button
            onClick={handleConnectEtsy}
            disabled={isConnecting}
            className="w-full"
            size="lg"
          >
            {isConnecting ? (
              'Connecting...'
            ) : (
              <>
                Connect with Etsy
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By connecting, you agree to our terms of service and privacy policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}