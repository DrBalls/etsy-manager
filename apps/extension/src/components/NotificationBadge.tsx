import React, { useState, useEffect } from 'react';
import { Storage } from '@plasmohq/storage';

const storage = new Storage();

interface NotificationBadgeProps {
  type: 'orders' | 'messages' | 'alerts';
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ type }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    loadNotificationCount();
    
    // Listen for updates
    const interval = setInterval(loadNotificationCount, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [type]);

  const loadNotificationCount = async () => {
    const notifications = await storage.get(`notifications_${type}`);
    setCount(notifications?.count || 0);
  };

  if (count === 0) return null;

  return (
    <div className="notification-badge">
      <span className="count">{count > 99 ? '99+' : count}</span>

      <style jsx>{`
        .notification-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #d73502;
          color: white;
          border-radius: 10px;
          padding: 2px 6px;
          font-size: 11px;
          font-weight: bold;
          min-width: 20px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        .count {
          display: block;
          line-height: 1;
        }
      `}</style>
    </div>
  );
};