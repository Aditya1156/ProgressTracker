"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  chartDefaults,
  tooltipStyles,
  axisStyle,
  gridStyle,
  getAttendanceColor,
} from "@/lib/chart-config";
import { ATTENDANCE_THRESHOLD } from "@/lib/attendance";

interface SubjectAttendanceChartProps {
  data: Array<{ code: string; name: string; percentage: number; total: number }>;
}

export function SubjectAttendanceChart({
  data,
}: SubjectAttendanceChartProps) {
  if (data.length === 0) return null;

  return (
    <Card className="border-gray-200/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Subject-wise Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartDefaults.standardHeight}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 20, bottom: 20, left: 0 }}
          >
            <CartesianGrid {...gridStyle} />
            <XAxis
              dataKey="code"
              {...axisStyle}
              angle={-30}
              textAnchor="end"
              height={50}
            />
            <YAxis {...axisStyle} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              {...tooltipStyles}
              formatter={(value) => [`${Number(value).toFixed(1)}%`, "Attendance"]}
              labelFormatter={(label) => {
                const item = data.find((d) => d.code === label);
                return item ? `${item.code} - ${item.name}` : label;
              }}
            />
            <ReferenceLine
              y={ATTENDANCE_THRESHOLD}
              stroke="hsl(0, 72%, 51%)"
              strokeDasharray="4 4"
              label={{
                value: `${ATTENDANCE_THRESHOLD}% min`,
                position: "right",
                fontSize: 11,
                fill: "hsl(0, 72%, 51%)",
              }}
            />
            <Bar
              dataKey="percentage"
              radius={[6, 6, 0, 0]}
              animationDuration={chartDefaults.animationDuration}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getAttendanceColor(entry.percentage)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
