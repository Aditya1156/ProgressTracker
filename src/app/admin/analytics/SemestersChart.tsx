"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceBarChart } from "@/components/charts/PerformanceBarChart";
import { fmtPct } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface SemestersChartProps {
  semesterStats: Array<{
    semester: number;
    studentCount: number;
    avg: number;
  }>;
}

export function SemestersChart({ semesterStats }: SemestersChartProps) {
  const chartData = semesterStats.map((sem) => ({
    name: `Sem ${sem.semester}`,
    value: Math.round(sem.avg * 10) / 10,
    studentCount: sem.studentCount,
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Semester-wise Analysis</CardTitle>
          <CardDescription>Performance across semesters</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 py-12 text-center">
            No semester data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Semester-wise Analysis</CardTitle>
        <CardDescription>
          Performance progression across {semesterStats.length} semester{semesterStats.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bar Chart Visualization */}
        <div className="animate-fade-in">
          <PerformanceBarChart
            data={chartData}
            layout="vertical"
            height={320}
            colorByPerformance={true}
          />
        </div>

        <Separator />

        {/* Detailed breakdown */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Detailed Breakdown
          </p>
          <div className="space-y-4">
            {semesterStats.map((sem) => (
              <div key={sem.semester} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-800">Semester {sem.semester}</span>
                    <span className="text-gray-400 ml-2">
                      ({sem.studentCount} student{sem.studentCount !== 1 ? "s" : ""})
                    </span>
                  </div>
                  <span
                    className={`font-medium ${
                      sem.avg >= 60
                        ? "text-emerald-600"
                        : sem.avg >= 45
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    {fmtPct(sem.avg)}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      sem.avg >= 60
                        ? "bg-emerald-500"
                        : sem.avg >= 45
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(sem.avg, 100)}%` }}
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
