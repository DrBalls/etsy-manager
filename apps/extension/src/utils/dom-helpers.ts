/**
 * DOM helper utilities for interacting with Etsy pages
 */

export const DOMHelpers = {
  /**
   * Wait for an element to appear in the DOM
   */
  waitForElement(selector: string, timeout = 5000): Promise<Element | null> {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  },

  /**
   * Extract listing data from a listing page
   */
  extractListingData() {
    const data: any = {};

    // Title
    const titleEl = document.querySelector('h1[data-buy-box-listing-title]');
    data.title = titleEl?.textContent?.trim() || '';

    // Price
    const priceEl = document.querySelector('.wt-text-title-larger[data-buy-box-region="price"] .currency-value');
    data.price = priceEl?.textContent?.trim() || '';

    // Description
    const descEl = document.querySelector('[data-product-details-description-text-content]');
    data.description = descEl?.textContent?.trim() || '';

    // Images
    const imageEls = document.querySelectorAll('[data-listing-image-list] img');
    data.images = Array.from(imageEls).map(img => (img as HTMLImageElement).src);

    // Tags
    const tagEls = document.querySelectorAll('[data-listing-tag]');
    data.tags = Array.from(tagEls).map(tag => tag.textContent?.trim() || '');

    // Stock
    const stockEl = document.querySelector('[data-buy-box-quantity-input]');
    data.quantity = stockEl ? parseInt((stockEl as HTMLInputElement).max || '1') : null;

    // Reviews
    const reviewCountEl = document.querySelector('[data-reviews-tab] span');
    data.reviewCount = reviewCountEl ? parseInt(reviewCountEl.textContent?.match(/\d+/)?.[0] || '0') : 0;

    return data;
  },

  /**
   * Extract order data from orders page
   */
  extractOrderData() {
    const orders: any[] = [];
    const orderEls = document.querySelectorAll('.order-item');

    orderEls.forEach(orderEl => {
      const order: any = {};

      // Order number
      const orderNumEl = orderEl.querySelector('.order-number');
      order.orderNumber = orderNumEl?.textContent?.trim() || '';

      // Customer
      const customerEl = orderEl.querySelector('.buyer-name');
      order.customerName = customerEl?.textContent?.trim() || '';

      // Date
      const dateEl = orderEl.querySelector('.order-date');
      order.date = dateEl?.textContent?.trim() || '';

      // Status
      const statusEl = orderEl.querySelector('.order-status');
      order.status = statusEl?.textContent?.trim() || '';

      // Total
      const totalEl = orderEl.querySelector('.order-total .currency-value');
      order.total = totalEl?.textContent?.trim() || '';

      orders.push(order);
    });

    return orders;
  },

  /**
   * Check if user is on a specific Etsy page
   */
  isOnPage(pageType: 'listing' | 'dashboard' | 'orders' | 'listings-manager'): boolean {
    const url = window.location.href;
    
    switch (pageType) {
      case 'listing':
        return url.includes('/listing/');
      case 'dashboard':
        return url.includes('/your/shops/me/dashboard');
      case 'orders':
        return url.includes('/your/shops/me/orders');
      case 'listings-manager':
        return url.includes('/your/shops/me/tools/listings');
      default:
        return false;
    }
  },

  /**
   * Get listing ID from URL
   */
  getListingIdFromUrl(): string | null {
    const match = window.location.href.match(/\/listing\/(\d+)/);
    return match ? match[1] : null;
  },

  /**
   * Insert element after reference element
   */
  insertAfter(newElement: Element, referenceElement: Element) {
    referenceElement.parentNode?.insertBefore(newElement, referenceElement.nextSibling);
  },

  /**
   * Create element from HTML string
   */
  createElement(html: string): Element {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstElementChild!;
  },

  /**
   * Add styles to page
   */
  addStyles(css: string) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  },

  /**
   * Show notification
   */
  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const notification = this.createElement(`
      <div class="esm-notification esm-notification-${type}">
        <div class="esm-notification-content">
          <span class="esm-notification-icon">
            ${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}
          </span>
          <span class="esm-notification-message">${message}</span>
        </div>
      </div>
    `);

    document.body.appendChild(notification);

    // Add styles if not already added
    if (!document.querySelector('#esm-notification-styles')) {
      this.addStyles(`
        #esm-notification-styles { display: none; }
        .esm-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: white;
          border: 1px solid #e1e3df;
          border-radius: 6px;
          padding: 12px 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          z-index: 10001;
          animation: slideIn 0.3s ease-out;
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .esm-notification-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .esm-notification-icon {
          font-size: 18px;
          font-weight: bold;
        }
        .esm-notification-success .esm-notification-icon { color: #4caf50; }
        .esm-notification-error .esm-notification-icon { color: #f44336; }
        .esm-notification-info .esm-notification-icon { color: #2196f3; }
        .esm-notification-message {
          font-size: 14px;
          color: #222;
        }
      `);
      const styleMarker = this.createElement('<div id="esm-notification-styles"></div>');
      document.body.appendChild(styleMarker);
    }

    // Remove notification after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  },
};