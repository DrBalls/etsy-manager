import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ListingRepository } from '@/lib/repositories/listing.repository';
import { ShopRepository } from '@/lib/repositories/shop.repository';
import { EtsyService } from '@/lib/services/etsy.service';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mapping = JSON.parse(formData.get('mapping') as string);
    const shopId = formData.get('shopId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Verify shop ownership and get user data
    const shop = await ShopRepository.findByIdWithUser(shopId);
    if (!shop || shop.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Process file based on type
    let data: any[] = [];
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'csv') {
      const text = await file.text();
      const parseResult = Papa.parse(text, { header: true });
      data = parseResult.data;
    } else if (extension === 'xlsx' || extension === 'xls') {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        return NextResponse.json({ error: 'No sheets found in Excel file' }, { status: 400 });
      }
      const firstSheet = workbook.Sheets[firstSheetName];
      if (!firstSheet) {
        return NextResponse.json({ error: 'Sheet not found in Excel file' }, { status: 400 });
      }
      data = XLSX.utils.sheet_to_json(firstSheet);
    } else {
      return NextResponse.json({ error: 'Unsupported file format' }, { status: 400 });
    }

    const results = {
      total: data.length,
      imported: 0,
      failed: 0,
      errors: [] as string[],
    };

    const etsyService = shop.user.etsyAccessToken ? new EtsyService(shop.user.etsyAccessToken) : null;

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || Object.keys(row).length === 0) continue;

      try {
        // Map fields from file to listing data
        const listingData: any = {
          shopId,
          state: 'DRAFT', // Default to draft
          quantity: 1, // Default quantity
        };

        // Map required fields
        if (mapping.title && row[mapping.title]) {
          listingData.title = row[mapping.title];
        } else {
          throw new Error('Title is required');
        }

        if (mapping.description && row[mapping.description]) {
          listingData.description = row[mapping.description];
        } else {
          throw new Error('Description is required');
        }

        if (mapping.price && row[mapping.price]) {
          listingData.price = parseFloat(row[mapping.price]);
          if (isNaN(listingData.price) || listingData.price <= 0) {
            throw new Error('Invalid price');
          }
        } else {
          throw new Error('Price is required');
        }

        if (mapping.quantity && row[mapping.quantity]) {
          listingData.quantity = parseInt(row[mapping.quantity]);
          if (isNaN(listingData.quantity) || listingData.quantity < 0) {
            listingData.quantity = 1;
          }
        }

        // Map optional fields
        if (mapping.sku && row[mapping.sku]) {
          listingData.skuNumber = row[mapping.sku];
        }

        if (mapping.tags && row[mapping.tags]) {
          listingData.tags = row[mapping.tags]
            .split(',')
            .map((tag: string) => tag.trim())
            .filter(Boolean)
            .slice(0, 13); // Etsy allows max 13 tags
        }

        if (mapping.materials && row[mapping.materials]) {
          listingData.materials = row[mapping.materials]
            .split(',')
            .map((material: string) => material.trim())
            .filter(Boolean);
        }

        if (mapping.processing_time_min && row[mapping.processing_time_min]) {
          listingData.processingTimeMin = parseInt(row[mapping.processing_time_min]);
        }

        if (mapping.processing_time_max && row[mapping.processing_time_max]) {
          listingData.processingTimeMax = parseInt(row[mapping.processing_time_max]);
        }

        if (mapping.category_id && row[mapping.category_id]) {
          listingData.categoryId = row[mapping.category_id];
        }

        if (mapping.who_made && row[mapping.who_made]) {
          listingData.whoMade = row[mapping.who_made];
        }

        if (mapping.when_made && row[mapping.when_made]) {
          listingData.whenMade = row[mapping.when_made];
        }

        if (mapping.is_vintage && row[mapping.is_vintage]) {
          listingData.isVintage = row[mapping.is_vintage].toLowerCase() === 'true';
        }

        if (mapping.is_supply && row[mapping.is_supply]) {
          listingData.isSupply = row[mapping.is_supply].toLowerCase() === 'true';
        }

        // Create listing in database
        const listing = await ListingRepository.create(listingData);

        // Create on Etsy if connected
        if (etsyService && listing) {
          try {
            const etsyListing = await etsyService.createListing({
              title: listingData.title,
              description: listingData.description,
              price: listingData.price,
              quantity: listingData.quantity,
              tags: listingData.tags,
              materials: listingData.materials,
              processing_min: listingData.processingTimeMin,
              processing_max: listingData.processingTimeMax,
              taxonomy_id: listingData.categoryId,
              who_made: listingData.whoMade,
              when_made: listingData.whenMade,
              is_vintage: listingData.isVintage,
              is_supply: listingData.isSupply,
            });

            // Update listing with Etsy ID
            await ListingRepository.update(listing.id, {
              etsyListingId: etsyListing.listing_id.toString(),
              url: etsyListing.url,
            });
          } catch (etsyError) {
            console.error('Failed to create on Etsy:', etsyError);
            // Continue - listing is created in database
          }
        }

        results.imported++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import listings' },
      { status: 500 }
    );
  }
}