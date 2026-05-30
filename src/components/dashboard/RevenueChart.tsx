"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

// Supports both data formats
interface DailyTrend {
  date: string;
  count?: number;
  amount?: number;
  failures?: number;
}

interface RevenueChartProps {
  data: DailyTrend[];
  title?: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} className="text-sm text-muted-foreground">
            {entry.name === "amount"
              ? `Revenue Lost: ${formatCurrency(entry.value, "usd")}`
              : `Failures: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function RevenueChart({
  data,
  title = "Revenue Lost Over Time",
}: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Normalize data format
  const chartData = data.map((d) => ({
    date:
      typeof d.date === "string" && d.date.includes("-")
        ? new Date(d.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : d.date,
    amount: d.amount ?? 0,
    failures: d.failures ?? d.count ?? 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 100).toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#colorAmount)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
