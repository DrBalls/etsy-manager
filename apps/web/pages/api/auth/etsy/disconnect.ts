import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { etsyAuth } from '../../../../lib/auth/etsy-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await etsyAuth.disconnect(session.user.id);
    return res.json({ success: true });
  } catch (error) {
    console.error('Disconnect error:', error);
    return res.status(500).json({ error: 'Failed to disconnect Etsy account' });
  }
}