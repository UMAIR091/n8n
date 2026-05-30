import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export interface NotificationJobData {
  paymentFailureId: string;
  organizationId: string;
  type: "payment_failure" | "retry_reminder" | "recovery_success";
}

export interface WebhookJobData {
  stripeEventId: string;
  organizationId: string;
  eventType: string;
  rawPayload: Record<string, unknown>;
}

export const notificationQueue = new Queue<NotificationJobData>(
  "notifications",
  {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  }
);

export const webhookQueue = new Queue<WebhookJobData>("webhooks", {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 100 },
  },
});

export { connection as queueConnection };
