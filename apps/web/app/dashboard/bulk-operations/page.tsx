import { Metadata } from 'next';
import { BulkOperations } from '@/components/bulk-operations/bulk-operations';
import { ShopRepository } from '@/lib/repositories/shop.repository';
import { ListingRepository } from '@/lib/repositories/listing.repository';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Bulk Operations - Etsy Store Manager',
  description: 'Perform bulk operations on your Etsy listings',
};

export default async function BulkOperationsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const shops = await ShopRepository.findByUserId(session.user.id);
  const primaryShop = shops.find(shop => shop.isPrimary) || shops[0];

  if (!primaryShop) {
    redirect('/dashboard/shops');
  }

  // Get all listings for bulk operations
  const listings = await ListingRepository.findByShopId(primaryShop.id);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Bulk Operations</h1>
        <p className="text-muted-foreground mt-2">
          Perform bulk actions on multiple listings at once
        </p>
      </div>

      <BulkOperations 
        listings={listings}
        shopId={primaryShop.id}
      />
    </div>
  );
}