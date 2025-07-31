import { requireAuth } from '@/lib/auth/utils';
import { ShopRepository, ListingRepository, InventoryRepository } from '@/lib/repositories';
import { InventoryClient } from './inventory-client';

export default async function InventoryPage() {
  const user = await requireAuth();
  
  // Get user's shops
  const shops = await ShopRepository.findByUserId(user.id);
  const primaryShop = shops[0];

  if (!primaryShop) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Inventory</h1>
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-4">
            Connect your Etsy shop to manage inventory
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

  // Get inventory data
  const [inventoryItems, lowStockItems] = await Promise.all([
    InventoryRepository.findByShopId(primaryShop.id),
    InventoryRepository.findLowStock(primaryShop.id),
  ]);

  return (
    <InventoryClient 
      initialInventory={inventoryItems} 
      lowStockItems={lowStockItems}
      shopId={primaryShop.id} 
    />
  );
}