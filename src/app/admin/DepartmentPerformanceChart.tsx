"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceBarChart } from "@/components/charts/PerformanceBarChart";
import { fmtPct } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface DepartmentPerformanceChartProps {
  deptStats: Array<{
    id: string;
    name: string;
    avg: number;
    studentCount: number;
  }>;
}

export function DepartmentPerformanceChart({ deptStats }: DepartmentPerformanceChartProps) {
  // Filter and sort departments
  const validDepts = deptStats
    .filter((d) => d.avg >= 0)
    .sort((a, b) => b.avg - a.avg);

  // Prepare data for bar chart
  const chartData = validDepts.map((d) => ({
    name: d.name,
    value: Math.round(d.avg * 10) / 10, // Round to 1 decimal
    studentCount: d.studentCount,
  }));

  if (chartData.length === 0) {
    return (
      <Card className="border-gray-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-800">Department Performance</CardTitle>
          <CardDescription className="text-xs text-gray-400">Average scores by department</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 py-12 text-center">
            No departments configured.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-gray-800">Department Performance</CardTitle>
        <CardDescription className="text-xs text-gray-400">Comparative analysis across departments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bar Chart Visualization */}
        <div className="animate-fade-in">
          <PerformanceBarChart
            data={chartData}
            layout="horizontal"
            height={Math.max(200, chartData.length * 60)}
            colorByPerformance={true}
          />
        </div>

        <Separator />

        {/* Detailed breakdown */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Detailed Breakdown
          </p>
          {validDepts.map((d) => (
            <div key={d.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-800">{d.name}</span>
                  <span className="text-gray-400 ml-2">
                    ({d.studentCount} student{d.studentCount !== 1 ? "s" : ""})
                  </span>
                </div>
                <span
                  className={`font-medium ${
                    d.avg >= 60
                      ? "text-emerald-600"
                      : d.avg >= 45
                      ? "text-amber-600"
                      : "text-red-600"
                  }`}
                >
                  {fmtPct(d.avg)}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    d.avg >= 60
                      ? "bg-emerald-500"
                      : d.avg >= 45
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(d.avg, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
