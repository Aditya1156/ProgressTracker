"use client";

import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { chartColors, chartDefaults, tooltipStyles, axisStyle, gridStyle } from "@/lib/chart-config";
import { formatDate } from "@/lib/utils";

interface PerformanceTrendChartProps {
  marks: any[];
  classAvgMap?: Record<string, number>;
}

export function PerformanceTrendChart({ marks, classAvgMap }: PerformanceTrendChartProps) {
  const chartData = marks
    .slice(0, 10)
    .reverse()
    .map((m) => {
      const exam = m.exams as any;
      const percentage = exam?.max_marks ? (m.marks_obtained / exam.max_marks) * 100 : 0;
      const date = exam?.exam_date ? new Date(exam.exam_date) : new Date(m.created_at);
      const subjectCode = exam?.subjects?.code || "Exam";
      const classAvg = classAvgMap?.[m.exam_id] ?? null;

      return {
        name: subjectCode,
        value: Math.round(percentage * 10) / 10,
        classAvg: classAvg != null ? Math.round(classAvg * 10) / 10 : null,
        fullName: exam?.name || "Exam",
        date: formatDate(date),
        score: `${m.marks_obtained}/${exam?.max_marks || 0}`,
      };
    });

  const hasClassAvg = chartData.some((d) => d.classAvg != null);

  if (chartData.length === 0) {
    return (
      <Card className="border-gray-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-800">Performance Trend</CardTitle>
          <CardDescription className="text-xs text-gray-400">Your scores over the last 10 exams</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 py-12 text-center">
            No exam data available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-gray-800">Performance Trend</CardTitle>
        <CardDescription className="text-xs text-gray-400">
          Your scores over the last {chartData.length} exams
          {hasClassAvg && " vs class average"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={chartDefaults.margin}>
            <defs>
              <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.4} />
                <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridStyle} vertical={false} />
            <XAxis
              dataKey="name"
              {...axisStyle}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              domain={[0, 100]}
              {...axisStyle}
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={tooltipStyles.contentStyle}
              labelStyle={tooltipStyles.labelStyle}
              itemStyle={tooltipStyles.itemStyle}
              formatter={(value?: number, name?: string) => {
                const label = name === "Class Avg" ? "Class Avg" : "Your Score";
                return [`${value ?? 0}%`, label];
              }}
            />
            <ReferenceLine
              y={75}
              stroke="hsl(142 76% 36%)"
              strokeDasharray="3 3"
              label={{ value: "Excellent", position: "right", fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            />
            <ReferenceLine
              y={50}
              stroke="hsl(38 92% 50%)"
              strokeDasharray="3 3"
              label={{ value: "Pass", position: "right", fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              name="Your Score"
              stroke={chartColors.primary}
              strokeWidth={3}
              fill="url(#performanceGradient)"
              animationDuration={chartDefaults.animationDuration}
            />
            {hasClassAvg && (
              <Line
                type="monotone"
                dataKey="classAvg"
                name="Class Avg"
                stroke="#9ca3af"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                animationDuration={chartDefaults.animationDuration}
                connectNulls
              />
            )}
            {hasClassAvg && (
              <Legend
                verticalAlign="top"
                align="right"
                iconSize={10}
                wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
