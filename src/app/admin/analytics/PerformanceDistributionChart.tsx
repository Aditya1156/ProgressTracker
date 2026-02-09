"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformancePieChart } from "@/components/charts/PerformancePieChart";
import { chartColors } from "@/lib/chart-config";
import { fmtPct } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface PerformanceDistributionChartProps {
  excellentCount: number;
  goodCount: number;
  averageCount: number;
  poorCount: number;
  totalCount: number;
}

export function PerformanceDistributionChart({
  excellentCount,
  goodCount,
  averageCount,
  poorCount,
  totalCount,
}: PerformanceDistributionChartProps) {
  const chartData = [
    {
      name: "Excellent (75%+)",
      value: excellentCount,
      color: chartColors.excellent,
    },
    {
      name: "Good (60-74%)",
      value: goodCount,
      color: chartColors.good,
    },
    {
      name: "Average (40-59%)",
      value: averageCount,
      color: chartColors.average,
    },
    {
      name: "Needs Improvement (<40%)",
      value: poorCount,
      color: chartColors.poor,
    },
  ].filter((item) => item.value > 0); // Only show non-zero categories

  if (totalCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance Category Distribution</CardTitle>
          <CardDescription>Student performance across all exams</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-12 text-center">
            No performance data available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Performance Category Distribution</CardTitle>
        <CardDescription>
          Student performance across all {totalCount.toLocaleString()} exam results
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
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Detailed Breakdown
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-emerald-700">Excellent (75%+)</span>
                <span className="text-slate-600">
                  {excellentCount} ({fmtPct((excellentCount / totalCount) * 100)})
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${(excellentCount / totalCount) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-blue-700">Good (60-74%)</span>
                <span className="text-slate-600">
                  {goodCount} ({fmtPct((goodCount / totalCount) * 100)})
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(goodCount / totalCount) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-amber-700">Average (40-59%)</span>
                <span className="text-slate-600">
                  {averageCount} ({fmtPct((averageCount / totalCount) * 100)})
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${(averageCount / totalCount) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-red-700">Needs Improvement (&lt;40%)</span>
                <span className="text-slate-600">
                  {poorCount} ({fmtPct((poorCount / totalCount) * 100)})
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{ width: `${(poorCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
