"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StatCard from "@/components/StatCard";
import { ProgressLineChart } from "@/components/Charts";
import { classifyLearner, detectTrend, predictRisk } from "@/lib/utils";
import { Trophy, Target, TrendingUp, AlertTriangle, BookOpen, Award } from "lucide-react";

interface StudentData {
  student: {
    id: string;
    rollNo: string;
    department: string;
    batch: string;
    marks: {
      id: string;
      marksObtained: number;
      exam: { id: string; name: string; subject: string; maxMarks: number; date: string; type: string };
    }[];
    user: { name: string; email: string };
  };
  analytics: {
    avgPercent: number;
    recentScores: number[];
    totalMarks: number;
    totalMaxMarks: number;
  };
}

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rank, setRank] = useState<number | null>(null);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (session?.user?.role === "ADMIN" && status === "authenticated") router.push("/dashboard");
  }, [session, status, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const studentId = (session?.user as any)?.studentId;
        if (!studentId) return;

        const [studentRes, analyticsRes] = await Promise.all([
          fetch(`/api/students/${studentId}`),
          fetch("/api/analytics"),
        ]);
        const studentData = await studentRes.json();
        const analyticsData = await analyticsRes.json();

        setData(studentData);
        setTotalStudents(analyticsData.summary?.totalStudents || 0);

        // Find this student's rank
        const myAnalytics = analyticsData.analytics?.find(
          (a: any) => a.studentId === studentId
        );
        if (myAnalytics) setRank(myAnalytics.rank);
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

  if (!data?.student) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-500">Student data not found.</p>
      </div>
    );
  }

  const { student, analytics } = data;
  const classification = classifyLearner(analytics.avgPercent);
  const trend = detectTrend(analytics.recentScores);
  const risk = predictRisk(analytics.avgPercent, trend.label);

  // Chart data
  const chartData = student.marks.map((m) => ({
    name: `${m.exam.subject.substring(0, 6)}`,
    score: Math.round((m.marksObtained / m.exam.maxMarks) * 100),
  }));

  // Improvement tips based on classification
  const tips = [];
  if (classification.label === "Slow Learner") {
    tips.push("Focus on fundamentals and attend extra tutorials");
    tips.push("Practice regularly with previous exam papers");
    tips.push("Seek help from teachers for difficult topics");
  } else if (classification.label === "Average Learner") {
    tips.push("Consistent revision will help cross the 75% mark");
    tips.push("Focus on weak subjects to balance your score");
    tips.push("Try solving advanced problems for better understanding");
  } else {
    tips.push("Excellent! Maintain your consistency");
    tips.push("Help peers to reinforce your own understanding");
    tips.push("Explore advanced topics and competitive prep");
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold">Welcome, {student.user.name}!</h1>
        <p className="mt-2 text-blue-100">
          {student.department} | Batch {student.batch} | Roll No: {student.rollNo}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium bg-white/20`}>
            {classification.label}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium bg-white/20`}>
            {trend.icon} {trend.label}
          </span>
          {risk.level !== "Safe" && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-500/30">
              ⚠ {risk.level}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Average Score"
          value={`${Math.round(analytics.avgPercent)}%`}
          icon={Target}
          color={classification.color}
        />
        <StatCard
          title="Class Rank"
          value={rank ? `#${rank}` : "N/A"}
          subtitle={`out of ${totalStudents} students`}
          icon={Trophy}
          color="text-yellow-600"
        />
        <StatCard
          title="Exams Taken"
          value={student.marks.length}
          icon={BookOpen}
          color="text-purple-600"
        />
        <StatCard
          title="Total Marks"
          value={`${analytics.totalMarks}/${analytics.totalMaxMarks}`}
          icon={Award}
          color="text-blue-600"
        />
      </div>

      {/* Progress Chart */}
      <ProgressLineChart data={chartData} title="Performance Trend Across Exams" />

      {/* Recent Results & Tips side by side */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Exams */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold">Recent Exam Results</h3>
          </div>
          <div className="divide-y divide-slate-200">
            {student.marks.slice(-5).reverse().map((m) => {
              const pct = Math.round((m.marksObtained / m.exam.maxMarks) * 100);
              return (
                <div key={m.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{m.exam.name}</p>
                    <p className="text-sm text-slate-500">{m.exam.subject} | {m.exam.type.replace("_", " ")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">{m.marksObtained}/{m.exam.maxMarks}</p>
                    <p className={`text-sm font-medium ${pct >= 75 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                      {pct}%
                    </p>
                  </div>
                </div>
              );
            })}
            {student.marks.length === 0 && (
              <div className="px-6 py-12 text-center text-slate-400">
                No exam results yet.
              </div>
            )}
          </div>
        </div>

        {/* Improvement Tips */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">💡 Improvement Suggestions</h3>
          <div className="space-y-3">
            {tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="mt-0.5 text-blue-600 font-bold">{i + 1}.</span>
                <p className="text-slate-700">{tip}</p>
              </div>
            ))}
          </div>

          {/* Classification badge */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Your Classification</p>
            <p className={`text-2xl font-bold ${classification.color}`}>
              {classification.label}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Based on {student.marks.length} exam(s) with an average of {Math.round(analytics.avgPercent)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
