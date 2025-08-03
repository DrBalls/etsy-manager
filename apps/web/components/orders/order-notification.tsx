'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bell, Package, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface OrderNotification {
  id: string;
  type: 'new_order' | 'ship_by_soon' | 'overdue_shipment' | 'message_received';
  order: {
    id: string;
    orderNumber: string;
    buyerName: string;
    shipByDate?: Date;
  };
  message: string;
  createdAt: Date;
  read: boolean;
}

interface OrderNotificationCenterProps {
  shopId: string;
}

export function OrderNotificationCenter({ shopId }: OrderNotificationCenterProps) {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch initial notifications
    fetchNotifications();

    // Set up polling for new notifications
    const interval = setInterval(fetchNotifications, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [shopId]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/orders/notifications?shopId=${shopId}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n: OrderNotification) => !n.read).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/orders/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/orders/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      setNotifications(notifications.filter(n => n.id !== notificationId));
      if (!notifications.find(n => n.id === notificationId)?.read) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  const getNotificationIcon = (type: OrderNotification['type']) => {
    switch (type) {
      case 'new_order':
        return <Package className="h-4 w-4" />;
      case 'ship_by_soon':
      case 'overdue_shipment':
        return <AlertCircle className="h-4 w-4" />;
      case 'message_received':
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: OrderNotification['type']) => {
    switch (type) {
      case 'new_order':
        return 'bg-green-100 text-green-800';
      case 'ship_by_soon':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue_shipment':
        return 'bg-red-100 text-red-800';
      case 'message_received':
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-xs text-white flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Panel */}
      {showNotifications && (
        <Card className="absolute right-0 top-12 w-96 max-h-[500px] overflow-hidden shadow-lg z-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Order Notifications</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No notifications
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-muted/50 transition-colors ${
                        !notification.read ? 'bg-muted/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Badge className={getNotificationColor(notification.type)}>
                          {getNotificationIcon(notification.type)}
                        </Badge>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">
                            Order #{notification.order.orderNumber}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              Mark read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => dismissNotification(notification.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Urgent Alerts */}
      {notifications
        .filter(n => n.type === 'overdue_shipment' && !n.read)
        .slice(0, 3)
        .map((notification) => (
          <Alert key={notification.id} variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Overdue Shipment</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>
                Order #{notification.order.orderNumber} from {notification.order.buyerName} is overdue for shipment
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAsRead(notification.id)}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        ))}
    </>
  );
}