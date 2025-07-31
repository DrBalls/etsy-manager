import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TokenStore } from '../token-store';
import { app, safeStorage } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { OAuthTokens } from '@etsy-manager/shared';

// Mock electron modules
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/mock/user/data'),
  },
  safeStorage: {
    isEncryptionAvailable: vi.fn().mockReturnValue(true),
    encryptString: vi.fn((data) => Buffer.from(data, 'utf-8')),
    decryptString: vi.fn((data) => data.toString('utf-8')),
  },
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    writeFile: vi.fn(),
    readFile: vi.fn(),
    unlink: vi.fn(),
    access: vi.fn(),
  },
}));

describe('TokenStore', () => {
  let tokenStore: TokenStore;
  const mockUserId = 'user-123';
  const mockTokens: OAuthTokens = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresAt: new Date('2024-12-31T00:00:00Z'),
    tokenType: 'Bearer',
    scope: 'email_r shops_r',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    tokenStore = new TokenStore();
  });

  describe('saveTokens', () => {
    it('should save tokens with encryption', async () => {
      (fs.readFile as any).mockRejectedValue(new Error('File not found'));
      (fs.writeFile as any).mockResolvedValue(undefined);

      await tokenStore.saveTokens(mockUserId, mockTokens);

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join('/mock/user/data', 'etsy-tokens.enc'),
        expect.any(Buffer)
      );

      // Verify data structure
      const writeCall = (fs.writeFile as any).mock.calls[0];
      const writtenData = JSON.parse(writeCall[1].toString());
      expect(writtenData[mockUserId]).toMatchObject({
        ...mockTokens,
        expiresAt: mockTokens.expiresAt.toISOString(),
      });
    });

    it('should update existing tokens', async () => {
      const existingData = {
        'other-user': {
          accessToken: 'other-token',
          refreshToken: 'other-refresh',
          expiresAt: '2024-06-30T00:00:00Z',
          tokenType: 'Bearer',
          scope: 'email_r',
        },
      };

      (fs.access as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockResolvedValue(
        Buffer.from(JSON.stringify(existingData))
      );
      (fs.writeFile as any).mockResolvedValue(undefined);

      await tokenStore.saveTokens(mockUserId, mockTokens);

      const writeCall = (fs.writeFile as any).mock.calls[0];
      const writtenData = JSON.parse(writeCall[1].toString());
      
      // Should preserve other user's tokens
      expect(writtenData['other-user']).toEqual(existingData['other-user']);
      // Should add new user's tokens
      expect(writtenData[mockUserId]).toBeDefined();
    });

    it('should handle encryption not available', async () => {
      (safeStorage.isEncryptionAvailable as any).mockReturnValue(false);
      (fs.readFile as any).mockRejectedValue(new Error('File not found'));
      (fs.writeFile as any).mockResolvedValue(undefined);

      await tokenStore.saveTokens(mockUserId, mockTokens);

      expect(safeStorage.encryptString).not.toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Buffer)
      );
    });
  });

  describe('getTokens', () => {
    it('should retrieve tokens for user', async () => {
      const storedData = {
        [mockUserId]: {
          ...mockTokens,
          expiresAt: mockTokens.expiresAt.toISOString(),
        },
      };

      (fs.access as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockResolvedValue(
        Buffer.from(JSON.stringify(storedData))
      );

      const result = await tokenStore.getTokens(mockUserId);

      expect(result).toMatchObject({
        ...mockTokens,
        expiresAt: expect.any(Date),
      });
      expect(result?.expiresAt.toISOString()).toBe(mockTokens.expiresAt.toISOString());
    });

    it('should return null if user not found', async () => {
      const storedData = {
        'other-user': {
          accessToken: 'other-token',
          refreshToken: 'other-refresh',
          expiresAt: '2024-06-30T00:00:00Z',
          tokenType: 'Bearer',
          scope: 'email_r',
        },
      };

      (fs.access as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockResolvedValue(
        Buffer.from(JSON.stringify(storedData))
      );

      const result = await tokenStore.getTokens(mockUserId);
      expect(result).toBeNull();
    });

    it('should return null if file does not exist', async () => {
      (fs.access as any).mockRejectedValue(new Error('File not found'));

      const result = await tokenStore.getTokens(mockUserId);
      expect(result).toBeNull();
    });
  });

  describe('deleteTokens', () => {
    it('should delete tokens for specific user', async () => {
      const storedData = {
        [mockUserId]: {
          ...mockTokens,
          expiresAt: mockTokens.expiresAt.toISOString(),
        },
        'other-user': {
          accessToken: 'other-token',
          refreshToken: 'other-refresh',
          expiresAt: '2024-06-30T00:00:00Z',
          tokenType: 'Bearer',
          scope: 'email_r',
        },
      };

      (fs.access as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockResolvedValue(
        Buffer.from(JSON.stringify(storedData))
      );
      (fs.writeFile as any).mockResolvedValue(undefined);

      await tokenStore.deleteTokens(mockUserId);

      const writeCall = (fs.writeFile as any).mock.calls[0];
      const writtenData = JSON.parse(writeCall[1].toString());
      
      expect(writtenData[mockUserId]).toBeUndefined();
      expect(writtenData['other-user']).toBeDefined();
    });
  });

  describe('hasValidTokens', () => {
    it('should return true for valid tokens', async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      const validTokens = {
        ...mockTokens,
        expiresAt: futureDate,
      };

      const storedData = {
        [mockUserId]: {
          ...validTokens,
          expiresAt: futureDate.toISOString(),
        },
      };

      (fs.access as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockResolvedValue(
        Buffer.from(JSON.stringify(storedData))
      );

      const result = await tokenStore.hasValidTokens(mockUserId);
      expect(result).toBe(true);
    });

    it('should return false for expired tokens', async () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      const expiredTokens = {
        ...mockTokens,
        expiresAt: pastDate,
      };

      const storedData = {
        [mockUserId]: {
          ...expiredTokens,
          expiresAt: pastDate.toISOString(),
        },
      };

      (fs.access as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockResolvedValue(
        Buffer.from(JSON.stringify(storedData))
      );

      const result = await tokenStore.hasValidTokens(mockUserId);
      expect(result).toBe(false);
    });

    it('should return false if no tokens found', async () => {
      (fs.access as any).mockRejectedValue(new Error('File not found'));

      const result = await tokenStore.hasValidTokens(mockUserId);
      expect(result).toBe(false);
    });
  });

  describe('clearAll', () => {
    it('should delete the token file', async () => {
      (fs.unlink as any).mockResolvedValue(undefined);

      await tokenStore.clearAll();

      expect(fs.unlink).toHaveBeenCalledWith(
        path.join('/mock/user/data', 'etsy-tokens.enc')
      );
    });

    it('should not throw if file does not exist', async () => {
      (fs.unlink as any).mockRejectedValue(new Error('File not found'));

      await expect(tokenStore.clearAll()).resolves.not.toThrow();
    });
  });
});