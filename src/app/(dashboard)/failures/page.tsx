import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FailureTable } from "@/components/dashboard/FailureTable";

export default async function FailuresPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string; search?: string };
}) {
  const session = await auth();
  const orgId = (session?.user as Record<string, unknown>)?.organizationId as string;

  const page = parseInt(searchParams.page ?? "1");
  const pageSize = 25;
  const skip = (page - 1) * pageSize;

  const where = {
    organizationId: orgId,
    ...(searchParams.status ? { status: searchParams.status as "OPEN" | "RETRYING" | "RECOVERED" | "WRITTEN_OFF" } : {}),
    ...(searchParams.search
      ? {
          OR: [
            { stripeCustomerId: { contains: searchParams.search, mode: "insensitive" as const } },
            { customer: { email: { contains: searchParams.search, mode: "insensitive" as const } } },
            { failureCode: { contains: searchParams.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [failures, total] = await Promise.all([
    prisma.paymentFailure.findMany({
      where,
      include: { customer: { select: { email: true, name: true } } },
      orderBy: { occurredAt: "desc" },
      take: pageSize,
      skip,
    }),
    prisma.paymentFailure.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Failed Payments</h1>
        <p className="text-sm text-gray-500">{total} total failures</p>
      </div>
      <FailureTable
        failures={failures as Parameters<typeof FailureTable>[0]["failures"]}
        total={total}
        page={page}
        pageSize={pageSize}
      />
    </div>
  );
}
