// Chart color mappings and configuration utilities

export const chartColors = {
  // Performance-based colors
  excellent: "hsl(var(--chart-1))", // emerald
  good: "hsl(var(--chart-2))", // blue
  average: "hsl(var(--chart-4))", // amber
  poor: "hsl(var(--chart-5))", // red/orange

  // Primary chart colors
  primary: "hsl(var(--chart-1))",
  secondary: "hsl(var(--chart-2))",
  tertiary: "hsl(var(--chart-3))",
  quaternary: "hsl(var(--chart-4))",
  quinary: "hsl(var(--chart-5))",

  // Semantic colors using OKLCH from globals.css
  success: "oklch(0.646 0.222 41.116)", // emerald-like
  info: "oklch(0.6 0.118 184.704)", // blue-like
  warning: "oklch(0.828 0.189 84.429)", // amber-like
  danger: "oklch(0.769 0.188 70.08)", // red/orange-like
};

export const chartDefaults = {
  // Default margins for charts
  margin: { top: 5, right: 20, bottom: 5, left: 0 },

  // Animation settings
  animationDuration: 800,
  animationEasing: "ease-out" as const,
  animationBegin: 0,

  // Responsive settings
  minHeight: 200,
  standardHeight: 300,
  largeHeight: 400,
};

export const tooltipStyles = {
  contentStyle: {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "var(--radius)",
    padding: "8px 12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  },
  labelStyle: {
    color: "hsl(var(--foreground))",
    fontWeight: 600,
    marginBottom: "4px",
  },
  itemStyle: {
    color: "hsl(var(--muted-foreground))",
  },
};

// Helper to get color based on percentage performance
export function getPerformanceColor(percentage: number): string {
  if (percentage >= 75) return chartColors.excellent;
  if (percentage >= 60) return chartColors.good;
  if (percentage >= 40) return chartColors.average;
  return chartColors.poor;
}

// Helper to get performance label
export function getPerformanceLabel(percentage: number): string {
  if (percentage >= 75) return "Excellent";
  if (percentage >= 60) return "Good";
  if (percentage >= 40) return "Average";
  return "Needs Improvement";
}

// Helper to format chart data with colors
export function formatPerformanceData(data: Array<{ name: string; value: number }>) {
  return data.map((item) => ({
    ...item,
    color: getPerformanceColor(item.value),
    label: getPerformanceLabel(item.value),
  }));
}

// Common axis styling
export const axisStyle = {
  stroke: "hsl(var(--muted-foreground))",
  fontSize: 12,
  fontFamily: "inherit",
};

// Grid styling
export const gridStyle = {
  stroke: "hsl(var(--border))",
  strokeDasharray: "3 3",
};
