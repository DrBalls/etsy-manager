import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
import { ListingRepository } from '@/lib/repositories';
import { z } from 'zod';

const updateListingSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  quantity: z.number().int().min(0).optional(),
  state: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).optional(),
  tags: z.array(z.string()).max(13).optional(),
  materials: z.array(z.string()).optional(),
  sku: z.string().optional(),
  whoMade: z.string().optional(),
  whenMade: z.string().optional(),
  isSupply: z.boolean().optional(),
  processingMin: z.number().int().positive().optional(),
  processingMax: z.number().int().positive().optional(),
});

// GET /api/listings/[listingId]
export async function GET(
  _request: NextRequest,
  { params }: { params: { listingId: string } }
) {
  try {
    const session = await requireAuth();
    const listing = await ListingRepository.findById(params.listingId);

    if (!listing || listing.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}

// PATCH /api/listings/[listingId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { listingId: string } }
) {
  try {
    const session = await requireAuth();
    const listing = await ListingRepository.findById(params.listingId);

    if (!listing || listing.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateListingSchema.parse(body);

    const updatedListing = await ListingRepository.update(params.listingId, {
      ...validatedData,
      updatedAt: new Date(),
    });

    return NextResponse.json(updatedListing);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating listing:', error);
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

// DELETE /api/listings/[listingId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { listingId: string } }
) {
  try {
    const session = await requireAuth();
    const listing = await ListingRepository.findById(params.listingId);

    if (!listing || listing.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    await ListingRepository.delete(params.listingId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json(
      { error: 'Failed to delete listing' },
      { status: 500 }
    );
  }
}