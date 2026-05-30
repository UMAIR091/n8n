import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { prisma } from "@/lib/prisma";
import { sendPaymentFailureEmail } from "@/lib/notifications/email";
import { sendPaymentFailureWhatsApp } from "@/lib/notifications/whatsapp";
import type { NotificationJobData } from "@/lib/queue";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

async function processNotificationJob(job: Job<NotificationJobData>) {
  const { paymentFailureId, organizationId, type } = job.data;

  console.log(
    `[NotificationWorker] Processing job ${job.id} — type: ${type}, failure: ${paymentFailureId}`
  );

  // Load failure + customer + org + settings
  const [failure, settings] = await Promise.all([
    prisma.paymentFailure.findUnique({
      where: { id: paymentFailureId },
      include: { customer: true, organization: true },
    }),
    prisma.notificationSetting.findUnique({
      where: { organizationId },
    }),
  ]);

  if (!failure) {
    console.warn(`[NotificationWorker] Failure ${paymentFailureId} not found`);
    return;
  }

  if (!settings) {
    console.warn(
      `[NotificationWorker] No notification settings for org ${organizationId}`
    );
    return;
  }

  // Check minimum amount threshold
  if (failure.amount < settings.minAmountThreshold) {
    console.log(
      `[NotificationWorker] Amount ${failure.amount} below threshold ${settings.minAmountThreshold}, skipping`
    );
    return;
  }

  const emailData = {
    customerName: failure.customer?.name || undefined,
    customerEmail: failure.customer?.email || failure.stripeCustomerId,
    amount: failure.amount,
    currency: failure.currency,
    failureReason:
      failure.humanReadableReason ||
      failure.failureMessage ||
      "Payment declined",
    failureCode: failure.failureCode || undefined,
    paymentMethodType: failure.paymentMethodType || undefined,
    paymentMethodLast4: failure.paymentMethodLast4 || undefined,
    productName: failure.productName || undefined,
    invoiceUrl: failure.invoiceUrl || undefined,
    organizationName: failure.organization.name,
    occurredAt: failure.occurredAt,
  };

  const whatsappData = {
    ...emailData,
    dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/failures/${failure.id}`,
  };

  // Send email notifications
  if (settings.emailEnabled && settings.emailRecipients.length > 0) {
    const logEntry = await prisma.notificationLog.create({
      data: {
        organizationId,
        paymentFailureId,
        channel: "EMAIL",
        recipient: settings.emailRecipients.join(", "),
        subject: `Payment Failed: ${failure.amount / 100} ${failure.currency.toUpperCase()}`,
        body: `Payment failure notification for ${emailData.customerEmail}`,
        status: "PENDING",
        attempts: 0,
      },
    });

    const result = await sendPaymentFailureEmail(
      settings.emailRecipients,
      emailData
    );

    await prisma.notificationLog.update({
      where: { id: logEntry.id },
      data: {
        status: result.success ? "SENT" : "FAILED",
        sentAt: result.success ? new Date() : undefined,
        errorMessage: result.error,
        attempts: 1,
        lastAttemptAt: new Date(),
      },
    });

    if (result.success) {
      console.log(
        `[NotificationWorker] Email sent to ${settings.emailRecipients.join(", ")}`
      );
    } else {
      console.error(`[NotificationWorker] Email failed: ${result.error}`);
    }
  }

  // Send WhatsApp notifications
  if (settings.whatsappEnabled && settings.whatsappRecipients.length > 0) {
    const logEntry = await prisma.notificationLog.create({
      data: {
        organizationId,
        paymentFailureId,
        channel: "WHATSAPP",
        recipient: settings.whatsappRecipients.join(", "),
        body: `Payment failure WhatsApp notification for ${emailData.customerEmail}`,
        status: "PENDING",
        attempts: 0,
      },
    });

    const result = await sendPaymentFailureWhatsApp(
      settings.whatsappRecipients,
      whatsappData
    );

    await prisma.notificationLog.update({
      where: { id: logEntry.id },
      data: {
        status: result.success ? "SENT" : "FAILED",
        sentAt: result.success ? new Date() : undefined,
        errorMessage: result.error,
        attempts: 1,
        lastAttemptAt: new Date(),
      },
    });
  }
}

const worker = new Worker<NotificationJobData>(
  "notifications",
  processNotificationJob,
  {
    connection,
    concurrency: 5,
  }
);

worker.on("completed", (job) => {
  console.log(`[NotificationWorker] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[NotificationWorker] Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("[NotificationWorker] Worker error:", err);
});

console.log("[NotificationWorker] Started and listening for jobs...");

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[NotificationWorker] Shutting down...");
  await worker.close();
  process.exit(0);
});

export default worker;
