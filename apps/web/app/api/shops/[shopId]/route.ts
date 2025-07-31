import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getEtsyApiClient } from '@/lib/api/etsy-api-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { shopId: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get API client for this user
    const apiClient = getEtsyApiClient(session.user.id);

    // Fetch shop data (will be cached in Redis)
    const shop = await apiClient.get(`/shops/${params.shopId}`);

    // Get queue and rate limit info
    const queueStats = apiClient.getQueueStats();
    const rateLimitInfo = apiClient.getRateLimitInfo();

    return NextResponse.json({
      shop,
      _meta: {
        cached: true, // The API client handles caching transparently
        queue: queueStats,
        rateLimit: rateLimitInfo,
      },
    });
  } catch (error) {
    console.error('Error fetching shop:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shop data' },
      { status: 500 }
    );
  }
}