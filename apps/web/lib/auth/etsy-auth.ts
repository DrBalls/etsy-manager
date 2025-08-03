import { NextApiRequest, NextApiResponse } from 'next';
import { EtsyOAuthClient, OAuthTokens, retryOAuthOperation } from '@etsy-manager/shared';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth-options';
import { prisma } from '../prisma';

// TODO: Re-enable when OAuthSession is implemented
// const OAUTH_SESSION_PREFIX = 'etsy_oauth_';
// const SESSION_EXPIRY = 10 * 60 * 1000; // 10 minutes

// TODO: Implement OAuthSession interface when model is added to schema
// interface OAuthSession {
//   state: string;
//   codeVerifier: string;
//   codeChallenge: string;
//   redirectUri: string;
//   userId: string;
//   createdAt: number;
// }

export class EtsyAuthService {
  private client: EtsyOAuthClient;

  constructor() {
    this.client = new EtsyOAuthClient({
      clientId: process.env.ETSY_CLIENT_ID!,
      clientSecret: process.env.ETSY_CLIENT_SECRET!,
    });
  }

  /**
   * Initiate OAuth flow
   */
  async initiateOAuth(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Generate PKCE and state
      // TODO: When OAuthSession model is implemented, use PKCE for enhanced security
      // For now, we'll use a basic OAuth flow without PKCE
      const state = this.client.generateState();
      
      // TODO: Implement OAuthSession storage
      // The OAuthSession model is not defined in the schema
      // For now, we'll need to store state temporarily in session or memory
      // This is less secure but functional until proper storage is implemented

      // Get authorization URL
      const authUrl = this.client.getAuthorizationUrl({ state });

      return res.json({ authUrl });
    } catch (error) {
      console.error('OAuth initiation error:', error);
      return res.status(500).json({ 
        error: 'Failed to initiate OAuth flow' 
      });
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback(req: NextApiRequest, res: NextApiResponse) {
    const { code, state, error } = req.query;

    if (error) {
      const errorMessage = req.query.error_description || 'Authorization failed';
      return res.redirect(`/settings/integrations?error=${encodeURIComponent(errorMessage as string)}`);
    }

    if (!code || !state) {
      return res.redirect('/settings/integrations?error=Invalid+callback+parameters');
    }

    try {
      // Retrieve OAuth session
      // TODO: Implement OAuthSession retrieval when model is added
      // const sessionId = `${OAUTH_SESSION_PREFIX}${state}`;
      // const oauthSession = await prisma.oAuthSession.findUnique({
      //   where: { id: sessionId },
      // });
      const oauthSession = null; // Temporary

      if (!oauthSession) {
        // TODO: Implement proper OAuth session handling
        // For now, skip validation
        // return res.redirect('/settings/integrations?error=Invalid+session');
      }

      // TODO: Check if session expired when OAuthSession is implemented
      // if (oauthSession && oauthSession.expiresAt < new Date()) {
      //   // await prisma.oAuthSession.delete({ where: { id: sessionId } });
      //   return res.redirect('/settings/integrations?error=Session+expired');
      // }

      // TODO: Set PKCE values in client when OAuthSession is implemented
      // this.client.setPKCEValues(
      //   oauthSession.codeVerifier,
      //   oauthSession.codeChallenge
      // );
      // this.client.setState(oauthSession.state);

      // Exchange code for tokens
      // TODO: Without OAuthSession, we need to handle PKCE values differently
      // For now, we'll proceed without code verifier (less secure)
      const tokens = await retryOAuthOperation(
        async () => {
          const params = new URLSearchParams(req.url?.split('?')[1] || '');
          this.client.parseAuthorizationResponse(params);
          return this.client.exchangeCodeForTokens(
            code as string,
            '' // TODO: Retrieve code verifier from session storage
          );
        },
        'Token exchange'
      );

      // Get user session to save tokens
      const session = await getServerSession(req, res, authOptions);
      if (!session?.user?.id) {
        return res.redirect('/settings/integrations?error=No+active+session');
      }

      // Save tokens to database
      await this.saveTokens(session.user.id, tokens);

      // Fetch user info from Etsy
      const userInfo = await this.fetchEtsyUserInfo(tokens.accessToken);

      // Update user profile with Etsy info
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          etsyUserId: userInfo.user_id.toString(),
        },
      });

      // If user has a shop, create or update it
      if (userInfo.shop_id) {
        // TODO: Implement shop creation/update logic
        // This would typically involve fetching shop details from Etsy
        // and creating/updating a Shop record linked to the user
      }

      // TODO: Clean up OAuth session when implemented
      // await prisma.oAuthSession.delete({ where: { id: sessionId } });

      return res.redirect('/settings/integrations?success=true');
    } catch (error) {
      console.error('OAuth callback error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authorization failed';
      return res.redirect(`/settings/integrations?error=${encodeURIComponent(errorMessage)}`);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(userId: string): Promise<OAuthTokens> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        etsyRefreshToken: true,
      },
    });

    if (!user?.etsyRefreshToken) {
      throw new Error('No refresh token found for user');
    }

    try {
      const newTokens = await retryOAuthOperation(
        () => this.client.refreshAccessToken(user.etsyRefreshToken!),
        'Token refresh'
      );

      await this.saveTokens(userId, newTokens);
      return newTokens;
    } catch (error) {
      // If refresh fails, clear invalid tokens
      await prisma.user.update({
        where: { id: userId },
        data: {
          etsyAccessToken: null,
          etsyRefreshToken: null,
          etsyTokenExpiresAt: null,
        },
      });
      throw error;
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        etsyAccessToken: true,
        etsyTokenExpiresAt: true,
      },
    });

    if (!user?.etsyAccessToken || !user?.etsyTokenExpiresAt) {
      throw new Error('User not connected to Etsy');
    }

    // Check if token is expired or about to expire
    const now = new Date();
    const expiryBuffer = 5 * 60 * 1000; // 5 minutes
    const tokenExpired = user.etsyTokenExpiresAt.getTime() - now.getTime() < expiryBuffer;

    if (tokenExpired) {
      const newTokens = await this.refreshToken(userId);
      return newTokens.accessToken;
    }

    return user.etsyAccessToken;
  }

  /**
   * Disconnect Etsy account
   */
  async disconnect(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        etsyUserId: null,
        etsyAccessToken: null,
        etsyRefreshToken: null,
        etsyTokenExpiresAt: null,
      },
    });
  }

  /**
   * Save tokens to database
   */
  private async saveTokens(userId: string, tokens: OAuthTokens): Promise<void> {
    // Save tokens to User model since EtsyToken model doesn't exist
    await prisma.user.update({
      where: { id: userId },
      data: {
        etsyAccessToken: tokens.accessToken,
        etsyRefreshToken: tokens.refreshToken,
        etsyTokenExpiresAt: tokens.expiresAt,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Fetch user info from Etsy API
   */
  private async fetchEtsyUserInfo(accessToken: string): Promise<any> {
    const response = await fetch('https://openapi.etsy.com/v3/application/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-api-key': process.env.ETSY_CLIENT_ID!,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Etsy user info');
    }

    return response.json();
  }
}

// Export singleton instance
export const etsyAuth = new EtsyAuthService();