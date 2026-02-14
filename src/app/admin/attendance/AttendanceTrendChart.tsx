"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  chartDefaults,
  tooltipStyles,
  axisStyle,
  gridStyle,
  chartColors,
} from "@/lib/chart-config";

interface TrendDataPoint {
  week: string;
  rate: number;
  total: number;
}

export function AttendanceTrendChart({ data }: { data: TrendDataPoint[] }) {
  if (data.length === 0) return null;

  return (
    <Card className="border-gray-200/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Attendance Trend (Weekly)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartDefaults.standardHeight}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="week" {...axisStyle} />
            <YAxis
              {...axisStyle}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              {...tooltipStyles}
              formatter={(value) => [
                `${Number(value).toFixed(1)}%`,
                "Attendance Rate",
              ]}
            />
            <ReferenceLine
              y={75}
              stroke="hsl(0, 72%, 51%)"
              strokeDasharray="4 4"
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke={chartColors.primary}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={chartDefaults.animationDuration}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
