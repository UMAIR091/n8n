import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FailureReasonChart } from "@/components/dashboard/FailureReasonChart";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { CheckoutFunnel } from "@/components/dashboard/CheckoutFunnel";
import { subDays, startOfDay, format } from "date-fns";

export default async function AnalyticsPage() {
  const session = await auth();
  const orgId = (session?.user as Record<string, unknown>)?.organizationId as string;

  const since = startOfDay(subDays(new Date(), 30));

  const [reasonsRaw, dailyRaw, funnelRaw] = await Promise.all([
    prisma.paymentFailure.groupBy({
      by: ["humanReadableReason"],
      where: { organizationId: orgId, occurredAt: { gte: since } },
      _count: true,
      orderBy: { _count: { humanReadableReason: "desc" } },
      take: 8,
    }),
    prisma.paymentFailure.findMany({
      where: { organizationId: orgId, occurredAt: { gte: since } },
      select: { amount: true, occurredAt: true },
      orderBy: { occurredAt: "asc" },
    }),
    prisma.checkoutEvent.groupBy({
      by: ["eventType"],
      where: { organizationId: orgId, occurredAt: { gte: since } },
      _count: true,
    }),
  ]);

  const topReasons = reasonsRaw.map((r) => ({
    reason: r.humanReadableReason ?? "Unknown",
    count: r._count,
  }));

  const dailyMap: Record<string, { failures: number; amount: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = format(subDays(new Date(), i), "MMM d");
    dailyMap[d] = { failures: 0, amount: 0 };
  }
  for (const f of dailyRaw) {
    const d = format(f.occurredAt, "MMM d");
    if (dailyMap[d]) {
      dailyMap[d].failures++;
      dailyMap[d].amount += f.amount;
    }
  }
  const dailyTrend = Object.entries(dailyMap).map(([date, v]) => ({ date, ...v }));

  const funnelMap: Record<string, number> = {};
  for (const row of funnelRaw) {
    funnelMap[row.eventType] = row._count;
  }
  const funnelData = {
    pageViews: funnelMap["PAGE_VIEW"] ?? 0,
    checkoutInitiated: funnelMap["CHECKOUT_INITIATED"] ?? 0,
    paymentAttempts: funnelMap["PAYMENT_ATTEMPT"] ?? 0,
    paymentSuccess: funnelMap["PAYMENT_SUCCESS"] ?? 0,
    paymentFailed: funnelMap["PAYMENT_FAILED"] ?? 0,
    dropOffRate:
      funnelMap["PAGE_VIEW"] > 0
        ? Math.round(
            ((funnelMap["PAGE_VIEW"] - (funnelMap["PAYMENT_SUCCESS"] ?? 0)) /
              funnelMap["PAGE_VIEW"]) *
              100
          )
        : 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">Last 30 days</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={dailyTrend} />
        </div>
        <div>
          <FailureReasonChart data={topReasons} />
        </div>
      </div>

      <CheckoutFunnel data={funnelData} />
    </div>
  );
}
