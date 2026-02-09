"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StatCard from "@/components/StatCard";
import { ClassificationPieChart, PerformanceBarChart } from "@/components/Charts";
import { Users, TrendingUp, TrendingDown, AlertTriangle, Search } from "lucide-react";

interface AnalyticsItem {
  studentId: string;
  rollNo: string;
  name: string;
  department: string;
  batch: string;
  avgPercent: number;
  classification: { label: string; color: string; bgColor: string };
  trend: { label: string; color: string; icon: string };
  risk: { level: string; color: string };
  rank: number;
  examCount: number;
}

interface Summary {
  totalStudents: number;
  fastLearners: number;
  averageLearners: number;
  slowLearners: number;
  improving: number;
  declining: number;
  atRisk: number;
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/analytics");
        const data = await res.json();
        setAnalytics(data.analytics || []);
        setSummary(data.summary);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (status === "authenticated") fetchData();
  }, [status]);

  const filteredAnalytics = analytics.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(filter.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(filter.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || s.classification.label === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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

  const trendData = summary
    ? [
        { name: "Improving", value: summary.improving },
        { name: "Declining", value: summary.declining },
        { name: "Stable", value: (summary.totalStudents - summary.improving - summary.declining) },
      ]
    : [];

  const departmentAvg = analytics.reduce<Record<string, { total: number; count: number }>>((acc, s) => {
    if (!acc[s.department]) acc[s.department] = { total: 0, count: 0 };
    acc[s.department].total += s.avgPercent;
    acc[s.department].count += 1;
    return acc;
  }, {});

  const deptChartData = Object.entries(departmentAvg).map(([name, { total, count }]) => ({
    name,
    value: Math.round(total / count),
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">Data-driven insights on student performance</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={summary?.totalStudents || 0} icon={Users} color="text-blue-600" />
        <StatCard title="Fast Learners" value={summary?.fastLearners || 0} subtitle="Avg ≥ 75%" icon={TrendingUp} color="text-green-600" />
        <StatCard title="Slow Learners" value={summary?.slowLearners || 0} subtitle="Avg < 50%" icon={TrendingDown} color="text-yellow-600" />
        <StatCard title="At Risk" value={summary?.atRisk || 0} subtitle="May fail" icon={AlertTriangle} color="text-red-600" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <ClassificationPieChart data={pieData} title="Learner Classification" />
        <PerformanceBarChart data={trendData} title="Trend Distribution" color="#8b5cf6" />
        <PerformanceBarChart data={deptChartData} title="Dept Avg Performance (%)" color="#22c55e" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search by name or roll no..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Categories</option>
          <option value="Fast Learner">Fast Learners</option>
          <option value="Average Learner">Average Learners</option>
          <option value="Slow Learner">Slow Learners</option>
        </select>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold">Detailed Student Analytics</h3>
          <p className="text-sm text-slate-500">Showing {filteredAnalytics.length} students</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Roll No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Dept</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Exams</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Avg %</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Trend</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAnalytics.map((s) => (
                <tr key={s.studentId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 font-bold text-slate-900">#{s.rank}</td>
                  <td className="px-4 py-4 font-medium text-slate-900">{s.name}</td>
                  <td className="px-4 py-4 font-mono text-slate-600">{s.rollNo}</td>
                  <td className="px-4 py-4 text-slate-600">{s.department}</td>
                  <td className="px-4 py-4 text-slate-600">{s.examCount}</td>
                  <td className="px-4 py-4 font-semibold">{s.avgPercent}%</td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.classification.bgColor} ${s.classification.color}`}>
                      {s.classification.label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`font-medium ${s.trend.color}`}>
                      {s.trend.icon} {s.trend.label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`font-medium ${s.risk.color}`}>{s.risk.level}</span>
                  </td>
                </tr>
              ))}
              {filteredAnalytics.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    No data yet.
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
