import type {
  User,
  Organization,
  PaymentFailure,
  Customer,
  NotificationLog,
  CheckoutEvent,
  StripeConnection,
  NotificationSetting,
  WebhookEventLog,
  Membership,
} from "@prisma/client";

// Re-export Prisma types
export type {
  User,
  Organization,
  PaymentFailure,
  Customer,
  NotificationLog,
  CheckoutEvent,
  StripeConnection,
  NotificationSetting,
  WebhookEventLog,
  Membership,
};

// Extended types with relations
export type PaymentFailureWithCustomer = PaymentFailure & {
  customer?: Customer | null;
};

export type PaymentFailureWithAll = PaymentFailure & {
  customer?: Customer | null;
  notificationLogs?: NotificationLog[];
};

export type CustomerWithStats = Customer & {
  _count?: {
    paymentFailures: number;
    checkoutEvents: number;
  };
  paymentFailures?: PaymentFailure[];
};

export type MembershipWithUser = Membership & {
  user: User;
};

export type MembershipWithOrg = Membership & {
  organization: Organization;
};

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Analytics types
export interface DashboardStats {
  totalFailures: number;
  totalRevenueLost: number;
  recoveryRate: number;
  openFailures: number;
  recoveredFailures: number;
  newFailuresToday: number;
}

export interface FailureReasonBreakdown {
  reason: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface DailyTrend {
  date: string;
  count: number;
  amount: number;
}

export interface CheckoutFunnelStep {
  step: string;
  eventType: string;
  count: number;
  dropoffRate: number;
}

export interface AnalyticsData {
  stats: DashboardStats;
  failureReasons: FailureReasonBreakdown[];
  dailyTrend: DailyTrend[];
  checkoutFunnel: CheckoutFunnelStep[];
}

// Tracking event types
export interface TrackingEvent {
  sessionId: string;
  eventType:
    | "PAGE_VIEW"
    | "CHECKOUT_INITIATED"
    | "PAYMENT_ATTEMPT"
    | "PAYMENT_SUCCESS"
    | "PAYMENT_FAILED"
    | "DROP_OFF";
  workspaceId: string;
  customerId?: string;
  page?: string;
  url?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  device?: string;
  browser?: string;
  metadata?: Record<string, unknown>;
  occurredAt: string;
}

// Notification job data
export interface NotificationJobPayload {
  paymentFailureId: string;
  organizationId: string;
  type: "payment_failure" | "retry_reminder" | "recovery_success";
}

// Settings form types
export interface NotificationSettingsForm {
  emailEnabled: boolean;
  emailRecipients: string[];
  whatsappEnabled: boolean;
  whatsappRecipients: string[];
  smsEnabled: boolean;
  smsRecipients: string[];
  minAmountThreshold: number;
}

export interface StripeConnectForm {
  webhookSecret: string;
}
