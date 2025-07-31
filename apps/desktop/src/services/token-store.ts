import { safeStorage } from 'electron';
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { OAuthTokens } from '@etsy-manager/shared';

const TOKEN_FILE_NAME = 'etsy-tokens.enc';

export class TokenStore {
  private tokensPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.tokensPath = path.join(userDataPath, TOKEN_FILE_NAME);
  }

  /**
   * Save tokens securely
   */
  async saveTokens(userId: string, tokens: OAuthTokens): Promise<void> {
    try {
      // Read existing tokens
      const allTokens = await this.getAllTokens();
      
      // Update tokens for user
      allTokens[userId] = {
        ...tokens,
        expiresAt: tokens.expiresAt.toISOString(),
      };

      // Encrypt and save
      const data = JSON.stringify(allTokens);
      const encrypted = safeStorage.isEncryptionAvailable()
        ? safeStorage.encryptString(data)
        : Buffer.from(data);

      await fs.writeFile(this.tokensPath, encrypted);
    } catch (error) {
      console.error('Failed to save tokens:', error);
      throw new Error('Failed to save authentication tokens');
    }
  }

  /**
   * Get tokens for a user
   */
  async getTokens(userId: string): Promise<OAuthTokens | null> {
    try {
      const allTokens = await this.getAllTokens();
      const userTokens = allTokens[userId];

      if (!userTokens) {
        return null;
      }

      return {
        ...userTokens,
        expiresAt: new Date(userTokens.expiresAt),
      };
    } catch (error) {
      console.error('Failed to get tokens:', error);
      return null;
    }
  }

  /**
   * Delete tokens for a user
   */
  async deleteTokens(userId: string): Promise<void> {
    try {
      const allTokens = await this.getAllTokens();
      delete allTokens[userId];

      const data = JSON.stringify(allTokens);
      const encrypted = safeStorage.isEncryptionAvailable()
        ? safeStorage.encryptString(data)
        : Buffer.from(data);

      await fs.writeFile(this.tokensPath, encrypted);
    } catch (error) {
      console.error('Failed to delete tokens:', error);
      throw new Error('Failed to delete authentication tokens');
    }
  }

  /**
   * Check if user has valid tokens
   */
  async hasValidTokens(userId: string): Promise<boolean> {
    const tokens = await this.getTokens(userId);
    
    if (!tokens) {
      return false;
    }

    // Check if token is expired
    const now = new Date();
    return tokens.expiresAt > now;
  }

  /**
   * Get all tokens (internal use)
   */
  private async getAllTokens(): Promise<Record<string, any>> {
    try {
      const exists = await fs.access(this.tokensPath)
        .then(() => true)
        .catch(() => false);

      if (!exists) {
        return {};
      }

      const encrypted = await fs.readFile(this.tokensPath);
      const decrypted = safeStorage.isEncryptionAvailable()
        ? safeStorage.decryptString(encrypted)
        : encrypted.toString();

      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to read tokens:', error);
      return {};
    }
  }

  /**
   * Clear all tokens (for development/testing)
   */
  async clearAll(): Promise<void> {
    try {
      await fs.unlink(this.tokensPath);
    } catch (error) {
      // File might not exist
    }
  }
}

export const tokenStore = new TokenStore();