import { EtsyOAuthClient, OAuthTokens, retryOAuthOperation } from '@etsy-manager/shared';

export class ExtensionEtsyAuth {
  private client: EtsyOAuthClient;

  constructor() {
    // Get redirect URI for Chrome extension
    const redirectUri = chrome.identity.getRedirectURL();
    
    this.client = new EtsyOAuthClient({
      clientId: process.env.ETSY_CLIENT_ID!,
      clientSecret: process.env.ETSY_CLIENT_SECRET!,
      redirectUri,
    });
  }

  /**
   * Start OAuth flow using Chrome identity API
   */
  async authenticate(): Promise<OAuthTokens> {
    return new Promise((resolve, reject) => {
      // Generate PKCE and state
      const { codeVerifier, codeChallenge } = this.client.generatePKCE();
      const state = this.client.generateState();

      // Get authorization URL
      const authUrl = this.client.getAuthorizationUrl({ state });

      // Use Chrome identity API for OAuth
      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl,
          interactive: true,
        },
        async (responseUrl) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (!responseUrl) {
            reject(new Error('No response URL received'));
            return;
          }

          try {
            const tokens = await this.handleCallbackUrl(
              responseUrl,
              codeVerifier,
              state
            );
            resolve(tokens);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    return retryOAuthOperation(
      () => this.client.refreshAccessToken(refreshToken),
      'Token refresh'
    );
  }

  /**
   * Get valid access token for current user
   */
  async getValidAccessToken(): Promise<string> {
    const tokens = await this.getStoredTokens();
    
    if (!tokens) {
      throw new Error('No tokens found');
    }

    // Check if token is expired or about to expire
    const now = new Date();
    const expiryBuffer = 5 * 60 * 1000; // 5 minutes
    const tokenExpired = new Date(tokens.expiresAt).getTime() - now.getTime() < expiryBuffer;

    if (tokenExpired) {
      const newTokens = await this.refreshToken(tokens.refreshToken);
      await this.saveTokens(newTokens);
      return newTokens.accessToken;
    }

    return tokens.accessToken;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const tokens = await this.getStoredTokens();
    return tokens !== null;
  }

  /**
   * Disconnect Etsy account
   */
  async disconnect(): Promise<void> {
    await chrome.storage.local.remove(['etsy_tokens', 'etsy_user']);
  }

  /**
   * Handle OAuth callback URL
   */
  private async handleCallbackUrl(
    url: string,
    codeVerifier: string,
    expectedState: string
  ): Promise<OAuthTokens> {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    // Set state for validation
    this.client.setState(expectedState);

    // Parse authorization response
    this.client.parseAuthorizationResponse(params);

    // Exchange code for tokens
    const code = params.get('code');
    if (!code) {
      throw new Error('No authorization code received');
    }

    const tokens = await retryOAuthOperation(
      () => this.client.exchangeCodeForTokens(code, codeVerifier),
      'Token exchange'
    );

    // Save tokens
    await this.saveTokens(tokens);

    // Fetch and save user info
    await this.fetchAndSaveUserInfo(tokens.accessToken);

    return tokens;
  }

  /**
   * Save tokens to Chrome storage
   */
  private async saveTokens(tokens: OAuthTokens): Promise<void> {
    await chrome.storage.local.set({
      etsy_tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt.toISOString(),
        tokenType: tokens.tokenType,
        scope: tokens.scope,
      },
    });
  }

  /**
   * Get stored tokens from Chrome storage
   */
  private async getStoredTokens(): Promise<OAuthTokens | null> {
    const result = await chrome.storage.local.get('etsy_tokens');
    
    if (!result.etsy_tokens) {
      return null;
    }

    return {
      ...result.etsy_tokens,
      expiresAt: new Date(result.etsy_tokens.expiresAt),
    };
  }

  /**
   * Fetch and save user info from Etsy
   */
  private async fetchAndSaveUserInfo(accessToken: string): Promise<void> {
    try {
      const response = await fetch('https://openapi.etsy.com/v3/application/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-api-key': process.env.ETSY_CLIENT_ID!,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userInfo = await response.json();

      // Also fetch shop info if user is a seller
      let shopInfo = null;
      if (userInfo.is_seller) {
        const shopResponse = await fetch(
          `https://openapi.etsy.com/v3/application/shops/${userInfo.shop_id}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'x-api-key': process.env.ETSY_CLIENT_ID!,
            },
          }
        );

        if (shopResponse.ok) {
          shopInfo = await shopResponse.json();
        }
      }

      // Save user and shop info
      await chrome.storage.local.set({
        etsy_user: {
          userId: userInfo.user_id,
          loginName: userInfo.login_name,
          email: userInfo.primary_email,
          firstName: userInfo.first_name,
          lastName: userInfo.last_name,
          isSeller: userInfo.is_seller,
          shopId: userInfo.shop_id,
          shopName: shopInfo?.shop_name,
          shopUrl: shopInfo?.url,
        },
      });
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      // Non-critical error, continue
    }
  }
}

// Export singleton instance
export const extensionAuth = new ExtensionEtsyAuth();