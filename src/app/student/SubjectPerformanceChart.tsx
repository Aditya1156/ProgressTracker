"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceRadarChart } from "@/components/charts/PerformanceRadarChart";
import { fmtPct } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface SubjectPerformanceChartProps {
  subjectAverages: Array<{
    code: string;
    avg: number;
    exams: number;
  }>;
}

export function SubjectPerformanceChart({ subjectAverages }: SubjectPerformanceChartProps) {
  // Prepare data for radar chart
  const radarData = subjectAverages.map((s) => ({
    subject: s.code,
    value: Math.round(s.avg * 10) / 10, // Round to 1 decimal
    exams: s.exams,
  }));

  if (subjectAverages.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Subject Performance</CardTitle>
          <CardDescription>Average across all exams</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-12 text-center">
            No data yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Subject Performance</CardTitle>
        <CardDescription>Comparative view across all subjects</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Radar Chart Visualization */}
        <div className="animate-fade-in">
          <PerformanceRadarChart data={radarData} height={280} />
        </div>

        <Separator />

        {/* Detailed breakdown */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Detailed Breakdown
          </p>
          {subjectAverages.map((s) => (
            <div key={s.code} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">{s.code}</span>
                <span className="text-muted-foreground">
                  {fmtPct(s.avg)} ({s.exams} exam{s.exams !== 1 ? "s" : ""})
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    s.avg >= 75
                      ? "bg-emerald-500"
                      : s.avg >= 50
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(s.avg, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
