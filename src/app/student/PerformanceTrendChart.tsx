"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceLineChart } from "@/components/charts/PerformanceLineChart";
import { formatDate } from "@/lib/utils";

interface PerformanceTrendChartProps {
  marks: any[];
}

export function PerformanceTrendChart({ marks }: PerformanceTrendChartProps) {
  const chartData = marks
    .slice(0, 10)
    .reverse()
    .map((m) => {
      const exam = m.exams as any;
      const percentage = exam?.max_marks ? (m.marks_obtained / exam.max_marks) * 100 : 0;
      const date = exam?.exam_date ? new Date(exam.exam_date) : new Date(m.created_at);
      const subjectCode = exam?.subjects?.code || "Exam";

      return {
        name: `${subjectCode}`,
        value: Math.round(percentage * 10) / 10,
        fullName: exam?.name || "Exam",
        date: formatDate(date),
        score: `${m.marks_obtained}/${exam?.max_marks || 0}`,
      };
    });

  if (chartData.length === 0) {
    return (
      <Card className="border-gray-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-800">Performance Trend</CardTitle>
          <CardDescription className="text-xs text-gray-400">Your scores over the last 10 exams</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 py-12 text-center">
            No exam data available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-gray-800">Performance Trend</CardTitle>
        <CardDescription className="text-xs text-gray-400">
          Your scores over the last {chartData.length} exams
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PerformanceLineChart
          data={chartData}
          height={240}
          showArea={true}
          showReferenceLines={true}
        />
      </CardContent>
    </Card>
  );
}
