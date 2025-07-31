import { BrowserWindow, shell, session } from 'electron';
import { EtsyOAuthClient, OAuthTokens, retryOAuthOperation } from '@etsy-manager/shared';
import { createServer, Server } from 'http';
import { URL } from 'url';
import { tokenStore } from '../services/token-store';

const CALLBACK_PORT = 42069;
const CALLBACK_PATH = '/auth/callback';
const CALLBACK_URL = `http://localhost:${CALLBACK_PORT}${CALLBACK_PATH}`;

export class DesktopEtsyAuth {
  private client: EtsyOAuthClient;
  private server: Server | null = null;
  private authWindow: BrowserWindow | null = null;

  constructor() {
    this.client = new EtsyOAuthClient({
      clientId: process.env.ETSY_CLIENT_ID!,
      clientSecret: process.env.ETSY_CLIENT_SECRET!,
      redirectUri: CALLBACK_URL,
    });
  }

  /**
   * Start OAuth flow in external browser
   */
  async authenticate(): Promise<OAuthTokens> {
    return new Promise((resolve, reject) => {
      // Generate PKCE and state
      const { codeVerifier, codeChallenge } = this.client.generatePKCE();
      const state = this.client.generateState();

      // Start local server to handle callback
      this.startCallbackServer(codeVerifier, state, resolve, reject);

      // Get authorization URL
      const authUrl = this.client.getAuthorizationUrl({ state });

      // Open in external browser
      shell.openExternal(authUrl);
    });
  }

  /**
   * Start OAuth flow in embedded window
   */
  async authenticateInWindow(): Promise<OAuthTokens> {
    return new Promise((resolve, reject) => {
      // Generate PKCE and state
      const { codeVerifier, codeChallenge } = this.client.generatePKCE();
      const state = this.client.generateState();

      // Create auth window
      this.authWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
        autoHideMenuBar: true,
      });

      // Get authorization URL
      const authUrl = this.client.getAuthorizationUrl({ state });

      // Handle navigation
      this.authWindow.webContents.on('will-navigate', async (event, url) => {
        if (url.startsWith(CALLBACK_URL)) {
          event.preventDefault();
          
          try {
            const tokens = await this.handleCallbackUrl(url, codeVerifier, state);
            resolve(tokens);
            this.cleanup();
          } catch (error) {
            reject(error);
            this.cleanup();
          }
        }
      });

      // Handle window closed
      this.authWindow.on('closed', () => {
        this.authWindow = null;
        reject(new Error('Authentication window was closed'));
      });

      // Clear session data
      session.defaultSession.clearStorageData();

      // Load auth URL
      this.authWindow.loadURL(authUrl);
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
   * Get valid access token for user
   */
  async getValidAccessToken(userId: string): Promise<string> {
    const tokens = await tokenStore.getTokens(userId);
    
    if (!tokens) {
      throw new Error('No tokens found for user');
    }

    // Check if token is expired or about to expire
    const now = new Date();
    const expiryBuffer = 5 * 60 * 1000; // 5 minutes
    const tokenExpired = tokens.expiresAt.getTime() - now.getTime() < expiryBuffer;

    if (tokenExpired) {
      const newTokens = await this.refreshToken(tokens.refreshToken);
      await tokenStore.saveTokens(userId, newTokens);
      return newTokens.accessToken;
    }

    return tokens.accessToken;
  }

  /**
   * Start local server to handle OAuth callback
   */
  private startCallbackServer(
    codeVerifier: string,
    expectedState: string,
    resolve: (tokens: OAuthTokens) => void,
    reject: (error: Error) => void
  ): void {
    this.server = createServer(async (req, res) => {
      const url = new URL(req.url!, `http://localhost:${CALLBACK_PORT}`);
      
      if (url.pathname === CALLBACK_PATH) {
        try {
          const tokens = await this.handleCallbackUrl(
            url.toString(),
            codeVerifier,
            expectedState
          );

          // Send success response
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <head>
                <title>Authentication Successful</title>
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background: #f5f5f5;
                  }
                  .message {
                    text-align: center;
                    padding: 40px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  }
                  h1 { color: #00b34b; }
                  p { color: #666; }
                </style>
              </head>
              <body>
                <div class="message">
                  <h1>✓ Authentication Successful</h1>
                  <p>You can close this window and return to the application.</p>
                </div>
              </body>
            </html>
          `);

          resolve(tokens);
          this.cleanup();
        } catch (error) {
          // Send error response
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <head>
                <title>Authentication Failed</title>
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background: #f5f5f5;
                  }
                  .message {
                    text-align: center;
                    padding: 40px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  }
                  h1 { color: #e74c3c; }
                  p { color: #666; }
                </style>
              </head>
              <body>
                <div class="message">
                  <h1>✗ Authentication Failed</h1>
                  <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
                  <p>Please try again.</p>
                </div>
              </body>
            </html>
          `);

          reject(error instanceof Error ? error : new Error('Authentication failed'));
          this.cleanup();
        }
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    this.server.listen(CALLBACK_PORT);
    
    // Set timeout for server
    setTimeout(() => {
      if (this.server) {
        reject(new Error('Authentication timeout'));
        this.cleanup();
      }
    }, 5 * 60 * 1000); // 5 minutes
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

    return retryOAuthOperation(
      () => this.client.exchangeCodeForTokens(code, codeVerifier),
      'Token exchange'
    );
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }

    if (this.authWindow && !this.authWindow.isDestroyed()) {
      this.authWindow.close();
      this.authWindow = null;
    }
  }
}

export const desktopAuth = new DesktopEtsyAuth();