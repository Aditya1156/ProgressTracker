"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { chartColors, chartDefaults, tooltipStyles } from "@/lib/chart-config";

interface PerformancePieChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  height?: number;
  showLegend?: boolean;
}

const COLORS = [
  chartColors.excellent,
  chartColors.good,
  chartColors.average,
  chartColors.poor,
];

export function PerformancePieChart({
  data,
  height = chartDefaults.standardHeight,
  showLegend = true,
}: PerformancePieChartProps) {
  // Custom label renderer
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Hide label if slice is too small

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={14}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={height / 3}
          innerRadius={height / 6}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={2}
          fill="#8884d8"
          dataKey="value"
          animationDuration={chartDefaults.animationDuration}
          animationBegin={chartDefaults.animationBegin}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyles.contentStyle}
          labelStyle={tooltipStyles.labelStyle}
          itemStyle={tooltipStyles.itemStyle}
        />
        {showLegend && (
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{
              fontSize: "12px",
              color: "hsl(var(--foreground))",
            }}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}
