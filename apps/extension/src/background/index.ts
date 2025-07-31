import { Storage } from '@plasmohq/storage';
import type { PlasmoMessaging } from '@plasmohq/messaging';

// Initialize storage
const storage = new Storage();

// Background service worker
console.log('Etsy Store Manager extension loaded');

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
    // Set default settings
    storage.set('settings', {
      autoSync: true,
      notifications: true,
      syncInterval: 30, // minutes
    });
  } else if (details.reason === 'update') {
    console.log('Extension updated');
  }
});

// Create context menu items
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'quick-edit-listing',
    title: 'Quick Edit Listing',
    contexts: ['page'],
    documentUrlPatterns: ['https://www.etsy.com/listing/*'],
  });

  chrome.contextMenus.create({
    id: 'sync-listing',
    title: 'Sync This Listing',
    contexts: ['page'],
    documentUrlPatterns: ['https://www.etsy.com/listing/*'],
  });

  chrome.contextMenus.create({
    id: 'analyze-competition',
    title: 'Analyze Competition',
    contexts: ['page'],
    documentUrlPatterns: ['https://www.etsy.com/search*'],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'quick-edit-listing':
      handleQuickEdit(tab);
      break;
    case 'sync-listing':
      handleSyncListing(tab);
      break;
    case 'analyze-competition':
      handleAnalyzeCompetition(tab);
      break;
  }
});

// Handle messages from content scripts
export const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  switch (req.name) {
    case 'get-auth-token':
      const token = await storage.get('authToken');
      res.send({ token });
      break;
    case 'save-auth-token':
      await storage.set('authToken', req.body.token);
      res.send({ success: true });
      break;
    case 'get-settings':
      const settings = await storage.get('settings');
      res.send({ settings });
      break;
    case 'update-settings':
      await storage.set('settings', req.body.settings);
      res.send({ success: true });
      break;
    default:
      res.send({ error: 'Unknown message' });
  }
};

// Helper functions
async function handleQuickEdit(tab: chrome.tabs.Tab) {
  if (!tab.id || !tab.url) return;

  // Extract listing ID from URL
  const listingId = extractListingId(tab.url);
  if (!listingId) return;

  // Open side panel or popup for quick editing
  chrome.tabs.sendMessage(tab.id, {
    action: 'open-quick-edit',
    listingId,
  });
}

async function handleSyncListing(tab: chrome.tabs.Tab) {
  if (!tab.id || !tab.url) return;

  const listingId = extractListingId(tab.url);
  if (!listingId) return;

  // Send sync request to content script
  chrome.tabs.sendMessage(tab.id, {
    action: 'sync-listing',
    listingId,
  });
}

async function handleAnalyzeCompetition(tab: chrome.tabs.Tab) {
  if (!tab.id) return;

  // Inject competition analyzer
  chrome.tabs.sendMessage(tab.id, {
    action: 'analyze-competition',
  });
}

function extractListingId(url: string): string | null {
  const match = url.match(/\/listing\/(\d+)/);
  return match ? match[1] : null;
}

// Set up alarm for periodic sync
chrome.alarms.create('sync-data', { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'sync-data') {
    const settings = await storage.get('settings');
    if (settings?.autoSync) {
      // Perform sync
      console.log('Performing periodic sync...');
      // TODO: Implement sync logic
    }
  }
});

// Listen for tab updates to inject content scripts
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('etsy.com')) {
      // Inject content script if on Etsy
      chrome.tabs.sendMessage(tabId, { action: 'page-loaded' });
    }
  }
});