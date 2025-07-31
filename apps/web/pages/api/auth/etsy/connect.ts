import { NextApiRequest, NextApiResponse } from 'next';
import { etsyAuth } from '../../../../lib/auth/etsy-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return etsyAuth.initiateOAuth(req, res);
}