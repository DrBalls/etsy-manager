import {
  type ListingInventory,
  type ListingOffering,
  type ListingProduct,
  type UpdateInventoryRequest,
  type UpdateVariationImagesRequest,
} from '../../types';
import { type EtsyApiClientV2 } from '../etsy-api-client-v2';

/**
 * Inventory Management SDK methods
 */
export class InventoryAPI {
  constructor(private client: EtsyApiClientV2) {}

  /**
   * Get listing inventory
   * @see https://developers.etsy.com/documentation/reference/#operation/getListingInventory
   */
  async getListingInventory(
    listingId: string | number,
    options?: {
      includes?: ('listing' | 'attributes')[];
      show_deleted?: boolean;
    },
  ): Promise<ListingInventory> {
    const params: any = {};

    if (options?.includes?.length) {
      params.includes = options.includes.join(',');
    }
    if (options?.show_deleted !== undefined) {
      params.show_deleted = options.show_deleted ? 1 : 0;
    }

    return this.client.get<ListingInventory>(
      `/v3/application/listings/${listingId}/inventory`,
      params,
    );
  }

  /**
   * Update listing inventory
   * @see https://developers.etsy.com/documentation/reference/#operation/updateListingInventory
   */
  async updateListingInventory(
    listingId: string | number,
    data: UpdateInventoryRequest,
  ): Promise<ListingInventory> {
    return this.client.put<ListingInventory>(
      `/v3/application/listings/${listingId}/inventory`,
      data,
    );
  }

  /**
   * Get listing products
   */
  async getListingProducts(listingId: string | number): Promise<ListingProduct[]> {
    const inventory = await this.getListingInventory(listingId);
    return inventory.products;
  }

  /**
   * Update inventory quantities for specific products
   */
  async updateInventoryQuantities(
    listingId: string | number,
    updates: Array<{
      product_id: number;
      offerings: Array<{
        offering_id: number;
        quantity: number;
      }>;
    }>,
  ): Promise<ListingInventory> {
    // Get current inventory
    const currentInventory = await this.getListingInventory(listingId);

    // Build update request maintaining existing structure
    const products = currentInventory.products.map((product) => {
      const update = updates.find((u) => u.product_id === product.product_id);

      if (update) {
        return {
          ...product,
          offerings: product.offerings.map((offering) => {
            const offeringUpdate = update.offerings.find(
              (o) => o.offering_id === offering.offering_id,
            );

            if (offeringUpdate) {
              return {
                ...offering,
                quantity: offeringUpdate.quantity,
              };
            }

            return offering;
          }),
        };
      }

      return product;
    });

    return this.updateListingInventory(listingId, {
      products,
      price_on_property: currentInventory.price_on_property,
      quantity_on_property: currentInventory.quantity_on_property,
      sku_on_property: currentInventory.sku_on_property,
    });
  }

  /**
   * Update inventory prices for specific products
   */
  async updateInventoryPrices(
    listingId: string | number,
    updates: Array<{
      product_id: number;
      offerings: Array<{
        offering_id: number;
        price: number;
      }>;
    }>,
  ): Promise<ListingInventory> {
    const currentInventory = await this.getListingInventory(listingId);

    const products = currentInventory.products.map((product) => {
      const update = updates.find((u) => u.product_id === product.product_id);

      if (update) {
        return {
          ...product,
          offerings: product.offerings.map((offering) => {
            const offeringUpdate = update.offerings.find(
              (o) => o.offering_id === offering.offering_id,
            );

            if (offeringUpdate) {
              return {
                ...offering,
                price: {
                  ...offering.price,
                  amount: Math.round(offeringUpdate.price * 100), // Convert to cents
                },
              };
            }

            return offering;
          }),
        };
      }

      return product;
    });

    return this.updateListingInventory(listingId, {
      products,
      price_on_property: currentInventory.price_on_property,
      quantity_on_property: currentInventory.quantity_on_property,
      sku_on_property: currentInventory.sku_on_property,
    });
  }

  /**
   * Update SKUs for specific products
   */
  async updateInventorySkus(
    listingId: string | number,
    updates: Array<{
      product_id: number;
      sku: string;
    }>,
  ): Promise<ListingInventory> {
    const currentInventory = await this.getListingInventory(listingId);

    const products = currentInventory.products.map((product) => {
      const update = updates.find((u) => u.product_id === product.product_id);

      if (update) {
        return {
          ...product,
          sku: update.sku,
        };
      }

      return product;
    });

    return this.updateListingInventory(listingId, {
      products,
      price_on_property: currentInventory.price_on_property,
      quantity_on_property: currentInventory.quantity_on_property,
      sku_on_property: currentInventory.sku_on_property,
    });
  }

  /**
   * Get low stock products for a listing
   */
  async getLowStockProducts(
    listingId: string | number,
    threshold = 10,
  ): Promise<
    Array<{
      product: ListingProduct;
      offerings: ListingOffering[];
    }>
  > {
    const inventory = await this.getListingInventory(listingId);
    const lowStockProducts: Array<{
      product: ListingProduct;
      offerings: ListingOffering[];
    }> = [];

    for (const product of inventory.products) {
      const lowStockOfferings = product.offerings.filter(
        (offering) => offering.quantity <= threshold,
      );

      if (lowStockOfferings.length > 0) {
        lowStockProducts.push({
          product,
          offerings: lowStockOfferings,
        });
      }
    }

    return lowStockProducts;
  }

  /**
   * Check if any products are out of stock
   */
  async hasOutOfStockProducts(listingId: string | number): Promise<boolean> {
    const inventory = await this.getListingInventory(listingId);

    return inventory.products.some((product) =>
      product.offerings.some((offering) => offering.quantity === 0),
    );
  }

  /**
   * Get total inventory value for a listing
   */
  async getInventoryValue(listingId: string | number): Promise<{
    total_value: number;
    currency_code: string;
    by_product: Array<{
      product_id: number;
      sku: string;
      total_quantity: number;
      total_value: number;
    }>;
  }> {
    const inventory = await this.getListingInventory(listingId);
    let totalValue = 0;
    let currencyCode = '';
    const byProduct: Array<{
      product_id: number;
      sku: string;
      total_quantity: number;
      total_value: number;
    }> = [];

    for (const product of inventory.products) {
      let productQuantity = 0;
      let productValue = 0;

      for (const offering of product.offerings) {
        productQuantity += offering.quantity;
        productValue += offering.quantity * (offering.price.amount / 100);

        if (!currencyCode && offering.price.currency_code) {
          currencyCode = offering.price.currency_code;
        }
      }

      totalValue += productValue;

      byProduct.push({
        product_id: product.product_id,
        sku: product.sku,
        total_quantity: productQuantity,
        total_value: productValue,
      });
    }

    return {
      total_value: totalValue,
      currency_code: currencyCode,
      by_product: byProduct,
    };
  }

  /**
   * Bulk update inventory across multiple listings
   */
  async bulkUpdateInventory(
    updates: Array<{
      listing_id: string | number;
      inventory_updates: UpdateInventoryRequest;
    }>,
  ): Promise<Array<{ listing_id: string | number; result: ListingInventory | Error }>> {
    const results = await Promise.allSettled(
      updates.map((update) =>
        this.updateListingInventory(update.listing_id, update.inventory_updates),
      ),
    );

    return results.map((result, index) => ({
      listing_id: updates[index].listing_id,
      result: result.status === 'fulfilled' ? result.value : new Error(result.reason),
    }));
  }

  /**
   * Get inventory summary for a shop
   */
  async getShopInventorySummary(
    shopId: string | number,
    listingIds: (string | number)[],
  ): Promise<{
    total_products: number;
    total_quantity: number;
    total_value: number;
    currency_code: string;
    out_of_stock_count: number;
    low_stock_count: number;
  }> {
    let totalProducts = 0;
    let totalQuantity = 0;
    let totalValue = 0;
    let currencyCode = '';
    let outOfStockCount = 0;
    let lowStockCount = 0;

    const inventories = await Promise.all(listingIds.map((id) => this.getListingInventory(id)));

    for (const inventory of inventories) {
      for (const product of inventory.products) {
        totalProducts++;

        let productQuantity = 0;
        for (const offering of product.offerings) {
          productQuantity += offering.quantity;
          totalValue += offering.quantity * (offering.price.amount / 100);

          if (!currencyCode && offering.price.currency_code) {
            currencyCode = offering.price.currency_code;
          }
        }

        totalQuantity += productQuantity;

        if (productQuantity === 0) {
          outOfStockCount++;
        } else if (productQuantity <= 10) {
          lowStockCount++;
        }
      }
    }

    return {
      total_products: totalProducts,
      total_quantity: totalQuantity,
      total_value: totalValue,
      currency_code: currencyCode,
      out_of_stock_count: outOfStockCount,
      low_stock_count: lowStockCount,
    };
  }

  /**
   * Update variation images for a listing
   * @see https://developers.etsy.com/documentation/reference/#operation/updateVariationImages
   */
  async updateVariationImages(
    shopId: string | number,
    listingId: string | number,
    data: UpdateVariationImagesRequest,
  ): Promise<ListingInventory> {
    return this.client.post<ListingInventory>(
      `/v3/application/shops/${shopId}/listings/${listingId}/variation-images`,
      data,
    );
  }
}
