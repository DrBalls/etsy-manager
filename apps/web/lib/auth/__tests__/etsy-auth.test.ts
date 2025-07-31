import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextApiRequest, NextApiResponse } from 'next';
import { etsyAuth } from '../etsy-auth';
import { prisma } from '../../prisma';

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('../../prisma', () => ({
  prisma: {
    oAuthSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    etsyToken: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('EtsyAuthService', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockReq = {
      method: 'POST',
      query: {},
      url: 'http://localhost:3000/api/auth/etsy/callback',
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      redirect: vi.fn().mockReturnThis(),
    };
  });

  describe('initiateOAuth', () => {
    it('should initiate OAuth flow for authenticated user', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });

      (prisma.oAuthSession.create as any).mockResolvedValue({
        id: 'oauth-session-123',
      });

      await etsyAuth.initiateOAuth(
        mockReq as NextApiRequest,
        mockRes as NextApiResponse
      );

      expect(prisma.oAuthSession.create).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        authUrl: expect.stringContaining('https://www.etsy.com/oauth/connect'),
      });
    });

    it('should return 401 for unauthenticated user', async () => {
      const { getServerSession } = await import('next-auth');
      (getServerSession as any).mockResolvedValue(null);

      await etsyAuth.initiateOAuth(
        mockReq as NextApiRequest,
        mockRes as NextApiResponse
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });
  });

  describe('handleCallback', () => {
    it('should handle successful OAuth callback', async () => {
      mockReq.query = {
        code: 'test-code',
        state: 'test-state',
      };

      const mockOAuthSession = {
        id: 'oauth-session-123',
        state: 'test-state',
        codeVerifier: 'test-verifier',
        codeChallenge: 'test-challenge',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };

      (prisma.oAuthSession.findUnique as any).mockResolvedValue(mockOAuthSession);

      const mockTokens = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'email_r shops_r',
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokens,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            user_id: 12345,
            shop_id: 67890,
          }),
        });

      (prisma.etsyToken.upsert as any).mockResolvedValue({});
      (prisma.user.update as any).mockResolvedValue({});
      (prisma.oAuthSession.delete as any).mockResolvedValue({});

      await etsyAuth.handleCallback(
        mockReq as NextApiRequest,
        mockRes as NextApiResponse
      );

      expect(prisma.etsyToken.upsert).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          etsyUserId: '12345',
          etsyShopId: '67890',
        }),
      });
      expect(mockRes.redirect).toHaveBeenCalledWith(
        '/settings/integrations?success=true'
      );
    });

    it('should handle OAuth errors', async () => {
      mockReq.query = {
        error: 'access_denied',
        error_description: 'User denied access',
      };

      await etsyAuth.handleCallback(
        mockReq as NextApiRequest,
        mockRes as NextApiResponse
      );

      expect(mockRes.redirect).toHaveBeenCalledWith(
        '/settings/integrations?error=User+denied+access'
      );
    });

    it('should handle invalid state', async () => {
      mockReq.query = {
        code: 'test-code',
        state: 'invalid-state',
      };

      (prisma.oAuthSession.findUnique as any).mockResolvedValue(null);

      await etsyAuth.handleCallback(
        mockReq as NextApiRequest,
        mockRes as NextApiResponse
      );

      expect(mockRes.redirect).toHaveBeenCalledWith(
        '/settings/integrations?error=Invalid+session'
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockTokenRecord = {
        userId: 'user-123',
        refreshToken: 'old-refresh-token',
      };

      (prisma.etsyToken.findUnique as any).mockResolvedValue(mockTokenRecord);

      const mockNewTokens = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'email_r shops_r',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockNewTokens,
      });

      (prisma.etsyToken.upsert as any).mockResolvedValue({});

      const result = await etsyAuth.refreshToken('user-123');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(prisma.etsyToken.upsert).toHaveBeenCalled();
    });

    it('should delete tokens on refresh failure', async () => {
      const mockTokenRecord = {
        userId: 'user-123',
        refreshToken: 'expired-refresh-token',
      };

      (prisma.etsyToken.findUnique as any).mockResolvedValue(mockTokenRecord);

      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: 'invalid_token',
          error_description: 'Refresh token expired',
        }),
      });

      (prisma.etsyToken.delete as any).mockResolvedValue({});

      await expect(etsyAuth.refreshToken('user-123')).rejects.toThrow();
      expect(prisma.etsyToken.delete).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });
  });

  describe('getValidAccessToken', () => {
    it('should return valid access token', async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      
      (prisma.etsyToken.findUnique as any).mockResolvedValue({
        accessToken: 'valid-token',
        expiresAt: futureDate,
      });

      const token = await etsyAuth.getValidAccessToken('user-123');
      expect(token).toBe('valid-token');
    });

    it('should refresh expired token', async () => {
      const pastDate = new Date(Date.now() - 60 * 1000); // 1 minute ago
      
      (prisma.etsyToken.findUnique as any).mockResolvedValue({
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        expiresAt: pastDate,
      });

      const mockNewTokens = {
        access_token: 'new-token',
        refresh_token: 'new-refresh',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'email_r shops_r',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockNewTokens,
      });

      (prisma.etsyToken.upsert as any).mockResolvedValue({});

      const token = await etsyAuth.getValidAccessToken('user-123');
      expect(token).toBe('new-token');
    });
  });

  describe('disconnect', () => {
    it('should disconnect Etsy account', async () => {
      (prisma.$transaction as any).mockImplementation((fn: any) => {
        return Promise.resolve(fn.map((query: any) => ({})));
      });

      await etsyAuth.disconnect('user-123');

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});