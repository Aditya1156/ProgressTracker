"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformancePieChart } from "@/components/charts/PerformancePieChart";
import { chartColors } from "@/lib/chart-config";
import { Separator } from "@/components/ui/separator";

interface ExamTypesChartProps {
  examTypeStats: Array<{
    type: string;
    count: number;
    label: string;
  }>;
  totalExams: number;
}

export function ExamTypesChart({ examTypeStats, totalExams }: ExamTypesChartProps) {
  const validTypes = examTypeStats.filter((t) => t.count > 0).sort((a, b) => b.count - a.count);

  // Color palette for different exam types
  const colors = [
    chartColors.primary,
    chartColors.secondary,
    chartColors.tertiary,
    chartColors.quaternary,
    chartColors.quinary,
  ];

  const chartData = validTypes.map((type, index) => ({
    name: type.label,
    value: type.count,
    color: colors[index % colors.length],
  }));

  if (chartData.length === 0 || totalExams === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exam Type Distribution</CardTitle>
          <CardDescription>Number of exams by type</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 py-12 text-center">
            No exam data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Exam Type Distribution</CardTitle>
        <CardDescription>
          Distribution across {totalExams} total exam{totalExams !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pie Chart Visualization */}
        <div className="animate-fade-in">
          <PerformancePieChart data={chartData} height={320} showLegend={true} />
        </div>

        <Separator />

        {/* Detailed breakdown */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Detailed Breakdown
          </p>
          <div className="space-y-4">
            {validTypes.map((type) => (
              <div key={type.type} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800">{type.label}</span>
                  <span className="text-gray-500">
                    {type.count} exam{type.count !== 1 ? "s" : ""} (
                    {((type.count / totalExams) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${(type.count / totalExams) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
