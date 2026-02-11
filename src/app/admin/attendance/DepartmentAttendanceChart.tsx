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

interface DeptStat {
  name: string;
  fullName: string;
  avgAttendance: number;
  studentCount: number;
}

export function DepartmentAttendanceChart({ data }: { data: DeptStat[] }) {
  if (data.length === 0) return null;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Department-wise Attendance Rate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartDefaults.standardHeight}>
          <BarChart data={data} margin={chartDefaults.margin}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="name" {...axisStyle} />
            <YAxis
              {...axisStyle}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              {...tooltipStyles}
              formatter={(value) => [
                `${Number(value).toFixed(1)}%`,
                "Avg Attendance",
              ]}
              labelFormatter={(label) => {
                const item = data.find((d) => d.name === label);
                return item ? `${item.fullName} (${item.studentCount} students)` : label;
              }}
            />
            <ReferenceLine
              y={75}
              stroke="hsl(0, 72%, 51%)"
              strokeDasharray="4 4"
              label={{
                value: "75% min",
                position: "right",
                fontSize: 11,
                fill: "hsl(0, 72%, 51%)",
              }}
            />
            <Bar
              dataKey="avgAttendance"
              radius={[6, 6, 0, 0]}
              animationDuration={chartDefaults.animationDuration}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getAttendanceColor(entry.avgAttendance)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
