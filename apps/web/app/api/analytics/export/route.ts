import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { AnalyticsRepository } from '@/lib/repositories';
import { parse } from 'json2csv';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { shopId, dateRange, format, sections } = body;

    // Fetch analytics data
    const [
      periodStats,
      salesByDay,
      topProducts,
    ] = await Promise.all([
      AnalyticsRepository.getPeriodStats(shopId, {
        start: new Date(dateRange.from),
        end: new Date(dateRange.to),
      }),
      AnalyticsRepository.getSalesByDay(shopId, {
        start: new Date(dateRange.from),
        end: new Date(dateRange.to),
      }),
      AnalyticsRepository.getTopProducts(shopId, {
        start: new Date(dateRange.from),
        end: new Date(dateRange.to),
      }),
    ]);

    if (format === 'csv') {
      // Generate CSV
      const csvSections = [];

      if (sections.overview) {
        csvSections.push({
          section: 'Overview',
          data: [
            { metric: 'Total Revenue', value: periodStats.revenue },
            { metric: 'Total Orders', value: periodStats.orders },
            { metric: 'Total Customers', value: periodStats.customers },
            { metric: 'Conversion Rate', value: `${periodStats.conversionRate.toFixed(2)}%` },
            { metric: 'Average Order Value', value: periodStats.averageOrderValue },
          ],
        });
      }

      if (sections.revenue) {
        csvSections.push({
          section: 'Daily Sales',
          data: salesByDay,
        });
      }

      if (sections.products) {
        csvSections.push({
          section: 'Top Products',
          data: topProducts,
        });
      }

      // Convert to CSV
      let csv = '';
      csvSections.forEach(({ section, data }) => {
        csv += `\n${section}\n`;
        try {
          csv += parse(data as any) + '\n';
        } catch (error) {
          // Fallback to simple CSV format
          if (Array.isArray(data) && data.length > 0) {
            const firstRow = data[0];
            if (firstRow && typeof firstRow === 'object') {
              const headers = Object.keys(firstRow);
              csv += headers.join(',') + '\n';
              data.forEach((row: any) => {
                csv += headers.map(h => row[h] || '').join(',') + '\n';
              });
            }
          }
        }
      });

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-report.csv"`,
        },
      });
    } else if (format === 'xlsx') {
      // Generate Excel
      const wb = XLSX.utils.book_new();

      if (sections.overview) {
        const overviewData = [
          ['Metric', 'Value'],
          ['Total Revenue', periodStats.revenue],
          ['Total Orders', periodStats.orders],
          ['Total Customers', periodStats.customers],
          ['Conversion Rate', `${periodStats.conversionRate.toFixed(2)}%`],
          ['Average Order Value', periodStats.averageOrderValue],
        ];
        const ws = XLSX.utils.aoa_to_sheet(overviewData);
        XLSX.utils.book_append_sheet(wb, ws, 'Overview');
      }

      if (sections.revenue) {
        const ws = XLSX.utils.json_to_sheet(salesByDay);
        XLSX.utils.book_append_sheet(wb, ws, 'Daily Sales');
      }

      if (sections.products) {
        const ws = XLSX.utils.json_to_sheet(topProducts);
        XLSX.utils.book_append_sheet(wb, ws, 'Top Products');
      }

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="analytics-report.xlsx"`,
        },
      });
    } else if (format === 'pdf') {
      // Generate PDF (simplified version)
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));

      // Title
      doc.fontSize(20).text('Analytics Report', 50, 50);
      doc.fontSize(12).text(`${dateRange.from} - ${dateRange.to}`, 50, 80);

      let yPosition = 120;

      if (sections.overview) {
        doc.fontSize(16).text('Overview', 50, yPosition);
        yPosition += 30;
        doc.fontSize(12);
        doc.text(`Total Revenue: $${periodStats.revenue}`, 50, yPosition);
        yPosition += 20;
        doc.text(`Total Orders: ${periodStats.orders}`, 50, yPosition);
        yPosition += 20;
        doc.text(`Total Customers: ${periodStats.customers}`, 50, yPosition);
        yPosition += 20;
        doc.text(`Conversion Rate: ${periodStats.conversionRate.toFixed(2)}%`, 50, yPosition);
        yPosition += 20;
        doc.text(`Average Order Value: $${periodStats.averageOrderValue.toFixed(2)}`, 50, yPosition);
        yPosition += 40;
      }

      // End the document
      doc.end();

      // Wait for all chunks to be collected
      await new Promise((resolve) => doc.on('end', resolve));

      const pdfBuffer = Buffer.concat(chunks);

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="analytics-report.pdf"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    );
  }
}