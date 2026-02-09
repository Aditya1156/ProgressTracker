"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StatCard from "@/components/StatCard";
import { ClassificationPieChart, PerformanceBarChart } from "@/components/Charts";
import { Users, FileText, BarChart3, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

interface Summary {
  totalStudents: number;
  fastLearners: number;
  averageLearners: number;
  slowLearners: number;
  improving: number;
  declining: number;
  atRisk: number;
}

interface AnalyticsItem {
  studentId: string;
  rollNo: string;
  name: string;
  department: string;
  avgPercent: number;
  classification: { label: string; color: string; bgColor: string };
  trend: { label: string; color: string; icon: string };
  risk: { level: string; color: string };
  rank: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsItem[]>([]);
  const [examCount, setExamCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (session?.user?.role !== "ADMIN" && status === "authenticated") router.push("/student");
  }, [session, status, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [analyticsRes, examsRes] = await Promise.all([
          fetch("/api/analytics"),
          fetch("/api/exams"),
        ]);
        const analyticsData = await analyticsRes.json();
        const examsData = await examsRes.json();
        setSummary(analyticsData.summary);
        setAnalytics(analyticsData.analytics);
        setExamCount(examsData.exams?.length || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (status === "authenticated") fetchData();
  }, [status]);

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pieData = summary
    ? [
        { name: "Fast Learner", value: summary.fastLearners },
        { name: "Average", value: summary.averageLearners },
        { name: "Slow Learner", value: summary.slowLearners },
      ]
    : [];

  const topStudents = analytics.slice(0, 10).map((s) => ({
    name: s.name.split(" ")[0],
    value: Math.round(s.avgPercent),
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Welcome back, {session?.user?.name}. Here&apos;s your overview.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={summary?.totalStudents || 0}
          icon={Users}
          color="text-blue-600"
        />
        <StatCard
          title="Total Exams"
          value={examCount}
          icon={FileText}
          color="text-purple-600"
        />
        <StatCard
          title="Improving"
          value={summary?.improving || 0}
          subtitle="Students showing upward trend"
          icon={TrendingUp}
          color="text-green-600"
        />
        <StatCard
          title="At Risk"
          value={summary?.atRisk || 0}
          subtitle="Need attention"
          icon={AlertTriangle}
          color="text-red-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ClassificationPieChart data={pieData} title="Learner Classification" />
        <PerformanceBarChart data={topStudents} title="Top 10 Students (Avg %)" color="#3b82f6" />
      </div>

      {/* Recent Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold">Student Rankings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Roll No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Dept</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Avg %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Trend</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {analytics.map((s) => (
                <tr key={s.studentId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">#{s.rank}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{s.name}</td>
                  <td className="px-6 py-4 text-slate-600">{s.rollNo}</td>
                  <td className="px-6 py-4 text-slate-600">{s.department}</td>
                  <td className="px-6 py-4 font-semibold">{s.avgPercent}%</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.classification.bgColor} ${s.classification.color}`}>
                      {s.classification.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${s.trend.color}`}>
                      {s.trend.icon} {s.trend.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${s.risk.color}`}>{s.risk.level}</span>
                  </td>
                </tr>
              ))}
              {analytics.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No data yet. Add students and enter exam marks to see analytics.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
