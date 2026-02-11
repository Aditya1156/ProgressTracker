"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { chartColors, chartDefaults, tooltipStyles } from "@/lib/chart-config";

interface PerformanceRadarChartProps {
  data: Array<{
    subject: string;
    value: number;
    fullMark?: number;
  }>;
  height?: number;
  showLegend?: boolean;
}

export function PerformanceRadarChart({
  data,
  height = chartDefaults.standardHeight,
  showLegend = false,
}: PerformanceRadarChartProps) {
  // Ensure all data points have fullMark set to 100 for percentage scale
  const chartData = data.map((item) => ({
    ...item,
    fullMark: item.fullMark || 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={chartData}>
        <PolarGrid
          stroke="rgba(0,0,0,0.06)"
          strokeDasharray="3 3"
        />
        <PolarAngleAxis
          dataKey="subject"
          tick={{
            fill: "hsl(var(--foreground))",
            fontSize: 12,
            fontWeight: 500,
          }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
          tickCount={6}
        />
        <Tooltip
          contentStyle={tooltipStyles.contentStyle}
          labelStyle={tooltipStyles.labelStyle}
          itemStyle={tooltipStyles.itemStyle}
          formatter={(value) => [`${Number(value).toFixed(1)}%`, "Score"]}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{
              fontSize: "12px",
              color: "hsl(var(--foreground))",
            }}
          />
        )}
        <Radar
          name="Performance"
          dataKey="value"
          stroke={chartColors.primary}
          fill={chartColors.primary}
          fillOpacity={0.3}
          strokeWidth={2}
          animationDuration={chartDefaults.animationDuration}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
