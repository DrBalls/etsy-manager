import { requireAuth } from '@/lib/auth/utils';
import { ShopRepository } from '@/lib/repositories';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, ExternalLink, Settings } from 'lucide-react';

export default async function ShopsPage() {
  const session = await requireAuth();
  
  // Get user's shops
  const shops = await ShopRepository.findByUserId(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Shops</h1>
        <Link href="/dashboard/shops/connect">
          <Button>
            <Store className="mr-2 h-4 w-4" />
            Connect Shop
          </Button>
        </Link>
      </div>

      {shops.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Shops Connected</h2>
          <p className="text-muted-foreground mb-4">
            Connect your Etsy shop to start managing your business
          </p>
          <Link href="/dashboard/shops/connect">
            <Button>Connect Your First Shop</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <Card key={shop.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{shop.shopName}</CardTitle>
                    <CardDescription>{shop.title}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Active Listings</p>
                    <p className="font-medium">{shop.listingActiveCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Sales</p>
                    <p className="font-medium">{shop.saleCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Reviews</p>
                    <p className="font-medium">
                      {shop.reviewCount} ({shop.reviewAverage?.toFixed(1)}★)
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Currency</p>
                    <p className="font-medium">{shop.currencyCode}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={shop.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full" size="sm">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View on Etsy
                    </Button>
                  </a>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}