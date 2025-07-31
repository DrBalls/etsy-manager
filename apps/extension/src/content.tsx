import type { PlasmoCSConfig } from 'plasmo';

export const config: PlasmoCSConfig = {
  matches: ['https://*.etsy.com/*'],
  css: ['content.css'],
};

// Inject a small widget on Etsy pages
const observer = new MutationObserver(() => {
  // Check if we're on a shop management page
  if (window.location.pathname.includes('/your/shops')) {
    injectQuickActions();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

function injectQuickActions() {
  // Placeholder for quick actions overlay
  // Ready to enhance shop management - implementation coming soon
}
