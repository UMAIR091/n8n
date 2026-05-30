import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { prisma } from "@/lib/prisma";
import { humanizeFailureReason } from "@/lib/stripe";
import { notificationQueue } from "@/lib/queue";
import type { WebhookJobData } from "@/lib/queue";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

async function processWebhookJob(job: Job<WebhookJobData>) {
  const { stripeEventId, organizationId, eventType, rawPayload } = job.data;

  console.log(
    `[WebhookWorker] Processing ${eventType} for org ${organizationId}`
  );

  try {
    // Mark as being processed
    await prisma.webhookEventLog.update({
      where: { stripeEventId },
      data: { processedAt: new Date() },
    });

    // Handle different event types
    if (
      eventType === "payment_intent.payment_failed" ||
      eventType === "invoice.payment_failed"
    ) {
      await handlePaymentFailed(organizationId, rawPayload, eventType);
    }

    // Mark as processed
    await prisma.webhookEventLog.update({
      where: { stripeEventId },
      data: { processed: true },
    });
  } catch (error) {
    console.error(
      `[WebhookWorker] Error processing ${stripeEventId}:`,
      error
    );

    await prisma.webhookEventLog.update({
      where: { stripeEventId },
      data: {
        processingError:
          error instanceof Error ? error.message : "Unknown error",
      },
    });

    throw error;
  }
}

async function handlePaymentFailed(
  organizationId: string,
  rawPayload: Record<string, unknown>,
  eventType: string
) {
  const event = rawPayload as {
    data: { object: Record<string, unknown> };
  };

  const obj = event.data.object as Record<string, unknown>;

  let stripeCustomerId: string;
  let amount: number;
  let currency: string;
  let failureCode: string | undefined;
  let failureMessage: string | undefined;
  let stripePaymentIntentId: string | undefined;
  let stripeInvoiceId: string | undefined;
  let stripeChargeId: string | undefined;
  let subscriptionId: string | undefined;
  let invoiceUrl: string | undefined;

  if (eventType === "payment_intent.payment_failed") {
    stripeCustomerId = obj.customer as string;
    amount = obj.amount as number;
    currency = obj.currency as string;
    stripePaymentIntentId = obj.id as string;

    const lastError = obj.last_payment_error as Record<string, unknown> | null;
    failureCode = lastError?.code as string | undefined;
    failureMessage = lastError?.message as string | undefined;
    stripeChargeId = lastError?.charge as string | undefined;
  } else {
    // invoice.payment_failed
    stripeCustomerId = obj.customer as string;
    amount = obj.amount_due as number;
    currency = obj.currency as string;
    stripeInvoiceId = obj.id as string;
    stripePaymentIntentId = obj.payment_intent as string | undefined;
    subscriptionId = obj.subscription as string | undefined;
    invoiceUrl = obj.hosted_invoice_url as string | undefined;

    const charge = obj.charge as Record<string, unknown> | null;
    failureCode = charge?.failure_code as string | undefined;
    failureMessage = charge?.failure_message as string | undefined;
    stripeChargeId = charge?.id as string | undefined;
  }

  const humanReadableReason = humanizeFailureReason(failureCode, failureMessage);

  // Upsert customer
  let customer = await prisma.customer.findUnique({
    where: {
      organizationId_stripeCustomerId: {
        organizationId,
        stripeCustomerId,
      },
    },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        organizationId,
        stripeCustomerId,
        email: stripeCustomerId, // Will be updated when we have real customer data
        name: undefined,
      },
    });
  }

  // Create payment failure record
  const failure = await prisma.paymentFailure.create({
    data: {
      organizationId,
      customerId: customer.id,
      stripeCustomerId,
      stripePaymentIntentId,
      stripeInvoiceId,
      stripeChargeId,
      amount,
      currency,
      failureCode,
      failureMessage,
      humanReadableReason,
      subscriptionId,
      invoiceUrl,
      status: "OPEN",
      rawEvent: rawPayload as object,
      occurredAt: new Date(),
    },
  });

  // Enqueue notification job
  await notificationQueue.add("payment_failure_notification", {
    paymentFailureId: failure.id,
    organizationId,
    type: "payment_failure",
  });

  console.log(
    `[WebhookWorker] Created failure ${failure.id} and enqueued notification`
  );
}

const worker = new Worker<WebhookJobData>("webhooks", processWebhookJob, {
  connection,
  concurrency: 10,
});

worker.on("completed", (job) => {
  console.log(`[WebhookWorker] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[WebhookWorker] Job ${job?.id} failed:`, err.message);
});

console.log("[WebhookWorker] Started and listening for jobs...");

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});

export default worker;
