"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceLineChart } from "@/components/charts/PerformanceLineChart";
import { formatDate } from "@/lib/utils";

interface PerformanceTrendChartProps {
  marks: any[]; // Accept the Supabase query result type
}

export function PerformanceTrendChart({ marks }: PerformanceTrendChartProps) {
  // Prepare chart data (last 10 exams, chronological order)
  const chartData = marks
    .slice(0, 10)
    .reverse() // Oldest first for chronological display
    .map((m, idx) => {
      const exam = m.exams as any;
      const percentage = exam?.max_marks ? (m.marks_obtained / exam.max_marks) * 100 : 0;
      const date = exam?.exam_date ? new Date(exam.exam_date) : new Date(m.created_at);
      const subjectCode = exam?.subjects?.code || "Exam";

      return {
        name: `${subjectCode}`,
        value: Math.round(percentage * 10) / 10, // Round to 1 decimal
        fullName: exam?.name || "Exam",
        date: formatDate(date),
        score: `${m.marks_obtained}/${exam?.max_marks || 0}`,
      };
    });

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Performance Trend</CardTitle>
          <CardDescription>Your scores over the last 10 exams</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-12 text-center">
            No exam data available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Performance Trend</CardTitle>
        <CardDescription>Your scores over the last {chartData.length} exams</CardDescription>
      </CardHeader>
      <CardContent>
        <PerformanceLineChart
          data={chartData}
          height={250}
          showArea={true}
          showReferenceLines={true}
        />
      </CardContent>
    </Card>
  );
}
