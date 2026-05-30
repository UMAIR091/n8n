import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Bell, CheckCircle, XCircle, Clock } from "lucide-react";
import Link from "next/link";

const statusIcon = {
  SENT: CheckCircle,
  FAILED: XCircle,
  PENDING: Clock,
  RETRYING: Clock,
};

const statusColor = {
  SENT: "text-green-500",
  FAILED: "text-red-500",
  PENDING: "text-yellow-500",
  RETRYING: "text-yellow-500",
};

const channelBadge = {
  EMAIL: "bg-blue-50 text-blue-700",
  WHATSAPP: "bg-green-50 text-green-700",
  SMS: "bg-purple-50 text-purple-700",
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const session = await auth();
  const orgId = (session?.user as Record<string, unknown>)?.organizationId as string;

  const page = parseInt(searchParams.page ?? "1");
  const pageSize = 30;
  const skip = (page - 1) * pageSize;

  const [logs, total] = await Promise.all([
    prisma.notificationLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip,
    }),
    prisma.notificationLog.count({ where: { organizationId: orgId } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notification Logs</h1>
        <p className="text-sm text-gray-500">{total} notifications sent</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Channel</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Recipient</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Subject</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Attempts</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Sent At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="py-16 text-center text-gray-400">
                  <Bell className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  No notifications yet
                </td>
              </tr>
            )}
            {logs.map((log) => {
              const Icon = statusIcon[log.status] ?? Clock;
              return (
                <tr key={log.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`h-4 w-4 ${statusColor[log.status] ?? "text-gray-400"}`} />
                      <span className="text-gray-700">{log.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${channelBadge[log.channel]}`}>
                      {log.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{log.recipient}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{log.subject ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400">{log.attempts}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {log.sentAt ? formatDate(log.sentAt) : "—"}
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
              <Link href={`/notifications?page=${page - 1}`} className="rounded border border-gray-200 px-3 py-1 hover:bg-gray-50">
                Previous
              </Link>
            )}
            {skip + pageSize < total && (
              <Link href={`/notifications?page=${page + 1}`} className="rounded border border-gray-200 px-3 py-1 hover:bg-gray-50">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
