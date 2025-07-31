import type { PlasmoCSConfig } from 'plasmo';
import { useMessage } from '@plasmohq/messaging/hook';
import { useStorage } from '@plasmohq/storage/hook';

export const config: PlasmoCSConfig = {
  matches: ['https://*.etsy.com/*'],
  world: 'MAIN',
};

// Content script that runs on Etsy pages
const EtsyEnhancer = () => {
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case 'open-quick-edit':
        openQuickEditPanel(message.listingId);
        break;
      case 'sync-listing':
        syncListing(message.listingId);
        break;
      case 'analyze-competition':
        analyzeCompetition();
        break;
      case 'page-loaded':
        enhanceEtsyPage();
        break;
    }
  });

  return null; // Content scripts don't render anything
};

// Enhance Etsy pages with additional features
function enhanceEtsyPage() {
  const url = window.location.href;

  if (url.includes('/your/shops/me/dashboard')) {
    enhanceDashboard();
  } else if (url.includes('/listing/')) {
    enhanceListingPage();
  } else if (url.includes('/your/shops/me/tools/listings')) {
    enhanceListingsManager();
  } else if (url.includes('/your/shops/me/orders/sold')) {
    enhanceOrdersPage();
  }
}

// Add features to Etsy dashboard
function enhanceDashboard() {
  // Add quick stats widget
  const dashboardContainer = document.querySelector('.shop-home-header');
  if (dashboardContainer && !document.querySelector('.esm-quick-stats')) {
    const statsWidget = createStatsWidget();
    dashboardContainer.appendChild(statsWidget);
  }
}

// Enhance individual listing pages
function enhanceListingPage() {
  // Add quick actions toolbar
  const listingHeader = document.querySelector('.listing-page-header');
  if (listingHeader && !document.querySelector('.esm-toolbar')) {
    const toolbar = createListingToolbar();
    listingHeader.appendChild(toolbar);
  }

  // Add competitor price analysis
  addPriceAnalysis();
}

// Enhance listings manager
function enhanceListingsManager() {
  // Add bulk actions
  const listingsTable = document.querySelector('.listings-table');
  if (listingsTable && !document.querySelector('.esm-bulk-actions')) {
    const bulkActions = createBulkActions();
    listingsTable.parentElement?.insertBefore(bulkActions, listingsTable);
  }

  // Add inline editing
  enableInlineEditing();
}

// Enhance orders page
function enhanceOrdersPage() {
  // Add order filters
  const ordersHeader = document.querySelector('.orders-header');
  if (ordersHeader && !document.querySelector('.esm-order-filters')) {
    const filters = createOrderFilters();
    ordersHeader.appendChild(filters);
  }

  // Add bulk order processing
  addBulkOrderActions();
}

// Create stats widget for dashboard
function createStatsWidget(): HTMLElement {
  const widget = document.createElement('div');
  widget.className = 'esm-quick-stats';
  widget.style.cssText = `
    background: white;
    border: 1px solid #e1e3df;
    border-radius: 8px;
    padding: 16px;
    margin-top: 16px;
  `;

  widget.innerHTML = `
    <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">
      Store Manager Quick Stats
    </h3>
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
      <div>
        <div style="font-size: 24px; font-weight: 600;">--</div>
        <div style="font-size: 12px; color: #595959;">Views Today</div>
      </div>
      <div>
        <div style="font-size: 24px; font-weight: 600;">--</div>
        <div style="font-size: 12px; color: #595959;">Conversion Rate</div>
      </div>
      <div>
        <div style="font-size: 24px; font-weight: 600;">--</div>
        <div style="font-size: 12px; color: #595959;">Avg Order Value</div>
      </div>
      <div>
        <div style="font-size: 24px; font-weight: 600;">--</div>
        <div style="font-size: 12px; color: #595959;">Revenue Today</div>
      </div>
    </div>
    <button id="esm-load-stats" style="
      margin-top: 12px;
      padding: 6px 12px;
      background: #f1641e;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    ">Load Real-time Stats</button>
  `;

  // Add click handler
  widget.querySelector('#esm-load-stats')?.addEventListener('click', loadDashboardStats);

  return widget;
}

// Create toolbar for listing pages
function createListingToolbar(): HTMLElement {
  const toolbar = document.createElement('div');
  toolbar.className = 'esm-toolbar';
  toolbar.style.cssText = `
    background: #f5f5f5;
    border: 1px solid #e1e3df;
    border-radius: 4px;
    padding: 8px;
    margin-top: 16px;
    display: flex;
    gap: 8px;
  `;

  const buttons = [
    { text: 'Quick Edit', action: 'quick-edit' },
    { text: 'Sync to Manager', action: 'sync' },
    { text: 'Price Analysis', action: 'price-analysis' },
    { text: 'SEO Check', action: 'seo-check' },
  ];

  buttons.forEach(button => {
    const btn = document.createElement('button');
    btn.textContent = button.text;
    btn.style.cssText = `
      padding: 6px 12px;
      background: white;
      border: 1px solid #e1e3df;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    btn.addEventListener('click', () => handleToolbarAction(button.action));
    toolbar.appendChild(btn);
  });

  return toolbar;
}

// Create bulk actions for listings manager
function createBulkActions(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'esm-bulk-actions';
  container.style.cssText = `
    background: #f5f5f5;
    border: 1px solid #e1e3df;
    border-radius: 4px;
    padding: 12px;
    margin-bottom: 16px;
  `;

  container.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <input type="checkbox" id="esm-select-all" />
      <label for="esm-select-all">Select All</label>
      <select id="esm-bulk-action" style="padding: 4px 8px;">
        <option value="">Bulk Actions</option>
        <option value="activate">Activate</option>
        <option value="deactivate">Deactivate</option>
        <option value="edit-price">Edit Prices</option>
        <option value="edit-tags">Edit Tags</option>
        <option value="export">Export to CSV</option>
      </select>
      <button id="esm-apply-bulk" style="
        padding: 6px 12px;
        background: #f1641e;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      ">Apply</button>
    </div>
  `;

  // Add event handlers
  container.querySelector('#esm-select-all')?.addEventListener('change', toggleSelectAll);
  container.querySelector('#esm-apply-bulk')?.addEventListener('click', applyBulkAction);

  return container;
}

// Create order filters
function createOrderFilters(): HTMLElement {
  const filters = document.createElement('div');
  filters.className = 'esm-order-filters';
  filters.style.cssText = `
    display: flex;
    gap: 12px;
    margin-top: 12px;
    flex-wrap: wrap;
  `;

  filters.innerHTML = `
    <select style="padding: 6px 12px; border: 1px solid #e1e3df; border-radius: 4px;">
      <option value="">All Orders</option>
      <option value="pending">Pending</option>
      <option value="processing">Processing</option>
      <option value="shipped">Shipped</option>
      <option value="completed">Completed</option>
    </select>
    <input type="date" placeholder="From Date" style="padding: 6px 12px; border: 1px solid #e1e3df; border-radius: 4px;" />
    <input type="date" placeholder="To Date" style="padding: 6px 12px; border: 1px solid #e1e3df; border-radius: 4px;" />
    <button style="
      padding: 6px 12px;
      background: #f1641e;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    ">Filter</button>
    <button style="
      padding: 6px 12px;
      background: white;
      border: 1px solid #e1e3df;
      border-radius: 4px;
      cursor: pointer;
    ">Export Orders</button>
  `;

  return filters;
}

// Helper functions
function openQuickEditPanel(listingId: string) {
  console.log('Opening quick edit for listing:', listingId);
  // TODO: Implement quick edit panel
}

function syncListing(listingId: string) {
  console.log('Syncing listing:', listingId);
  // TODO: Implement listing sync
}

function analyzeCompetition() {
  console.log('Analyzing competition...');
  // TODO: Implement competition analysis
}

function loadDashboardStats() {
  console.log('Loading dashboard stats...');
  // TODO: Fetch and display real stats
}

function handleToolbarAction(action: string) {
  console.log('Toolbar action:', action);
  // TODO: Implement toolbar actions
}

function addPriceAnalysis() {
  console.log('Adding price analysis...');
  // TODO: Implement price analysis
}

function enableInlineEditing() {
  console.log('Enabling inline editing...');
  // TODO: Implement inline editing
}

function addBulkOrderActions() {
  console.log('Adding bulk order actions...');
  // TODO: Implement bulk order actions
}

function toggleSelectAll(event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  console.log('Toggle select all:', checked);
  // TODO: Implement select all
}

function applyBulkAction() {
  const action = (document.querySelector('#esm-bulk-action') as HTMLSelectElement)?.value;
  console.log('Applying bulk action:', action);
  // TODO: Implement bulk actions
}

export default EtsyEnhancer;