import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyStripeWebhook } from "@/lib/stripe";
import { notificationQueue } from "@/lib/queue";
import { humanizeFailureReason } from "@/lib/stripe";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  // We need to identify which organization this webhook belongs to.
  // Strategy: try each org's webhook secret until one verifies.
  const connections = await prisma.stripeConnection.findMany({
    include: { organization: true },
  });

  let event: Stripe.Event | null = null;
  let organizationId: string | null = null;

  for (const connection of connections) {
    try {
      event = await verifyStripeWebhook(body, signature, connection.webhookSecret);
      organizationId = connection.organizationId;
      break;
    } catch {
      // Try next connection
    }
  }

  if (!event || !organizationId) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  // Idempotency check — log the event
  const existing = await prisma.webhookEventLog.findUnique({
    where: { stripeEventId: event.id },
  });

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  await prisma.webhookEventLog.create({
    data: {
      organizationId,
      stripeEventId: event.id,
      eventType: event.type,
      rawPayload: event as unknown as object,
      receivedAt: new Date(),
    },
  });

  // Process synchronously for critical events (for simplicity; can be moved to queue)
  try {
    if (
      event.type === "payment_intent.payment_failed" ||
      event.type === "invoice.payment_failed"
    ) {
      await handlePaymentFailed(organizationId, event);

      await prisma.webhookEventLog.update({
        where: { stripeEventId: event.id },
        data: { processed: true, processedAt: new Date() },
      });
    } else if (event.type === "customer.subscription.updated") {
      await handleSubscriptionUpdated(organizationId, event);
      await prisma.webhookEventLog.update({
        where: { stripeEventId: event.id },
        data: { processed: true, processedAt: new Date() },
      });
    } else {
      // Mark as processed (no handler needed)
      await prisma.webhookEventLog.update({
        where: { stripeEventId: event.id },
        data: { processed: true, processedAt: new Date() },
      });
    }
  } catch (error) {
    console.error(`[Webhook] Error processing ${event.type}:`, error);
    await prisma.webhookEventLog.update({
      where: { stripeEventId: event.id },
      data: {
        processingError:
          error instanceof Error ? error.message : "Unknown error",
      },
    });
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentFailed(
  organizationId: string,
  event: Stripe.Event
) {
  const obj = event.data.object as Stripe.PaymentIntent | Stripe.Invoice;

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
  let paymentMethodType: string | undefined;
  let paymentMethodLast4: string | undefined;

  if (event.type === "payment_intent.payment_failed") {
    const pi = obj as Stripe.PaymentIntent;
    stripeCustomerId = pi.customer as string;
    amount = pi.amount;
    currency = pi.currency;
    stripePaymentIntentId = pi.id;

    if (pi.last_payment_error) {
      failureCode = pi.last_payment_error.code || undefined;
      failureMessage = pi.last_payment_error.message || undefined;
      stripeChargeId = pi.last_payment_error.charge as string | undefined;

      const pm = pi.last_payment_error.payment_method;
      if (pm && pm.type === "card" && pm.card) {
        paymentMethodType = `${pm.card.brand} card`;
        paymentMethodLast4 = pm.card.last4;
      } else if (pm) {
        paymentMethodType = pm.type;
      }
    }
  } else {
    const inv = obj as Stripe.Invoice;
    stripeCustomerId = inv.customer as string;
    amount = inv.amount_due;
    currency = inv.currency;
    stripeInvoiceId = inv.id;
    stripePaymentIntentId = inv.payment_intent as string | undefined;
    subscriptionId = inv.subscription as string | undefined;
    invoiceUrl = inv.hosted_invoice_url || undefined;
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
    // Try to fetch customer details from Stripe
    let customerEmail = stripeCustomerId;
    let customerName: string | undefined;

    try {
      const { stripe } = await import("@/lib/stripe");
      const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);
      if (!stripeCustomer.deleted) {
        customerEmail = stripeCustomer.email || stripeCustomerId;
        customerName = stripeCustomer.name || undefined;
      }
    } catch {
      // Use fallback
    }

    customer = await prisma.customer.create({
      data: {
        organizationId,
        stripeCustomerId,
        email: customerEmail,
        name: customerName,
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
      paymentMethodType,
      paymentMethodLast4,
      subscriptionId,
      invoiceUrl,
      status: "OPEN",
      rawEvent: event as unknown as object,
      occurredAt: new Date(event.created * 1000),
    },
  });

  // Enqueue notification
  await notificationQueue.add(
    "payment_failure_notification",
    {
      paymentFailureId: failure.id,
      organizationId,
      type: "payment_failure",
    },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    }
  );
}

async function handleSubscriptionUpdated(
  organizationId: string,
  event: Stripe.Event
) {
  const subscription = event.data.object as Stripe.Subscription;

  if (subscription.status === "active") {
    // Check if there's an open failure for this subscription that can be marked recovered
    await prisma.paymentFailure.updateMany({
      where: {
        organizationId,
        subscriptionId: subscription.id,
        status: { in: ["OPEN", "RETRYING"] },
      },
      data: { status: "RECOVERED" },
    });
  }
}
