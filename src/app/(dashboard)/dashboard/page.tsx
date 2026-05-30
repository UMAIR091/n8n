import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { FailureReasonChart } from "@/components/dashboard/FailureReasonChart";
import { formatCurrency } from "@/lib/utils";
import { AlertCircle, TrendingDown, CheckCircle, DollarSign } from "lucide-react";
import { subDays, startOfDay, format } from "date-fns";

export default async function DashboardPage() {
  const session = await auth();
  const orgId = (session?.user as Record<string, unknown>)?.organizationId as string;

  if (!orgId) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        No workspace found. Please complete setup.
      </div>
    );
  }

  const since = startOfDay(subDays(new Date(), 30));

  const [totalFailures, openFailures, recoveredFailures, revenueAgg, reasons, dailyRaw] =
    await Promise.all([
      prisma.paymentFailure.count({ where: { organizationId: orgId } }),
      prisma.paymentFailure.count({ where: { organizationId: orgId, status: "OPEN" } }),
      prisma.paymentFailure.count({ where: { organizationId: orgId, status: "RECOVERED" } }),
      prisma.paymentFailure.aggregate({
        where: { organizationId: orgId },
        _sum: { amount: true },
      }),
      prisma.paymentFailure.groupBy({
        by: ["humanReadableReason"],
        where: { organizationId: orgId, occurredAt: { gte: since } },
        _count: true,
        orderBy: { _count: { humanReadableReason: "desc" } },
        take: 5,
      }),
      prisma.paymentFailure.findMany({
        where: { organizationId: orgId, occurredAt: { gte: since } },
        select: { amount: true, occurredAt: true },
        orderBy: { occurredAt: "asc" },
      }),
    ]);

  const revenueLost = revenueAgg._sum.amount ?? 0;
  const recoveryRate = totalFailures > 0 ? Math.round((recoveredFailures / totalFailures) * 100) : 0;

  // Build daily trend
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

  const topReasons = reasons.map((r) => ({
    reason: r.humanReadableReason ?? "Unknown",
    count: r._count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500">Last 30 days of payment failure data</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Failures"
          value={totalFailures.toString()}
          icon={AlertCircle}
          iconColor="text-red-500"
          iconBg="bg-red-50"
        />
        <StatsCard
          title="Revenue Lost"
          value={formatCurrency(revenueLost)}
          icon={TrendingDown}
          iconColor="text-orange-500"
          iconBg="bg-orange-50"
        />
        <StatsCard
          title="Open Failures"
          value={openFailures.toString()}
          icon={DollarSign}
          iconColor="text-yellow-500"
          iconBg="bg-yellow-50"
        />
        <StatsCard
          title="Recovery Rate"
          value={`${recoveryRate}%`}
          icon={CheckCircle}
          iconColor="text-green-500"
          iconBg="bg-green-50"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={dailyTrend} />
        </div>
        <div>
          <FailureReasonChart data={topReasons} />
        </div>
      </div>
    </div>
  );
}
