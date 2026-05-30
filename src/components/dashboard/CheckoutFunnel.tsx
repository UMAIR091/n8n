"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Object format from analytics page
interface FunnelDataObject {
  pageViews: number;
  checkoutInitiated: number;
  paymentAttempts: number;
  paymentSuccess: number;
  paymentFailed: number;
  dropOffRate?: number;
}

// Array format
interface FunnelStep {
  step: string;
  eventType?: string;
  count: number;
  dropoffRate?: number;
}

type CheckoutFunnelProps =
  | { data: FunnelDataObject }
  | { data: FunnelStep[] };

const STEP_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
];

function normalizeData(
  data: FunnelDataObject | FunnelStep[]
): FunnelStep[] {
  if (Array.isArray(data)) return data;

  const obj = data as FunnelDataObject;
  const steps = [
    { step: "Page View", count: obj.pageViews },
    { step: "Checkout Started", count: obj.checkoutInitiated },
    { step: "Payment Attempt", count: obj.paymentAttempts },
    { step: "Payment Success", count: obj.paymentSuccess },
    { step: "Payment Failed", count: obj.paymentFailed },
  ];

  return steps.map((s, idx) => {
    const prevCount = idx > 0 ? steps[idx - 1].count : s.count;
    const dropoffRate =
      prevCount > 0 ? ((prevCount - s.count) / prevCount) * 100 : 0;
    return { ...s, dropoffRate: Math.max(0, dropoffRate) };
  });
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: FunnelStep }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="font-medium text-sm">{label}</p>
        <p className="text-sm text-muted-foreground">
          {d.count.toLocaleString()} events
        </p>
        {(d.dropoffRate ?? 0) > 0 && (
          <p className="text-sm text-destructive">
            {(d.dropoffRate ?? 0).toFixed(1)}% drop-off
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function CheckoutFunnel({ data }: CheckoutFunnelProps) {
  const chartData = normalizeData(data);
  const hasData = chartData.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Checkout Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-center text-muted-foreground">
            <div>
              <p>No tracking data yet.</p>
              <p className="text-sm mt-1">
                Embed <code className="text-xs bg-muted px-1 rounded">tracker.js</code> on your site to start tracking.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Checkout Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              className="stroke-muted"
            />
            <XAxis
              type="number"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="step"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={130}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={STEP_COLORS[index % STEP_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Drop-off table */}
        <div className="mt-4 space-y-2">
          {chartData.slice(1).map((step, idx) => (
            <div
              key={step.step}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-muted-foreground">
                {chartData[idx].step} → {step.step}
              </span>
              <span
                className={
                  (step.dropoffRate ?? 0) > 50
                    ? "text-destructive font-semibold"
                    : (step.dropoffRate ?? 0) > 20
                    ? "text-yellow-600"
                    : "text-green-600"
                }
              >
                {(step.dropoffRate ?? 0).toFixed(1)}% drop-off
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
