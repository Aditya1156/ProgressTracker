"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { chartDefaults, tooltipStyles, attendanceColors } from "@/lib/chart-config";

interface AttendanceDistributionChartProps {
  present: number;
  absent: number;
  late: number;
  excused: number;
}

export function AttendanceDistributionChart({
  present,
  absent,
  late,
  excused,
}: AttendanceDistributionChartProps) {
  const total = present + absent + late + excused;
  if (total === 0) return null;

  const data = [
    { name: "Present", value: present, color: attendanceColors.present },
    { name: "Absent", value: absent, color: attendanceColors.absent },
    { name: "Late", value: late, color: attendanceColors.late },
    { name: "Excused", value: excused, color: attendanceColors.excused },
  ].filter((d) => d.value > 0);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartDefaults.standardHeight}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              animationDuration={chartDefaults.animationDuration}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              {...tooltipStyles}
              formatter={(value) => [
                `${value} (${((Number(value) / total) * 100).toFixed(1)}%)`,
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
