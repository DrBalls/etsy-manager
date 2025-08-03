import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ListingRepository } from '@/lib/repositories/listing.repository';
import { EtsyService } from '@/lib/services/etsy.service';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const bulkEditSchema = z.object({
  listingIds: z.array(z.string()).min(1),
  updates: z.object({
    price: z.object({
      action: z.enum(['set', 'increase', 'decrease']),
      value: z.number(),
      type: z.enum(['fixed', 'percentage']).optional(),
    }).optional(),
    quantity: z.object({
      action: z.enum(['set', 'increase', 'decrease']),
      value: z.number(),
    }).optional(),
    state: z.enum(['ACTIVE', 'DRAFT', 'INACTIVE']).optional(),
    tags: z.object({
      action: z.enum(['add', 'remove', 'replace']),
      value: z.array(z.string()),
    }).optional(),
    processingTime: z.object({
      min: z.number(),
      max: z.number(),
    }).optional(),
    shippingTemplateId: z.string().optional(),
    materials: z.array(z.string()).optional(),
    sectionId: z.string().optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { listingIds, updates } = bulkEditSchema.parse(body);

    // Get listings to verify ownership
    const listings = await ListingRepository.findByIds(listingIds, session.user.id);
    
    // Get user's Etsy access token
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { etsyAccessToken: true }
    });
    const etsyAccessToken = user?.etsyAccessToken;
    
    if (listings.length !== listingIds.length) {
      return NextResponse.json(
        { error: 'Some listings not found or unauthorized' },
        { status: 403 }
      );
    }

    const results = {
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each listing
    for (const listing of listings) {
      try {
        const updateData: any = {};
        
        // Process price updates
        if (updates.price) {
          const currentPrice = Number(listing.price) || 0;
          let newPrice = currentPrice;
          
          switch (updates.price.action) {
            case 'set':
              newPrice = updates.price.value;
              break;
            case 'increase':
              if (updates.price.type === 'percentage') {
                newPrice = currentPrice * (1 + updates.price.value / 100);
              } else {
                newPrice = currentPrice + updates.price.value;
              }
              break;
            case 'decrease':
              if (updates.price.type === 'percentage') {
                newPrice = currentPrice * (1 - updates.price.value / 100);
              } else {
                newPrice = currentPrice - updates.price.value;
              }
              break;
          }
          
          updateData.price = Math.max(0.01, newPrice); // Ensure minimum price
        }

        // Process quantity updates
        if (updates.quantity) {
          const currentQuantity = listing.quantity;
          let newQuantity = currentQuantity;
          
          switch (updates.quantity.action) {
            case 'set':
              newQuantity = updates.quantity.value;
              break;
            case 'increase':
              newQuantity = currentQuantity + updates.quantity.value;
              break;
            case 'decrease':
              newQuantity = currentQuantity - updates.quantity.value;
              break;
          }
          
          updateData.quantity = Math.max(0, newQuantity);
        }

        // Process state update
        if (updates.state) {
          updateData.state = updates.state;
        }

        // Process tags update
        if (updates.tags) {
          const currentTags = listing.tags || [];
          let newTags = [...currentTags];
          
          switch (updates.tags.action) {
            case 'add':
              newTags = [...new Set([...currentTags, ...updates.tags.value])];
              break;
            case 'remove':
              newTags = currentTags.filter(tag => !updates.tags?.value.includes(tag));
              break;
            case 'replace':
              newTags = updates.tags?.value || [];
              break;
          }
          
          updateData.tags = newTags.slice(0, 13); // Etsy allows max 13 tags
        }

        // Process other updates
        if (updates.processingTime) {
          updateData.processingTimeMin = updates.processingTime.min;
          updateData.processingTimeMax = updates.processingTime.max;
        }

        if (updates.shippingTemplateId) {
          updateData.shippingProfile = { connect: { id: updates.shippingTemplateId } };
        }

        if (updates.materials) {
          updateData.materials = updates.materials;
        }

        if (updates.sectionId) {
          updateData.shopSection = { connect: { id: updates.sectionId } };
        }

        // Update listing
        await ListingRepository.update(listing.id, updateData);
        
        // Sync with Etsy if shop has API credentials
        if (etsyAccessToken && listing.etsyListingId) {
          const etsyService = new EtsyService(etsyAccessToken);
          await etsyService.updateListing(listing.etsyListingId, updateData);
        }
        
        results.updated++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to update listing ${listing.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Bulk edit error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to perform bulk edit' },
      { status: 500 }
    );
  }
}