import { NextApiRequest, NextApiResponse } from 'next';
import { EtsyOAuthClient, OAuthTokens, retryOAuthOperation } from '@etsy-manager/shared';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../pages/api/auth/[...nextauth]';
import { prisma } from '../prisma';

const OAUTH_SESSION_PREFIX = 'etsy_oauth_';
const SESSION_EXPIRY = 10 * 60 * 1000; // 10 minutes

interface OAuthSession {
  state: string;
  codeVerifier: string;
  codeChallenge: string;
  redirectUri: string;
  userId: string;
  createdAt: number;
}

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
      const { codeVerifier, codeChallenge } = this.client.generatePKCE();
      const state = this.client.generateState();
      
      // Store OAuth session in database
      const oauthSession: OAuthSession = {
        state,
        codeVerifier,
        codeChallenge,
        redirectUri: this.client['config'].redirectUri,
        userId: session.user.id,
        createdAt: Date.now(),
      };

      await prisma.oAuthSession.create({
        data: {
          id: `${OAUTH_SESSION_PREFIX}${state}`,
          state,
          codeVerifier,
          codeChallenge,
          redirectUri: oauthSession.redirectUri,
          userId: session.user.id,
          expiresAt: new Date(Date.now() + SESSION_EXPIRY),
        },
      });

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
      const sessionId = `${OAUTH_SESSION_PREFIX}${state}`;
      const oauthSession = await prisma.oAuthSession.findUnique({
        where: { id: sessionId },
      });

      if (!oauthSession) {
        return res.redirect('/settings/integrations?error=Invalid+session');
      }

      // Check if session expired
      if (oauthSession.expiresAt < new Date()) {
        await prisma.oAuthSession.delete({ where: { id: sessionId } });
        return res.redirect('/settings/integrations?error=Session+expired');
      }

      // Set PKCE values in client
      this.client.setPKCEValues(
        oauthSession.codeVerifier,
        oauthSession.codeChallenge
      );
      this.client.setState(oauthSession.state);

      // Exchange code for tokens
      const tokens = await retryOAuthOperation(
        async () => {
          const params = new URLSearchParams(req.url?.split('?')[1] || '');
          this.client.parseAuthorizationResponse(params);
          return this.client.exchangeCodeForTokens(
            code as string,
            oauthSession.codeVerifier
          );
        },
        'Token exchange'
      );

      // Save tokens to database
      await this.saveTokens(oauthSession.userId, tokens);

      // Fetch user info from Etsy
      const userInfo = await this.fetchEtsyUserInfo(tokens.accessToken);

      // Update user profile with Etsy info
      await prisma.user.update({
        where: { id: oauthSession.userId },
        data: {
          etsyUserId: userInfo.user_id.toString(),
          etsyShopId: userInfo.shop_id?.toString(),
          etsyConnectedAt: new Date(),
        },
      });

      // Clean up OAuth session
      await prisma.oAuthSession.delete({ where: { id: sessionId } });

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
    const tokenRecord = await prisma.etsyToken.findUnique({
      where: { userId },
    });

    if (!tokenRecord) {
      throw new Error('No tokens found for user');
    }

    try {
      const newTokens = await retryOAuthOperation(
        () => this.client.refreshAccessToken(tokenRecord.refreshToken),
        'Token refresh'
      );

      await this.saveTokens(userId, newTokens);
      return newTokens;
    } catch (error) {
      // If refresh fails, delete invalid tokens
      await prisma.etsyToken.delete({ where: { userId } });
      throw error;
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(userId: string): Promise<string> {
    const tokenRecord = await prisma.etsyToken.findUnique({
      where: { userId },
    });

    if (!tokenRecord) {
      throw new Error('User not connected to Etsy');
    }

    // Check if token is expired or about to expire
    const now = new Date();
    const expiryBuffer = 5 * 60 * 1000; // 5 minutes
    const tokenExpired = tokenRecord.expiresAt.getTime() - now.getTime() < expiryBuffer;

    if (tokenExpired) {
      const newTokens = await this.refreshToken(userId);
      return newTokens.accessToken;
    }

    return tokenRecord.accessToken;
  }

  /**
   * Disconnect Etsy account
   */
  async disconnect(userId: string): Promise<void> {
    await prisma.$transaction([
      prisma.etsyToken.deleteMany({ where: { userId } }),
      prisma.user.update({
        where: { id: userId },
        data: {
          etsyUserId: null,
          etsyShopId: null,
          etsyConnectedAt: null,
        },
      }),
    ]);
  }

  /**
   * Save tokens to database
   */
  private async saveTokens(userId: string, tokens: OAuthTokens): Promise<void> {
    await prisma.etsyToken.upsert({
      where: { userId },
      update: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        tokenType: tokens.tokenType,
        scope: tokens.scope,
        updatedAt: new Date(),
      },
      create: {
        userId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        tokenType: tokens.tokenType,
        scope: tokens.scope,
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