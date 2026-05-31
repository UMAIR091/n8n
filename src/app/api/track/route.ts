import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const trackingEventSchema = z.object({
  sessionId: z.string().min(1),
  eventType: z.enum([
    "PAGE_VIEW",
    "CHECKOUT_INITIATED",
    "PAYMENT_ATTEMPT",
    "PAYMENT_SUCCESS",
    "PAYMENT_FAILED",
    "DROP_OFF",
  ]),
  workspaceId: z.string().min(1),
  customerId: z.string().optional(),
  page: z.string().optional(),
  url: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  device: z.string().optional(),
  browser: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  occurredAt: z.string().datetime().optional(),
});

const batchSchema = z.object({
  events: z.array(trackingEventSchema).min(1).max(100),
});

async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `track:ratelimit:${ip}`;
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, 60); // 1 minute window
  }
  return current <= 100; // 100 requests per minute per IP
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // Rate limiting
  try {
    const allowed = await checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
  } catch {
    // Redis unavailable, allow the request
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.errors },
      { status: 400 }
    );
  }

  const { events } = parsed.data;

  // Validate workspaceId is consistent
  const workspaceId = events[0].workspaceId;
  if (events.some((e) => e.workspaceId !== workspaceId)) {
    return NextResponse.json(
      { error: "All events must have the same workspaceId" },
      { status: 400 }
    );
  }

  // Verify organization exists
  const org = await prisma.organization.findUnique({
    where: { id: workspaceId },
  });

  if (!org) {
    return NextResponse.json({ error: "Invalid workspaceId" }, { status: 404 });
  }

  // Upsert customer if customerId provided
  const customerIdMap: Record<string, string> = {};

  const customerStripeIds = Array.from(new Set(events.map((e) => e.customerId).filter((id): id is string => !!id)));

  for (const stripeCustomerId of customerStripeIds) {
    let customer = await prisma.customer.findUnique({
      where: {
        organizationId_stripeCustomerId: {
          organizationId: org.id,
          stripeCustomerId,
        },
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          organizationId: org.id,
          stripeCustomerId,
          email: stripeCustomerId,
        },
      });
    }

    customerIdMap[stripeCustomerId] = customer.id;
  }

  // Insert checkout events
  await prisma.checkoutEvent.createMany({
    data: events.map((event) => ({
      organizationId: org.id,
      customerId: event.customerId
        ? customerIdMap[event.customerId]
        : undefined,
      sessionId: event.sessionId,
      eventType: event.eventType,
      page: event.page,
      url: event.url,
      utmSource: event.utmSource,
      utmMedium: event.utmMedium,
      utmCampaign: event.utmCampaign,
      device: event.device,
      browser: event.browser,
      ipAddress: ip !== "unknown" ? ip : undefined,
      metadata: event.metadata as object | undefined,
      occurredAt: event.occurredAt ? new Date(event.occurredAt) : new Date(),
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ received: true, count: events.length });
}
