"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface FailureReason {
  reason: string;
  count: number;
  totalAmount?: number;
  percentage?: number;
}

interface FailureReasonChartProps {
  data: FailureReason[];
}

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: FailureReason }>;
}) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="font-medium text-sm">{d.reason}</p>
        <p className="text-sm text-muted-foreground">{d.count} failures</p>
        {d.totalAmount != null && (
          <p className="text-sm text-destructive">
            {formatCurrency(d.totalAmount, "usd")} lost
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function FailureReasonChart({ data }: FailureReasonChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Failure Reasons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.slice(0, 8).map((d) => ({
    ...d,
    name:
      d.reason.length > 28 ? d.reason.slice(0, 28) + "…" : d.reason,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Failure Reasons</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={100}
              paddingAngle={2}
              dataKey="count"
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) =>
                value.length > 22 ? value.slice(0, 22) + "…" : value
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
