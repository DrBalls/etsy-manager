import { requireAuth } from '@/lib/auth/utils';
import { ShopRepository, OrderRepository } from '@/lib/repositories';
import { OrdersClient } from './orders-client';

export default async function OrdersPage() {
  const user = await requireAuth();
  
  // Get user's shops
  const shops = await ShopRepository.findByUserId(user.id);
  const primaryShop = shops[0];

  if (!primaryShop) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Orders</h1>
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-4">
            Connect your Etsy shop to manage orders
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

  // Get recent orders
  const [recentOrders, orderStats] = await Promise.all([
    OrderRepository.findByShopId(primaryShop.id, { limit: 50 }),
    OrderRepository.getOrderStats(primaryShop.id),
  ]);

  return (
    <OrdersClient 
      initialOrders={recentOrders} 
      orderStats={orderStats}
      shopId={primaryShop.id} 
    />
  );
}