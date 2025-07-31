import React from 'react';
import { sendToBackground } from '@plasmohq/messaging';

interface ListingToolbarProps {
  listingId: string;
}

export const ListingToolbar: React.FC<ListingToolbarProps> = ({ listingId }) => {
  const handleQuickEdit = () => {
    // Open quick edit panel
    const event = new CustomEvent('esm:openQuickEdit', { detail: { listingId } });
    window.dispatchEvent(event);
  };

  const handleSync = async () => {
    try {
      const response = await sendToBackground({
        name: "sync-listing",
        body: { listingId }
      });

      if (response.success) {
        showNotification('Listing synced successfully', 'success');
      } else {
        showNotification('Failed to sync listing', 'error');
      }
    } catch (error) {
      showNotification('Error syncing listing', 'error');
    }
  };

  const handleAnalytics = () => {
    // Open analytics in new tab
    chrome.runtime.sendMessage({
      type: 'OPEN_ANALYTICS',
      listingId
    });
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    const notification = document.createElement('div');
    notification.className = `esm-notification esm-notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  return (
    <div className="esm-listing-toolbar">
      <button className="esm-btn esm-btn-primary" onClick={handleQuickEdit}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        Quick Edit
      </button>
      
      <button className="esm-btn" onClick={handleSync}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 8C2 4.686 4.686 2 8 2C10.21 2 12.098 3.32 12.949 5.25M14 8C14 11.314 11.314 14 8 14C5.79 14 3.902 12.68 3.051 10.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M10 5H13V2M6 11H3V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Sync
      </button>
      
      <button className="esm-btn" onClick={handleAnalytics}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 13L5 9L8 11L14 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Analytics
      </button>

      <style jsx>{`
        .esm-listing-toolbar {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          background: #f5f5f5;
          border: 1px solid #e1e3df;
          border-radius: 6px;
          margin: 16px 0;
        }

        .esm-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: white;
          border: 1px solid #e1e3df;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          color: #222;
          cursor: pointer;
          transition: all 0.2s;
        }

        .esm-btn:hover {
          background: #f5f5f5;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .esm-btn-primary {
          background: #f1641e;
          color: white;
          border-color: #f1641e;
        }

        .esm-btn-primary:hover {
          background: #d9531a;
        }

        .esm-btn svg {
          width: 16px;
          height: 16px;
        }

        .esm-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 16px;
          background: white;
          border: 1px solid #e1e3df;
          border-radius: 6px;
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

        .esm-notification-success {
          border-color: #4caf50;
          color: #4caf50;
        }

        .esm-notification-error {
          border-color: #f44336;
          color: #f44336;
        }
      `}</style>
    </div>
  );
};