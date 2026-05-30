import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(["7d", "30d", "90d"]).default("30d"),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query params" }, { status: 400 });
  }

  const organizationId = session.user.organizationId;
  const { period, startDate, endDate } = parsed.data;

  const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const start = startDate
    ? new Date(startDate)
    : new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  const [
    totalFailures,
    openFailures,
    recoveredFailures,
    failures,
    checkoutEvents,
  ] = await Promise.all([
    prisma.paymentFailure.count({
      where: { organizationId, occurredAt: { gte: start, lte: end } },
    }),
    prisma.paymentFailure.count({
      where: {
        organizationId,
        status: "OPEN",
        occurredAt: { gte: start, lte: end },
      },
    }),
    prisma.paymentFailure.count({
      where: {
        organizationId,
        status: "RECOVERED",
        occurredAt: { gte: start, lte: end },
      },
    }),
    prisma.paymentFailure.findMany({
      where: { organizationId, occurredAt: { gte: start, lte: end } },
      select: {
        amount: true,
        currency: true,
        failureCode: true,
        humanReadableReason: true,
        status: true,
        occurredAt: true,
      },
    }),
    prisma.checkoutEvent.findMany({
      where: { organizationId, occurredAt: { gte: start, lte: end } },
      select: { eventType: true },
    }),
  ]);

  // Total revenue lost
  const totalRevenueLost = failures.reduce((sum, f) => sum + f.amount, 0);

  // Recovery rate
  const recoveryRate =
    totalFailures > 0 ? (recoveredFailures / totalFailures) * 100 : 0;

  // Failure reasons breakdown
  const reasonMap: Record<string, { count: number; totalAmount: number }> = {};
  for (const f of failures) {
    const reason = f.humanReadableReason || f.failureCode || "Unknown";
    if (!reasonMap[reason]) reasonMap[reason] = { count: 0, totalAmount: 0 };
    reasonMap[reason].count++;
    reasonMap[reason].totalAmount += f.amount;
  }

  const failureReasons = Object.entries(reasonMap)
    .map(([reason, { count, totalAmount }]) => ({
      reason,
      count,
      totalAmount,
      percentage: totalFailures > 0 ? (count / totalFailures) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Daily trend
  const dailyMap: Record<string, { count: number; amount: number }> = {};
  for (const f of failures) {
    const day = f.occurredAt.toISOString().slice(0, 10);
    if (!dailyMap[day]) dailyMap[day] = { count: 0, amount: 0 };
    dailyMap[day].count++;
    dailyMap[day].amount += f.amount;
  }

  // Fill in missing days
  const dailyTrend = [];
  const current = new Date(start);
  while (current <= end) {
    const day = current.toISOString().slice(0, 10);
    dailyTrend.push({
      date: day,
      count: dailyMap[day]?.count || 0,
      amount: dailyMap[day]?.amount || 0,
    });
    current.setDate(current.getDate() + 1);
  }

  // Checkout funnel
  const funnelEventTypes = [
    "PAGE_VIEW",
    "CHECKOUT_INITIATED",
    "PAYMENT_ATTEMPT",
    "PAYMENT_SUCCESS",
    "PAYMENT_FAILED",
  ] as const;

  const funnelCounts: Record<string, number> = {};
  for (const e of checkoutEvents) {
    funnelCounts[e.eventType] = (funnelCounts[e.eventType] || 0) + 1;
  }

  const funnelSteps = [
    { step: "Page View", eventType: "PAGE_VIEW" },
    { step: "Checkout Initiated", eventType: "CHECKOUT_INITIATED" },
    { step: "Payment Attempt", eventType: "PAYMENT_ATTEMPT" },
    { step: "Payment Success", eventType: "PAYMENT_SUCCESS" },
    { step: "Payment Failed", eventType: "PAYMENT_FAILED" },
  ];

  const checkoutFunnel = funnelSteps.map((step, idx) => {
    const count = funnelCounts[step.eventType] || 0;
    const prevCount =
      idx > 0
        ? funnelCounts[funnelSteps[idx - 1].eventType] || 0
        : count;
    const dropoffRate =
      prevCount > 0 ? ((prevCount - count) / prevCount) * 100 : 0;
    return { ...step, count, dropoffRate };
  });

  // Today failures count
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const newFailuresToday = failures.filter(
    (f) => f.occurredAt >= todayStart
  ).length;

  return NextResponse.json({
    stats: {
      totalFailures,
      totalRevenueLost,
      recoveryRate: Math.round(recoveryRate * 10) / 10,
      openFailures,
      recoveredFailures,
      newFailuresToday,
    },
    failureReasons,
    dailyTrend,
    checkoutFunnel,
  });
}
