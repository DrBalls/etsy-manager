import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EtsyOAuthClient } from '../oauth-client';
import { ETSY_AUTH_ERRORS, DEFAULT_ETSY_SCOPES } from '../../config/etsy.config';

// Mock fetch
global.fetch = vi.fn();

describe('EtsyOAuthClient', () => {
  let client: EtsyOAuthClient;
  const mockConfig = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'http://localhost:3000/callback',
  };

  beforeEach(() => {
    client = new EtsyOAuthClient(mockConfig);
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw error if client ID is missing', () => {
      expect(
        () =>
          new EtsyOAuthClient({
            clientSecret: 'secret',
          })
      ).toThrow(ETSY_AUTH_ERRORS.MISSING_CREDENTIALS);
    });

    it('should throw error if client secret is missing', () => {
      expect(
        () =>
          new EtsyOAuthClient({
            clientId: 'id',
          })
      ).toThrow(ETSY_AUTH_ERRORS.MISSING_CREDENTIALS);
    });

    it('should use default scopes if not provided', () => {
      const url = client.getAuthorizationUrl();
      expect(url).toContain(encodeURIComponent(DEFAULT_ETSY_SCOPES.join(' ')));
    });
  });

  describe('generatePKCE', () => {
    it('should generate code verifier and challenge', () => {
      const { codeVerifier, codeChallenge } = client.generatePKCE();

      expect(codeVerifier).toBeDefined();
      expect(codeChallenge).toBeDefined();
      expect(codeVerifier.length).toBeGreaterThan(40);
      expect(codeChallenge.length).toBeGreaterThan(40);
    });

    it('should generate different values each time', () => {
      const pkce1 = client.generatePKCE();
      const pkce2 = client.generatePKCE();

      expect(pkce1.codeVerifier).not.toBe(pkce2.codeVerifier);
      expect(pkce1.codeChallenge).not.toBe(pkce2.codeChallenge);
    });
  });

  describe('generateState', () => {
    it('should generate a random state', () => {
      const state = client.generateState();
      expect(state).toBeDefined();
      expect(state.length).toBeGreaterThan(20);
    });

    it('should generate different states each time', () => {
      const state1 = client.generateState();
      const state2 = client.generateState();
      expect(state1).not.toBe(state2);
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should generate a valid authorization URL', () => {
      const url = client.getAuthorizationUrl();
      const urlObj = new URL(url);

      expect(urlObj.origin).toBe('https://www.etsy.com');
      expect(urlObj.pathname).toBe('/oauth/connect');
      expect(urlObj.searchParams.get('response_type')).toBe('code');
      expect(urlObj.searchParams.get('client_id')).toBe(mockConfig.clientId);
      expect(urlObj.searchParams.get('redirect_uri')).toBe(
        mockConfig.redirectUri
      );
      expect(urlObj.searchParams.get('code_challenge')).toBeDefined();
      expect(urlObj.searchParams.get('code_challenge_method')).toBe('S256');
      expect(urlObj.searchParams.get('state')).toBeDefined();
    });

    it('should use custom scopes if provided', () => {
      const customScopes = ['email_r', 'shops_r'];
      const url = client.getAuthorizationUrl({ scopes: customScopes });
      const urlObj = new URL(url);

      expect(urlObj.searchParams.get('scope')).toBe(customScopes.join(' '));
    });

    it('should use custom state if provided', () => {
      const customState = 'custom-state-123';
      const url = client.getAuthorizationUrl({ state: customState });
      const urlObj = new URL(url);

      expect(urlObj.searchParams.get('state')).toBe(customState);
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange code for tokens successfully', async () => {
      const mockTokens = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'email_r shops_r',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokens,
      });

      const tokens = await client.exchangeCodeForTokens(
        'test-code',
        'test-verifier'
      );

      expect(tokens.accessToken).toBe(mockTokens.access_token);
      expect(tokens.refreshToken).toBe(mockTokens.refresh_token);
      expect(tokens.tokenType).toBe(mockTokens.token_type);
      expect(tokens.scope).toBe(mockTokens.scope);
      expect(tokens.expiresAt).toBeInstanceOf(Date);
    });

    it('should throw error if token exchange fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'invalid_grant',
          error_description: 'Invalid authorization code',
        }),
      });

      await expect(
        client.exchangeCodeForTokens('invalid-code', 'test-verifier')
      ).rejects.toThrow('Invalid authorization code');
    });

    it('should throw error if code verifier is missing', async () => {
      await expect(client.exchangeCodeForTokens('test-code')).rejects.toThrow(
        'Code verifier is required for PKCE flow'
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh token successfully', async () => {
      const mockTokens = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'email_r shops_r',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokens,
      });

      const tokens = await client.refreshAccessToken('test-refresh-token');

      expect(tokens.accessToken).toBe(mockTokens.access_token);
      expect(tokens.refreshToken).toBe(mockTokens.refresh_token);
      expect(tokens.expiresAt).toBeInstanceOf(Date);
    });

    it('should throw error if refresh fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'invalid_token',
          error_description: 'Refresh token expired',
        }),
      });

      await expect(
        client.refreshAccessToken('expired-token')
      ).rejects.toThrow('Refresh token expired');
    });
  });

  describe('validateState', () => {
    it('should validate matching state', () => {
      const state = 'test-state-123';
      client.setState(state);
      expect(client.validateState(state)).toBe(true);
    });

    it('should reject non-matching state', () => {
      client.setState('state-1');
      expect(client.validateState('state-2')).toBe(false);
    });

    it('should reject if no state is set', () => {
      expect(client.validateState('any-state')).toBe(false);
    });
  });

  describe('parseAuthorizationResponse', () => {
    beforeEach(() => {
      client.generateState(); // Set a state for validation
    });

    it('should parse successful authorization response', () => {
      const state = client.getState()!;
      const params = new URLSearchParams({
        code: 'test-auth-code',
        state,
      });

      const result = client.parseAuthorizationResponse(params);
      expect(result.code).toBe('test-auth-code');
      expect(result.state).toBe(state);
    });

    it('should throw error if code is missing', () => {
      const params = new URLSearchParams({
        state: client.getState()!,
      });

      expect(() => client.parseAuthorizationResponse(params)).toThrow(
        ETSY_AUTH_ERRORS.NO_AUTH_CODE
      );
    });

    it('should throw error if state is invalid', () => {
      const params = new URLSearchParams({
        code: 'test-code',
        state: 'invalid-state',
      });

      expect(() => client.parseAuthorizationResponse(params)).toThrow(
        ETSY_AUTH_ERRORS.INVALID_STATE
      );
    });

    it('should throw error if user denied access', () => {
      const params = new URLSearchParams({
        error: 'access_denied',
        error_description: 'User denied access',
      });

      expect(() => client.parseAuthorizationResponse(params)).toThrow(
        ETSY_AUTH_ERRORS.USER_DENIED
      );
    });
  });

  describe('PKCE persistence', () => {
    it('should get and set PKCE values', () => {
      const verifier = 'test-verifier';
      const challenge = 'test-challenge';

      client.setPKCEValues(verifier, challenge);
      const pkce = client.getPKCEValues();

      expect(pkce.codeVerifier).toBe(verifier);
      expect(pkce.codeChallenge).toBe(challenge);
    });
  });
});