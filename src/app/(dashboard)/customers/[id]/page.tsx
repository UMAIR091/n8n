import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDate, formatCurrency } from "@/lib/utils";
import { CheckCircle, XCircle, RefreshCw, AlertCircle } from "lucide-react";

const statusConfig = {
  OPEN: { label: "Open", color: "bg-red-100 text-red-700", icon: AlertCircle },
  RETRYING: { label: "Retrying", color: "bg-yellow-100 text-yellow-700", icon: RefreshCw },
  RECOVERED: { label: "Recovered", color: "bg-green-100 text-green-700", icon: CheckCircle },
  WRITTEN_OFF: { label: "Written Off", color: "bg-gray-100 text-gray-500", icon: XCircle },
};

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const orgId = (session?.user as Record<string, unknown>)?.organizationId as string;

  const customer = await prisma.customer.findFirst({
    where: { id: params.id, organizationId: orgId },
    include: {
      paymentFailures: { orderBy: { occurredAt: "desc" }, take: 50 },
      checkoutEvents: { orderBy: { occurredAt: "desc" }, take: 50 },
    },
  });

  if (!customer) notFound();

  const totalLost = customer.paymentFailures.reduce((sum, f) => sum + f.amount, 0);
  const recovered = customer.paymentFailures.filter((f) => f.status === "RECOVERED").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{customer.name ?? customer.email}</h1>
          <p className="text-sm text-gray-500">{customer.email}</p>
          <p className="mt-1 font-mono text-xs text-gray-400">{customer.stripeCustomerId}</p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg border border-gray-100 bg-white p-3">
            <div className="text-xl font-bold text-gray-900">{customer.paymentFailures.length}</div>
            <div className="text-xs text-gray-500">Failures</div>
          </div>
          <div className="rounded-lg border border-gray-100 bg-white p-3">
            <div className="text-xl font-bold text-red-600">{formatCurrency(totalLost)}</div>
            <div className="text-xs text-gray-500">Lost</div>
          </div>
          <div className="rounded-lg border border-gray-100 bg-white p-3">
            <div className="text-xl font-bold text-green-600">{recovered}</div>
            <div className="text-xs text-gray-500">Recovered</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-semibold text-gray-900">Payment Failure Timeline</h2>
        {customer.paymentFailures.length === 0 ? (
          <p className="text-sm text-gray-400">No failures recorded.</p>
        ) : (
          <div className="space-y-3">
            {customer.paymentFailures.map((f) => {
              const cfg = statusConfig[f.status];
              return (
                <div key={f.id} className="flex items-start gap-4 border-b border-gray-50 pb-3 last:border-0">
                  <div className="mt-0.5">
                    <cfg.icon className={`h-4 w-4 ${cfg.color.split(" ")[1]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <span className="font-semibold text-gray-900">{formatCurrency(f.amount, f.currency)}</span>
                      {f.paymentMethodType && (
                        <span className="text-xs text-gray-400">{f.paymentMethodType}</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {f.humanReadableReason ?? f.failureMessage ?? "Unknown reason"}
                    </p>
                    {f.productName && (
                      <p className="text-xs text-gray-400">{f.productName}</p>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 flex-shrink-0">{formatDate(f.occurredAt)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {customer.checkoutEvents.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-900">Checkout Behavior</h2>
          <div className="space-y-2">
            {customer.checkoutEvents.slice(0, 20).map((e) => (
              <div key={e.id} className="flex items-center gap-3 text-sm">
                <span className="text-xs text-gray-400">{formatDate(e.occurredAt)}</span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600">
                  {e.eventType}
                </span>
                {e.page && <span className="text-gray-500 truncate">{e.page}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
