"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceRadarChart } from "@/components/charts/PerformanceRadarChart";
import { fmtPct } from "@/lib/utils";

interface SubjectPerformanceChartProps {
  subjectAverages: Array<{
    code: string;
    avg: number;
    exams: number;
  }>;
}

export function SubjectPerformanceChart({ subjectAverages }: SubjectPerformanceChartProps) {
  const radarData = subjectAverages.map((s) => ({
    subject: s.code,
    value: Math.round(s.avg * 10) / 10,
    exams: s.exams,
  }));

  if (subjectAverages.length === 0) {
    return (
      <Card className="border-gray-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-800">Subject Performance</CardTitle>
          <CardDescription className="text-xs text-gray-400">Average across all exams</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 py-12 text-center">No data yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-gray-800">Subject Performance</CardTitle>
        <CardDescription className="text-xs text-gray-400">Comparative view across all subjects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="flex items-center justify-center">
            <PerformanceRadarChart data={radarData} height={260} />
          </div>

          {/* Breakdown */}
          <div className="space-y-3">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              Detailed Breakdown
            </p>
            {subjectAverages.map((s) => (
              <div key={s.code} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{s.code}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-xs ${
                      s.avg >= 75 ? "text-emerald-600" : s.avg >= 50 ? "text-amber-600" : "text-red-600"
                    }`}>
                      {fmtPct(s.avg)}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {s.exams} exam{s.exams !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      s.avg >= 75 ? "bg-emerald-500" : s.avg >= 50 ? "bg-amber-400" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(s.avg, 100)}%` }}
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
