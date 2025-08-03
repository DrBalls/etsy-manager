import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { ListingRepository, ShopRepository } from '@/lib/repositories';
import { z } from 'zod';

const createListingSchema = z.object({
  shopId: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  quantity: z.number().int().min(0),
  tags: z.array(z.string()).max(13),
  materials: z.array(z.string()).optional().default([]),
  sku: z.string().optional(),
  whoMade: z.string().optional().default('i_did'),
  whenMade: z.string().optional().default('made_to_order'),
  isSupply: z.boolean().optional().default(false),
  processingMin: z.number().int().positive().optional().default(1),
  processingMax: z.number().int().positive().optional().default(3),
});

// GET /api/listings
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const shopId = searchParams.get('shopId');
    const state = searchParams.get('state');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let listings;
    
    if (shopId) {
      // Verify user owns the shop
      const shop = await ShopRepository.findById(shopId);
      if (!shop || shop.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Shop not found' },
          { status: 404 }
        );
      }
      
      listings = await ListingRepository.findByShop(shopId, {
        state: state as any,
        pageSize: limit,
        page: Math.floor(offset / limit) + 1,
      });
    } else {
      // Get all shops for the user
      const shops = await ShopRepository.findByUserId(session.user.id);
      
      // Get all listings from all shops
      const allListings = await Promise.all(
        shops.map(shop => ListingRepository.findByShopId(shop.id))
      );
      
      // Flatten and sort listings
      listings = allListings
        .flat()
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(offset, offset + limit);
    }

    return NextResponse.json(listings);
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

// POST /api/listings
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const validatedData = createListingSchema.parse(body);

    // Verify user owns the shop
    const shop = await ShopRepository.findById(validatedData.shopId);
    if (!shop || shop.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Generate a temporary Etsy listing ID for drafts
    const tempEtsyListingId = `draft_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const listing = await ListingRepository.create({
      ...validatedData,
      user: { connect: { id: session.user.id } },
      shop: { connect: { id: shop.id } },
      state: 'DRAFT',
      currencyCode: shop.currencyCode,
      views: 0,
      favoritersCount: 0,
      etsyListingId: tempEtsyListingId,
      url: '',  // Will be set when published to Etsy
      etsyCreatedAt: new Date(),
      etsyUpdatedAt: new Date(),
    });

    return NextResponse.json(listing);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}