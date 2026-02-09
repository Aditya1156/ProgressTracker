"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ProgressLineChart, PerformanceBarChart } from "@/components/Charts";
import { classifyLearner, detectTrend, predictRisk } from "@/lib/utils";

export default function StudentProgressPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [marks, setMarks] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const studentId = (session?.user as any)?.studentId;
        if (!studentId) return;
        const res = await fetch(`/api/students/${studentId}`);
        const data = await res.json();
        setMarks(data.student?.marks || []);
        setAnalytics(data.analytics);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (status === "authenticated") fetchData();
  }, [status, session]);

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-500">No progress data available yet.</p>
      </div>
    );
  }

  const classification = classifyLearner(analytics.avgPercent);
  const trend = detectTrend(analytics.recentScores);
  const risk = predictRisk(analytics.avgPercent, trend.label);

  // Line chart: scores over time
  const progressData = marks.map((m: any) => ({
    name: m.exam.subject.substring(0, 8),
    score: Math.round((m.marksObtained / m.exam.maxMarks) * 100),
  }));

  // Bar chart: subject-wise performance
  const subjectMap: Record<string, { total: number; max: number; count: number }> = {};
  marks.forEach((m: any) => {
    if (!subjectMap[m.exam.subject]) subjectMap[m.exam.subject] = { total: 0, max: 0, count: 0 };
    subjectMap[m.exam.subject].total += m.marksObtained;
    subjectMap[m.exam.subject].max += m.exam.maxMarks;
    subjectMap[m.exam.subject].count += 1;
  });

  const subjectData = Object.entries(subjectMap).map(([name, { total, max }]) => ({
    name,
    value: Math.round((total / max) * 100),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Progress</h1>
        <p className="text-slate-500 mt-1">Track your academic performance over time</p>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-6">
        <div className={`rounded-xl p-6 border ${classification.bgColor} border-slate-200`}>
          <p className="text-sm font-medium text-slate-600">Classification</p>
          <p className={`text-2xl font-bold mt-1 ${classification.color}`}>{classification.label}</p>
          <p className="text-sm text-slate-500 mt-1">Avg: {Math.round(analytics.avgPercent)}%</p>
        </div>
        <div className="rounded-xl p-6 border border-slate-200 bg-white">
          <p className="text-sm font-medium text-slate-600">Performance Trend</p>
          <p className={`text-2xl font-bold mt-1 ${trend.color}`}>
            {trend.icon} {trend.label}
          </p>
          <p className="text-sm text-slate-500 mt-1">Based on last {Math.min(marks.length, 5)} exams</p>
        </div>
        <div className="rounded-xl p-6 border border-slate-200 bg-white">
          <p className="text-sm font-medium text-slate-600">Risk Level</p>
          <p className={`text-2xl font-bold mt-1 ${risk.color}`}>{risk.level}</p>
          <p className="text-sm text-slate-500 mt-1">
            {risk.level === "Safe" ? "Keep it up!" : "Focus on improvement"}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ProgressLineChart data={progressData} title="Score Trend Over Exams" />
        <PerformanceBarChart data={subjectData} title="Subject-wise Average (%)" color="#8b5cf6" />
      </div>
    </div>
  );
}
