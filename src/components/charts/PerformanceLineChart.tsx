"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import { chartColors, chartDefaults, tooltipStyles, axisStyle, gridStyle } from "@/lib/chart-config";

interface PerformanceLineChartProps {
  data: Array<{
    name: string;
    value: number;
    [key: string]: any;
  }>;
  dataKey?: string;
  nameKey?: string;
  height?: number;
  showArea?: boolean;
  showReferenceLines?: boolean;
}

export function PerformanceLineChart({
  data,
  dataKey = "value",
  nameKey = "name",
  height = chartDefaults.standardHeight,
  showArea = false,
  showReferenceLines = true,
}: PerformanceLineChartProps) {
  const ChartComponent = showArea ? AreaChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent
        data={data}
        margin={chartDefaults.margin}
      >
        {showArea && (
          <defs>
            <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.4} />
              <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0.05} />
            </linearGradient>
          </defs>
        )}
        <CartesianGrid {...gridStyle} vertical={false} />
        <XAxis
          dataKey={nameKey}
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
        />

        {showReferenceLines && (
          <>
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
          </>
        )}

        {showArea ? (
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={chartColors.primary}
            strokeWidth={3}
            fill="url(#performanceGradient)"
            animationDuration={chartDefaults.animationDuration}
          />
        ) : (
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={chartColors.primary}
            strokeWidth={3}
            dot={{ r: 6, fill: chartColors.primary, strokeWidth: 2, stroke: "hsl(var(--card))" }}
            activeDot={{ r: 8 }}
            animationDuration={chartDefaults.animationDuration}
          />
        )}
      </ChartComponent>
    </ResponsiveContainer>
  );
}
