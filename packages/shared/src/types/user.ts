export interface User {
  id: string;
  email: string;
  etsyUserId: string;
  name?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt?: Date;
  stripeCustomerId?: string;
  settings?: UserSettings;
}

export interface UserSettings {
  notifications: NotificationSettings;
  timezone: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
}

export interface NotificationSettings {
  email: {
    orderReceived: boolean;
    lowInventory: boolean;
    dailyReport: boolean;
    weeklyReport: boolean;
    marketingTips: boolean;
  };
  browser: {
    orderReceived: boolean;
    lowInventory: boolean;
    reviewReceived: boolean;
  };
}
