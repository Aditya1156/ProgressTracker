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
import { chartColors, chartDefaults, tooltipStyles, axisStyle, gridStyle, getPerformanceColor } from "@/lib/chart-config";

interface PerformanceBarChartProps {
  data: Array<{
    name: string;
    value: number;
    [key: string]: any;
  }>;
  dataKey?: string;
  nameKey?: string;
  height?: number;
  layout?: "horizontal" | "vertical";
  colorByPerformance?: boolean;
}

export function PerformanceBarChart({
  data,
  dataKey = "value",
  nameKey = "name",
  height = chartDefaults.standardHeight,
  layout = "vertical",
  colorByPerformance = true,
}: PerformanceBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={layout}
        margin={chartDefaults.margin}
      >
        <CartesianGrid {...gridStyle} />
        {layout === "vertical" ? (
          <>
            <XAxis type="number" domain={[0, 100]} {...axisStyle} tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <YAxis type="category" dataKey={nameKey} {...axisStyle} tick={{ fill: "hsl(var(--muted-foreground))" }} width={80} />
          </>
        ) : (
          <>
            <XAxis dataKey={nameKey} {...axisStyle} tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <YAxis domain={[0, 100]} {...axisStyle} tick={{ fill: "hsl(var(--muted-foreground))" }} />
          </>
        )}
        <Tooltip
          contentStyle={tooltipStyles.contentStyle}
          labelStyle={tooltipStyles.labelStyle}
          itemStyle={tooltipStyles.itemStyle}
        />
        <Bar
          dataKey={dataKey}
          fill={chartColors.primary}
          radius={layout === "vertical" ? [0, 4, 4, 0] : [4, 4, 0, 0]}
          animationDuration={chartDefaults.animationDuration}
        >
          {colorByPerformance &&
            data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getPerformanceColor(entry[dataKey])} />
            ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
