"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceBarChart } from "@/components/charts/PerformanceBarChart";
import { fmtPct } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface DepartmentsChartProps {
  deptPerformance: Array<{
    id: string;
    name: string;
    full_name: string;
    avg: number;
    count: number;
  }>;
}

export function DepartmentsChart({ deptPerformance }: DepartmentsChartProps) {
  const validDepts = deptPerformance.filter((d) => d.count > 0).sort((a, b) => b.avg - a.avg);

  const chartData = validDepts.map((dept) => ({
    name: dept.full_name,
    value: Math.round(dept.avg * 10) / 10,
    count: dept.count,
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Department Performance</CardTitle>
          <CardDescription>Average performance by department</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-12 text-center">
            No department data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Department Performance</CardTitle>
        <CardDescription>
          Comparative analysis across {validDepts.length} department{validDepts.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bar Chart Visualization */}
        <div className="animate-fade-in">
          <PerformanceBarChart
            data={chartData}
            layout="horizontal"
            height={Math.max(250, chartData.length * 60)}
            colorByPerformance={true}
          />
        </div>

        <Separator />

        {/* Detailed breakdown */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Detailed Breakdown
          </p>
          <div className="space-y-4">
            {validDepts.map((dept) => (
              <div key={dept.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-slate-900">{dept.full_name}</span>
                    <span className="text-muted-foreground ml-2">
                      ({dept.count} result{dept.count !== 1 ? "s" : ""})
                    </span>
                  </div>
                  <span
                    className={`font-medium ${
                      dept.avg >= 60
                        ? "text-emerald-600"
                        : dept.avg >= 45
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    {fmtPct(dept.avg)}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      dept.avg >= 60
                        ? "bg-emerald-500"
                        : dept.avg >= 45
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(dept.avg, 100)}%` }}
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
