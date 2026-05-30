import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Users } from "lucide-react";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  const session = await auth();
  const orgId = (session?.user as Record<string, unknown>)?.organizationId as string;

  const page = parseInt(searchParams.page ?? "1");
  const pageSize = 25;
  const skip = (page - 1) * pageSize;

  const where = {
    organizationId: orgId,
    ...(searchParams.search
      ? {
          OR: [
            { email: { contains: searchParams.search, mode: "insensitive" as const } },
            { name: { contains: searchParams.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        _count: { select: { paymentFailures: true } },
        paymentFailures: {
          select: { amount: true },
          where: { status: "OPEN" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip,
    }),
    prisma.customer.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500">{total} customers with payment activity</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Stripe ID</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Failures</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">At Risk</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Since</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {customers.length === 0 && (
              <tr>
                <td colSpan={6} className="py-16 text-center text-gray-400">
                  <Users className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  No customers yet
                </td>
              </tr>
            )}
            {customers.map((c) => {
              const atRisk = c.paymentFailures.reduce((sum, f) => sum + f.amount, 0);
              return (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{c.name ?? "—"}</div>
                    <div className="text-gray-400">{c.email}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{c.stripeCustomerId}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{c._count.paymentFailures}</td>
                  <td className="px-4 py-3 text-right font-medium text-red-600">
                    {atRisk > 0 ? formatCurrency(atRisk) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/customers/${c.id}`}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {skip + 1}–{Math.min(skip + pageSize, total)} of {total}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/customers?page=${page - 1}`}
                className="rounded border border-gray-200 px-3 py-1 hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {skip + pageSize < total && (
              <Link
                href={`/customers?page=${page + 1}`}
                className="rounded border border-gray-200 px-3 py-1 hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
