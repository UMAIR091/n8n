"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatRelativeTime, cn } from "@/lib/utils";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import type { PaymentFailureWithCustomer } from "@/types";

interface FailureTableProps {
  failures: PaymentFailureWithCustomer[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
}

const statusConfig = {
  OPEN: { label: "Open", variant: "destructive" as const },
  RETRYING: { label: "Retrying", variant: "warning" as const },
  RECOVERED: { label: "Recovered", variant: "success" as const },
  WRITTEN_OFF: { label: "Written Off", variant: "secondary" as const },
};

export function FailureTable({
  failures,
  total,
  page,
  pageSize,
  onPageChange,
}: FailureTableProps) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Customer
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Reason
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {failures.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No payment failures found
                  </td>
                </tr>
              ) : (
                failures.map((failure) => {
                  const statusInfo =
                    statusConfig[failure.status] || statusConfig.OPEN;
                  return (
                    <tr
                      key={failure.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">
                            {failure.customer?.name ||
                              failure.customer?.email ||
                              failure.stripeCustomerId}
                          </p>
                          {failure.customer?.email && (
                            <p className="text-xs text-muted-foreground">
                              {failure.customer.email}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-destructive">
                          {formatCurrency(failure.amount, failure.currency)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[200px] truncate text-muted-foreground">
                          {failure.humanReadableReason ||
                            failure.failureCode ||
                            "Unknown"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatRelativeTime(failure.occurredAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {failure.invoiceUrl && (
                            <a
                              href={failure.invoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          <Link
                            href={`/dashboard/failures/${failure.id}`}
                            className="text-primary hover:underline text-xs font-medium"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
