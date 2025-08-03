import { requireAuth } from '@/lib/auth/utils';
import { ShopRepository, ListingRepository } from '@/lib/repositories';
import { ListingsClient } from './listings-client';

export default async function ListingsPage() {
  const session = await requireAuth();
  
  // Get user's shops
  const shops = await ShopRepository.findByUserId(session.user.id);
  const primaryShop = shops[0];

  if (!primaryShop) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Listings</h1>
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-4">
            Connect your Etsy shop to view listings
          </p>
          <a
            href="/dashboard/shops/connect"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Connect Shop
          </a>
        </div>
      </div>
    );
  }

  // Get listings
  const listings = await ListingRepository.findByShopId(primaryShop.id);

  return <ListingsClient initialListings={listings} shopId={primaryShop.id} />;
}