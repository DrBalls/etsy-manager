import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ListingRepository } from '@/lib/repositories/listing.repository';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { z } from 'zod';

const exportSchema = z.object({
  listingIds: z.array(z.string()).min(1),
  format: z.enum(['csv', 'xlsx']),
  fields: z.array(z.string()).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { listingIds, format, fields } = exportSchema.parse(body);

    // Get listings to export
    const listings = await ListingRepository.findByIds(listingIds, session.user.id);
    
    if (listings.length === 0) {
      return NextResponse.json(
        { error: 'No listings found' },
        { status: 404 }
      );
    }

    // Prepare data for export
    const exportData = listings.map(listing => {
      const row: any = {};
      
      fields.forEach(field => {
        switch (field) {
          case 'id':
            row['Listing ID'] = listing.id;
            break;
          case 'title':
            row['Title'] = listing.title;
            break;
          case 'description':
            row['Description'] = listing.description;
            break;
          case 'price':
            row['Price'] = listing.price || 0;
            break;
          case 'quantity':
            row['Quantity'] = listing.quantity;
            break;
          case 'sku':
            row['SKU'] = listing.sku || '';
            break;
          case 'state':
            row['State'] = listing.state;
            break;
          case 'url':
            row['URL'] = listing.url || '';
            break;
          case 'tags':
            row['Tags'] = listing.tags?.join(', ') || '';
            break;
          case 'materials':
            row['Materials'] = listing.materials?.join(', ') || '';
            break;
          case 'processing_time_min':
            row['Processing Time Min'] = listing.processingTimeMin || '';
            break;
          case 'processing_time_max':
            row['Processing Time Max'] = listing.processingTimeMax || '';
            break;
          case 'category_path':
            row['Category Path'] = listing.categoryPath || '';
            break;
          case 'who_made':
            row['Who Made'] = listing.whoMade || '';
            break;
          case 'when_made':
            row['When Made'] = listing.whenMade || '';
            break;
          case 'is_vintage':
            row['Is Vintage'] = listing.isVintage ? 'true' : 'false';
            break;
          case 'is_supply':
            row['Is Supply'] = listing.isSupply ? 'true' : 'false';
            break;
          case 'views':
            row['Views'] = listing.views;
            break;
          case 'favorites':
            row['Favorites'] = listing.favorites;
            break;
          case 'featured_rank':
            row['Featured Rank'] = listing.featuredRank || '';
            break;
          case 'created_at':
            row['Created Date'] = new Date(listing.createdAt).toISOString();
            break;
          case 'updated_at':
            row['Updated Date'] = new Date(listing.updatedAt).toISOString();
            break;
          case 'last_synced_at':
            row['Last Synced'] = listing.lastSyncedAt 
              ? new Date(listing.lastSyncedAt).toISOString() 
              : '';
            break;
          case 'shipping_template_id':
            row['Shipping Template ID'] = listing.shippingTemplateId || '';
            break;
          case 'shipping_profile_id':
            row['Shipping Profile ID'] = listing.shippingProfileId || '';
            break;
          case 'images':
            row['Image URLs'] = listing.images?.join(', ') || '';
            break;
          case 'image_count':
            row['Image Count'] = listing.images?.length || 0;
            break;
        }
      });
      
      return row;
    });

    // Generate file based on format
    let fileContent: Buffer;
    let contentType: string;
    let filename: string;

    if (format === 'csv') {
      const csv = Papa.unparse(exportData);
      fileContent = Buffer.from(csv, 'utf-8');
      contentType = 'text/csv';
      filename = `listings-export-${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Auto-size columns
      const maxWidth = 50;
      const colWidths: any = {};
      
      // Calculate column widths
      exportData.forEach(row => {
        Object.keys(row).forEach(key => {
          const value = String(row[key] || '');
          const currentWidth = colWidths[key] || key.length;
          colWidths[key] = Math.min(maxWidth, Math.max(currentWidth, value.length));
        });
      });
      
      // Apply column widths
      ws['!cols'] = Object.keys(colWidths).map(key => ({
        wch: colWidths[key] + 2,
      }));
      
      XLSX.utils.book_append_sheet(wb, ws, 'Listings');
      
      // Generate buffer
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      fileContent = Buffer.from(excelBuffer);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = `listings-export-${new Date().toISOString().split('T')[0]}.xlsx`;
    }

    // Return file as response
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileContent.length.toString(),
      },
    });
  } catch (error) {
    console.error('Bulk export error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export listings' },
      { status: 500 }
    );
  }
}