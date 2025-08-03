import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ListingRepository } from '@/lib/repositories/listing.repository';
import { EtsyService } from '@/lib/services/etsy.service';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const actionSchema = z.object({
  listingIds: z.array(z.string()).min(1),
  params: z.any().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { action: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { listingIds, params: actionParams } = actionSchema.parse(body);
    const action = params.action;

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
      total: listings.length,
      processed: 0,
      failed: 0,
      message: '',
      errors: [] as string[],
    };

    // Process action based on type
    switch (action) {
      case 'activate':
        for (const listing of listings) {
          try {
            await ListingRepository.update(listing.id, { state: 'ACTIVE' });
            
            if (etsyAccessToken && listing.etsyListingId) {
              const etsyService = new EtsyService(etsyAccessToken);
              await etsyService.updateListing(listing.etsyListingId, { state: 'active' });
            }
            
            results.processed++;
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to activate listing ${listing.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        results.message = `Activated ${results.processed} listings`;
        break;

      case 'deactivate':
        for (const listing of listings) {
          try {
            await ListingRepository.update(listing.id, { state: 'INACTIVE' });
            
            if (etsyAccessToken && listing.etsyListingId) {
              const etsyService = new EtsyService(etsyAccessToken);
              await etsyService.updateListing(listing.etsyListingId, { state: 'inactive' });
            }
            
            results.processed++;
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to deactivate listing ${listing.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        results.message = `Deactivated ${results.processed} listings`;
        break;

      case 'duplicate':
        for (const listing of listings) {
          try {
            // Create duplicate with modified title
            await ListingRepository.create({
              etsyListingId: `${listing.etsyListingId}-copy-${Date.now()}`, // Generate unique ID
              shop: { connect: { id: listing.shopId } },
              user: { connect: { id: listing.userId } },
              title: `${listing.title} (Copy)`,
              description: listing.description,
              state: 'DRAFT',
              url: listing.url,
              price: listing.price,
              currencyCode: listing.currencyCode,
              originalPrice: listing.originalPrice,
              quantity: listing.quantity,
              skuNumber: listing.skuNumber,
              taxonomyId: listing.taxonomyId,
              categoryPath: listing.categoryPath,
              tags: listing.tags,
              materials: listing.materials,
              shopSection: listing.shopSectionId ? { connect: { id: listing.shopSectionId } } : undefined,
              views: 0,
              favoritersCount: 0,
              etsyCreatedAt: new Date(),
              etsyUpdatedAt: new Date(),
            });
            
            results.processed++;
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to duplicate listing ${listing.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        results.message = `Duplicated ${results.processed} listings`;
        break;

      case 'delete':
        for (const listing of listings) {
          try {
            await ListingRepository.delete(listing.id);
            
            if (etsyAccessToken && listing.etsyListingId) {
              const etsyService = new EtsyService(etsyAccessToken);
              await etsyService.deleteListing(listing.etsyListingId);
            }
            
            results.processed++;
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to delete listing ${listing.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        results.message = `Deleted ${results.processed} listings`;
        break;

      case 'refresh':
        for (const listing of listings) {
          try {
            if (etsyAccessToken && listing.etsyListingId) {
              const etsyService = new EtsyService(etsyAccessToken);
              const etsyListing = await etsyService.getListing(listing.etsyListingId);
              
              await ListingRepository.update(listing.id, {
                title: etsyListing.title,
                description: etsyListing.description,
                price: etsyListing.price.amount / etsyListing.price.divisor,
                quantity: etsyListing.quantity,
                state: etsyListing.state.toUpperCase(),
                views: etsyListing.views,
                favoritersCount: etsyListing.num_favorers,
                tags: etsyListing.tags,
                materials: etsyListing.materials,
                lastSyncAt: new Date(),
              });
            }
            
            results.processed++;
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to refresh listing ${listing.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        results.message = `Refreshed ${results.processed} listings from Etsy`;
        break;

      case 'adjust-price':
        if (!actionParams || !actionParams.value) {
          throw new Error('Price adjustment parameters required');
        }

        for (const listing of listings) {
          try {
            // Convert Decimal to number for calculations
            const currentPrice = Number(listing.price) || 0;
            let newPrice = currentPrice;
            
            if (actionParams.type === 'percentage') {
              if (actionParams.action === 'increase') {
                newPrice = currentPrice * (1 + actionParams.value / 100);
              } else {
                newPrice = currentPrice * (1 - actionParams.value / 100);
              }
            } else {
              if (actionParams.action === 'increase') {
                newPrice = currentPrice + actionParams.value;
              } else {
                newPrice = currentPrice - actionParams.value;
              }
            }
            
            newPrice = Math.max(0.01, newPrice); // Ensure minimum price
            
            await ListingRepository.update(listing.id, { price: newPrice });
            
            if (etsyAccessToken && listing.etsyListingId) {
              const etsyService = new EtsyService(etsyAccessToken);
              await etsyService.updateListing(listing.etsyListingId, { price: newPrice });
            }
            
            results.processed++;
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to adjust price for listing ${listing.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        results.message = `Adjusted prices for ${results.processed} listings`;
        break;

      case 'add-tags':
        if (!actionParams || !actionParams.tags) {
          throw new Error('Tags required');
        }

        for (const listing of listings) {
          try {
            const currentTags = listing.tags || [];
            const newTags = [...new Set([...currentTags, ...actionParams.tags])].slice(0, 13);
            
            await ListingRepository.update(listing.id, { tags: newTags });
            
            if (etsyAccessToken && listing.etsyListingId) {
              const etsyService = new EtsyService(etsyAccessToken);
              await etsyService.updateListing(listing.etsyListingId, { tags: newTags });
            }
            
            results.processed++;
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to add tags to listing ${listing.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        results.message = `Added tags to ${results.processed} listings`;
        break;

      case 'remove-tags':
        if (!actionParams || !actionParams.tags) {
          throw new Error('Tags required');
        }

        for (const listing of listings) {
          try {
            const currentTags = listing.tags || [];
            const newTags = currentTags.filter(tag => !actionParams.tags.includes(tag));
            
            await ListingRepository.update(listing.id, { tags: newTags });
            
            if (etsyAccessToken && listing.etsyListingId) {
              const etsyService = new EtsyService(etsyAccessToken);
              await etsyService.updateListing(listing.etsyListingId, { tags: newTags });
            }
            
            results.processed++;
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to remove tags from listing ${listing.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        results.message = `Removed tags from ${results.processed} listings`;
        break;

      case 'change-shipping':
        if (!actionParams || !actionParams.shippingProfileId) {
          throw new Error('Shipping profile ID required');
        }

        for (const listing of listings) {
          try {
            await ListingRepository.update(listing.id, { 
              shippingProfile: { connect: { id: actionParams.shippingProfileId } }
            });
            
            if (etsyAccessToken && listing.etsyListingId) {
              const etsyService = new EtsyService(etsyAccessToken);
              await etsyService.updateListing(listing.etsyListingId, { 
                shipping_template_id: actionParams.shippingProfileId 
              });
            }
            
            results.processed++;
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to update shipping for listing ${listing.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        results.message = `Updated shipping template for ${results.processed} listings`;
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Bulk action error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}