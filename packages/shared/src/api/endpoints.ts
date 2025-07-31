export const API_ENDPOINTS = {
  // Auth
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
    oauth: {
      etsy: '/auth/oauth/etsy',
      callback: '/auth/oauth/etsy/callback',
    },
  },

  // Users
  users: {
    profile: '/users/profile',
    settings: '/users/settings',
    subscription: '/users/subscription',
  },

  // Shops
  shops: {
    list: '/shops',
    get: (id: string) => `/shops/${id}`,
    create: '/shops',
    update: (id: string) => `/shops/${id}`,
    delete: (id: string) => `/shops/${id}`,
    sync: (id: string) => `/shops/${id}/sync`,
    stats: (id: string) => `/shops/${id}/stats`,
  },

  // Listings
  listings: {
    list: '/listings',
    get: (id: string) => `/listings/${id}`,
    create: '/listings',
    update: (id: string) => `/listings/${id}`,
    delete: (id: string) => `/listings/${id}`,
    bulkUpdate: '/listings/bulk-update',
    analytics: (id: string) => `/listings/${id}/analytics`,
    seo: (id: string) => `/listings/${id}/seo`,
  },

  // Orders
  orders: {
    list: '/orders',
    get: (id: string) => `/orders/${id}`,
    update: (id: string) => `/orders/${id}`,
    ship: (id: string) => `/orders/${id}/ship`,
    bulkShip: '/orders/bulk-ship',
    labels: '/orders/labels',
  },

  // Analytics
  analytics: {
    dashboard: '/analytics/dashboard',
    revenue: '/analytics/revenue',
    listings: '/analytics/listings',
    customers: '/analytics/customers',
    export: '/analytics/export',
  },

  // Inventory
  inventory: {
    list: '/inventory',
    update: '/inventory/update',
    bulkUpdate: '/inventory/bulk-update',
    reorderAlerts: '/inventory/reorder-alerts',
  },

  // Marketing
  marketing: {
    campaigns: '/marketing/campaigns',
    ads: '/marketing/ads',
    social: '/marketing/social',
    email: '/marketing/email',
  },

  // Customers
  customers: {
    list: '/customers',
    get: (id: string) => `/customers/${id}`,
    segments: '/customers/segments',
    export: '/customers/export',
  },

  // Financial
  financial: {
    overview: '/financial/overview',
    transactions: '/financial/transactions',
    reports: '/financial/reports',
    taxes: '/financial/taxes',
  },

  // Integrations
  integrations: {
    list: '/integrations',
    connect: (provider: string) => `/integrations/${provider}/connect`,
    disconnect: (provider: string) => `/integrations/${provider}/disconnect`,
    sync: (provider: string) => `/integrations/${provider}/sync`,
  },

  // Admin
  admin: {
    users: '/admin/users',
    system: '/admin/system',
    logs: '/admin/logs',
    metrics: '/admin/metrics',
  },
} as const;
