import { extensionAuth } from './auth/etsy-auth';

export type MessageType =
  | { type: 'AUTH_CONNECT' }
  | { type: 'AUTH_DISCONNECT' }
  | { type: 'AUTH_CHECK' }
  | { type: 'GET_USER_INFO' }
  | { type: 'GET_ACCESS_TOKEN' };

export type MessageResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener(
  (message: MessageType, sender, sendResponse) => {
    handleMessage(message)
      .then((response) => sendResponse(response))
      .catch((error) =>
        sendResponse({
          success: false,
          error: error.message || 'Unknown error',
        })
      );

    // Return true to indicate async response
    return true;
  }
);

async function handleMessage(message: MessageType): Promise<MessageResponse> {
  switch (message.type) {
    case 'AUTH_CONNECT':
      try {
        const tokens = await extensionAuth.authenticate();
        return {
          success: true,
          data: { connected: true },
        };
      } catch (error) {
        throw error;
      }

    case 'AUTH_DISCONNECT':
      await extensionAuth.disconnect();
      return {
        success: true,
        data: { connected: false },
      };

    case 'AUTH_CHECK':
      const isAuthenticated = await extensionAuth.isAuthenticated();
      return {
        success: true,
        data: { authenticated: isAuthenticated },
      };

    case 'GET_USER_INFO':
      const result = await chrome.storage.local.get('etsy_user');
      return {
        success: true,
        data: result.etsy_user || null,
      };

    case 'GET_ACCESS_TOKEN':
      try {
        const accessToken = await extensionAuth.getValidAccessToken();
        return {
          success: true,
          data: { accessToken },
        };
      } catch (error) {
        throw error;
      }

    default:
      throw new Error('Unknown message type');
  }
}

// Handle extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
  } else if (details.reason === 'update') {
    console.log('Extension updated');
  }
});

// Handle auth state changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.etsy_tokens) {
    const isConnected = !!changes.etsy_tokens.newValue;
    
    // Update extension icon based on auth state
    chrome.action.setIcon({
      path: {
        16: isConnected ? 'icons/icon-16-connected.png' : 'icons/icon-16.png',
        32: isConnected ? 'icons/icon-32-connected.png' : 'icons/icon-32.png',
        48: isConnected ? 'icons/icon-48-connected.png' : 'icons/icon-48.png',
        128: isConnected ? 'icons/icon-128-connected.png' : 'icons/icon-128.png',
      },
    });

    // Update badge
    chrome.action.setBadgeText({
      text: isConnected ? '✓' : '',
    });

    chrome.action.setBadgeBackgroundColor({
      color: '#00b34b',
    });
  }
});