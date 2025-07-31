import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://www.etsy.com/*"],
  world: "MAIN"
}

// This content script runs in the main world (page context)
// It has access to the page's JavaScript variables and functions

window.addEventListener("load", () => {
  // Inject our enhancement scripts
  const script = document.createElement("script");
  script.textContent = `
    // Etsy Store Manager Enhancement Script
    (function() {
      // Hook into Etsy's AJAX requests
      const originalXHR = window.XMLHttpRequest;
      window.XMLHttpRequest = function() {
        const xhr = new originalXHR();
        const originalOpen = xhr.open;
        const originalSend = xhr.send;
        
        xhr.open = function(method, url, ...args) {
          xhr._url = url;
          xhr._method = method;
          return originalOpen.apply(xhr, [method, url, ...args]);
        };
        
        xhr.send = function(body) {
          // Intercept interesting requests
          if (xhr._url && xhr._url.includes('/api/v3/ajax/shop')) {
            xhr.addEventListener('load', function() {
              window.postMessage({
                type: 'ETSY_API_RESPONSE',
                url: xhr._url,
                data: xhr.responseText
              }, '*');
            });
          }
          
          return originalSend.apply(xhr, [body]);
        };
        
        return xhr;
      };

      // Expose shop data if available
      if (window.Etsy && window.Etsy.Context) {
        window.postMessage({
          type: 'ETSY_CONTEXT_DATA',
          data: {
            shopId: window.Etsy.Context.shop_id,
            shopName: window.Etsy.Context.shop_name,
            userId: window.Etsy.Context.user_id,
            locale: window.Etsy.Context.locale,
            currency: window.Etsy.Context.currency
          }
        }, '*');
      }

      // Add helper functions for page enhancements
      window.EtsyStoreManager = {
        getListingData: function() {
          const data = {};
          
          // Extract listing ID from URL
          const match = window.location.pathname.match(/\\/listing\\/(\\d+)/);
          if (match) {
            data.listingId = match[1];
          }
          
          // Extract more data from the page
          const priceEl = document.querySelector('[data-buy-box-region="price"] .currency-value');
          if (priceEl) {
            data.price = priceEl.textContent;
          }
          
          const titleEl = document.querySelector('h1[data-buy-box-listing-title]');
          if (titleEl) {
            data.title = titleEl.textContent.trim();
          }
          
          return data;
        },
        
        highlightListing: function(listingEl) {
          listingEl.style.border = '2px solid #f1641e';
          listingEl.style.borderRadius = '8px';
          listingEl.style.transition = 'all 0.3s';
        },
        
        addQuickAction: function(listingEl, action) {
          const button = document.createElement('button');
          button.className = 'esm-quick-action';
          button.textContent = action.label;
          button.onclick = action.handler;
          
          const container = listingEl.querySelector('.v2-listing-card__info');
          if (container) {
            container.appendChild(button);
          }
        }
      };

      console.log('Etsy Store Manager enhancement script loaded');
    })();
  `;
  
  document.head.appendChild(script);
});

// Listen for messages from the page
window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  
  if (event.data.type === "ETSY_CONTEXT_DATA") {
    // Store Etsy context data
    chrome.storage.local.set({ etsyContext: event.data.data });
  }
  
  if (event.data.type === "ETSY_API_RESPONSE") {
    // Process API responses if needed
    console.log("Intercepted Etsy API response:", event.data.url);
  }
});