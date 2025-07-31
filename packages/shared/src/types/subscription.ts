export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripeSubscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete';

export interface PlanLimits {
  shops: number;
  listings: number;
  ordersPerMonth: number;
  analyticsRetention: number; // days
  apiRequestsPerHour: number;
  teamMembers: number;
  customReports: boolean;
  bulkOperations: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  whiteLabel: boolean;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    shops: 1,
    listings: 100,
    ordersPerMonth: 50,
    analyticsRetention: 30,
    apiRequestsPerHour: 100,
    teamMembers: 1,
    customReports: false,
    bulkOperations: false,
    apiAccess: false,
    prioritySupport: false,
    whiteLabel: false,
  },
  starter: {
    shops: 3,
    listings: 500,
    ordersPerMonth: 500,
    analyticsRetention: 90,
    apiRequestsPerHour: 500,
    teamMembers: 3,
    customReports: false,
    bulkOperations: true,
    apiAccess: false,
    prioritySupport: false,
    whiteLabel: false,
  },
  professional: {
    shops: 10,
    listings: 5000,
    ordersPerMonth: 5000,
    analyticsRetention: 365,
    apiRequestsPerHour: 2000,
    teamMembers: 10,
    customReports: true,
    bulkOperations: true,
    apiAccess: true,
    prioritySupport: true,
    whiteLabel: false,
  },
  enterprise: {
    shops: -1, // unlimited
    listings: -1,
    ordersPerMonth: -1,
    analyticsRetention: -1,
    apiRequestsPerHour: -1,
    teamMembers: -1,
    customReports: true,
    bulkOperations: true,
    apiAccess: true,
    prioritySupport: true,
    whiteLabel: true,
  },
};
