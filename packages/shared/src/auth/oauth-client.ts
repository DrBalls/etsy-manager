import crypto from 'crypto';
import {
  OAuthConfig,
  OAuthTokens,
  AuthorizeParams,
  TokenRequestParams,
  OAuthError,
} from '../types/auth';
import {
  ETSY_OAUTH_URLS,
  ETSY_REDIRECT_URIS,
  PKCE_CODE_VERIFIER_LENGTH,
  PKCE_CODE_CHALLENGE_METHOD,
  ETSY_AUTH_ERRORS,
  DEFAULT_ETSY_SCOPES,
} from '../config/etsy.config';

export class EtsyOAuthClient {
  private config: OAuthConfig;

  constructor(config: Partial<OAuthConfig>) {
    if (!config.clientId || !config.clientSecret) {
      throw new Error(ETSY_AUTH_ERRORS.MISSING_CREDENTIALS);
    }

    this.config = {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri || ETSY_REDIRECT_URIS.web,
      scopes: config.scopes || DEFAULT_ETSY_SCOPES,
      state: config.state,
      codeVerifier: config.codeVerifier,
      codeChallenge: config.codeChallenge,
    };
  }

  /**
   * Generate PKCE code verifier and challenge
   */
  generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    // Generate code verifier
    const codeVerifier = crypto
      .randomBytes(PKCE_CODE_VERIFIER_LENGTH / 2)
      .toString('base64url');

    // Generate code challenge using SHA256
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    this.config.codeVerifier = codeVerifier;
    this.config.codeChallenge = codeChallenge;

    return { codeVerifier, codeChallenge };
  }

  /**
   * Generate random state parameter for CSRF protection
   */
  generateState(): string {
    const state = crypto.randomBytes(32).toString('base64url');
    this.config.state = state;
    return state;
  }

  /**
   * Get the authorization URL for OAuth flow
   */
  getAuthorizationUrl(options?: {
    state?: string;
    scopes?: string[];
    redirectUri?: string;
  }): string {
    const state = options?.state || this.generateState();
    const scopes = options?.scopes || this.config.scopes;
    const redirectUri = options?.redirectUri || this.config.redirectUri;

    // Generate PKCE if not already present
    if (!this.config.codeChallenge) {
      this.generatePKCE();
    }

    const params: AuthorizeParams = {
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      client_id: this.config.clientId,
      state,
      code_challenge: this.config.codeChallenge!,
      code_challenge_method: PKCE_CODE_CHALLENGE_METHOD,
    };

    const queryString = new URLSearchParams(params as any).toString();
    return `${ETSY_OAUTH_URLS.authorizationUrl}?${queryString}`;
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  async exchangeCodeForTokens(
    code: string,
    codeVerifier?: string
  ): Promise<OAuthTokens> {
    if (!codeVerifier && !this.config.codeVerifier) {
      throw new Error('Code verifier is required for PKCE flow');
    }

    const params: TokenRequestParams = {
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      code,
      code_verifier: codeVerifier || this.config.codeVerifier!,
    };

    try {
      const response = await fetch(ETSY_OAUTH_URLS.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params as any).toString(),
      });

      if (!response.ok) {
        const error = (await response.json()) as OAuthError;
        throw new Error(
          error.error_description || ETSY_AUTH_ERRORS.TOKEN_EXCHANGE_FAILED
        );
      }

      const data = await response.json();

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        tokenType: data.token_type,
        scope: data.scope,
      };
    } catch (error) {
      console.error('Token exchange error:', error);
      throw new Error(ETSY_AUTH_ERRORS.TOKEN_EXCHANGE_FAILED);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const params: TokenRequestParams = {
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      refresh_token: refreshToken,
    };

    try {
      const response = await fetch(ETSY_OAUTH_URLS.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params as any).toString(),
      });

      if (!response.ok) {
        const error = (await response.json()) as OAuthError;
        throw new Error(
          error.error_description || ETSY_AUTH_ERRORS.TOKEN_REFRESH_FAILED
        );
      }

      const data = await response.json();

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        tokenType: data.token_type,
        scope: data.scope,
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error(ETSY_AUTH_ERRORS.TOKEN_REFRESH_FAILED);
    }
  }

  /**
   * Validate state parameter for CSRF protection
   */
  validateState(receivedState: string): boolean {
    if (!this.config.state || !receivedState) {
      return false;
    }
    return crypto.timingSafeEqual(
      Buffer.from(this.config.state),
      Buffer.from(receivedState)
    );
  }

  /**
   * Parse authorization response from callback URL
   */
  parseAuthorizationResponse(
    params: URLSearchParams
  ): { code?: string; state?: string; error?: string } {
    const code = params.get('code') || undefined;
    const state = params.get('state') || undefined;
    const error = params.get('error') || undefined;
    const errorDescription = params.get('error_description') || undefined;

    if (error) {
      if (error === 'access_denied') {
        throw new Error(ETSY_AUTH_ERRORS.USER_DENIED);
      }
      throw new Error(errorDescription || error);
    }

    if (!code) {
      throw new Error(ETSY_AUTH_ERRORS.NO_AUTH_CODE);
    }

    if (!state || !this.validateState(state)) {
      throw new Error(ETSY_AUTH_ERRORS.INVALID_STATE);
    }

    return { code, state };
  }

  /**
   * Get stored PKCE values for session persistence
   */
  getPKCEValues(): { codeVerifier?: string; codeChallenge?: string } {
    return {
      codeVerifier: this.config.codeVerifier,
      codeChallenge: this.config.codeChallenge,
    };
  }

  /**
   * Get stored state for session persistence
   */
  getState(): string | undefined {
    return this.config.state;
  }

  /**
   * Set PKCE values (for restoring from session)
   */
  setPKCEValues(codeVerifier: string, codeChallenge: string): void {
    this.config.codeVerifier = codeVerifier;
    this.config.codeChallenge = codeChallenge;
  }

  /**
   * Set state (for restoring from session)
   */
  setState(state: string): void {
    this.config.state = state;
  }
}