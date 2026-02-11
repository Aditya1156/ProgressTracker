import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  Target,
  ArrowRight,
  CalendarCheck,
} from "lucide-react";
import { classifyLearner, detectTrend, predictRisk, fmtPct, formatDate } from "@/lib/utils";
import Link from "next/link";
import { PerformanceTrendChart } from "./PerformanceTrendChart";
import { SubjectPerformanceChart } from "./SubjectPerformanceChart";

export default async function StudentDashboard() {
  const user = await getUser();
  const supabase = await createClient();

  // Get student record
  const { data: student } = await supabase
    .from("students")
    .select("id, roll_no, semester, department_id, departments(name)")
    .eq("profile_id", user.id)
    .single();

  if (!student) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-foreground">Welcome, {user.fullName}</h1>
        <Card className="glass-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Your student profile hasn&apos;t been set up yet.</p>
            <p className="text-sm mt-1">Please contact your department administrator.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get marks with exam & subject info
  const { data: marks } = await supabase
    .from("marks")
    .select(`
      marks_obtained,
      created_at,
      exams (
        name,
        type,
        max_marks,
        exam_date,
        subjects (name, code)
      )
    `)
    .eq("student_id", student.id)
    .order("created_at", { ascending: false });

  // Get unread feedback count
  const { count: unreadFeedback } = await supabase
    .from("feedback")
    .select("*", { count: "exact", head: true })
    .eq("student_id", student.id)
    .eq("is_read", false);

  // Get attendance data
  const { data: attendanceRecords } = await supabase
    .from("attendance")
    .select("status")
    .eq("student_id", student.id);

  const totalClasses = (attendanceRecords ?? []).length;
  const classesAttended = (attendanceRecords ?? []).filter(
    (r) => r.status === "present" || r.status === "late"
  ).length;
  const attendancePct = totalClasses > 0 ? (classesAttended / totalClasses) * 100 : -1;

  // ── Compute analytics ──
  const allMarks = marks ?? [];
  const percentages = allMarks.map((m) => {
    const exam = m.exams as any;
    return exam?.max_marks ? (m.marks_obtained / exam.max_marks) * 100 : 0;
  });

  const avg =
    percentages.length > 0
      ? percentages.reduce((a, b) => a + b, 0) / percentages.length
      : 0;

  const category = classifyLearner(avg);
  const trend = detectTrend(percentages.slice().reverse()); // oldest first for trend
  const risk = predictRisk(avg, trend.label);

  // Recent 5 results
  const recentResults = allMarks.slice(0, 5);

  // Subject-wise averages
  const subjectMap = new Map<string, { total: number; max: number; count: number }>();
  for (const m of allMarks) {
    const exam = m.exams as any;
    if (!exam?.subjects?.code || !exam?.max_marks) continue;
    const key = exam.subjects.code;
    const existing = subjectMap.get(key) || { total: 0, max: 0, count: 0 };
    existing.total += m.marks_obtained;
    existing.max += exam.max_marks;
    existing.count += 1;
    subjectMap.set(key, existing);
  }

  const subjectAverages = Array.from(subjectMap.entries())
    .map(([code, data]) => ({
      code,
      avg: (data.total / data.max) * 100,
      exams: data.count,
    }))
    .sort((a, b) => b.avg - a.avg);

  const TrendIcon =
    trend.label === "Improving"
      ? TrendingUp
      : trend.label === "Declining"
      ? TrendingDown
      : Minus;

  const deptName = (student as any).departments?.name ?? "";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Welcome back, {user.fullName.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {deptName} &middot; Semester {student.semester} &middot; Roll No: {student.roll_no}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-4 gap-4">
        {/* Overall Average */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Overall Average
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-foreground">
                {percentages.length > 0 ? fmtPct(avg) : "—"}
              </span>
              <Badge variant="secondary" className={`${category.bgColor} ${category.color} border-0 text-xs`}>
                {category.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Trend */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Performance Trend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendIcon className={`h-5 w-5 ${trend.color}`} />
              <span className={`text-lg font-medium ${trend.color}`}>
                {trend.label}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-semibold ${
                attendancePct >= 75 ? "text-emerald-600" : attendancePct >= 0 ? "text-red-600" : "text-foreground"
              }`}>
                {attendancePct >= 0 ? fmtPct(attendancePct) : "—"}
              </span>
              {attendancePct >= 0 && attendancePct < 75 && (
                <Badge variant="secondary" className="text-xs bg-red-50 text-red-700 border-0">
                  Below 75%
                </Badge>
              )}
            </div>
            {attendancePct >= 0 && (
              <Link href="/student/attendance" className="text-xs text-muted-foreground hover:text-foreground mt-1 inline-flex items-center gap-1">
                View details <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Exams Taken / Feedback */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">{allMarks.length}</span> exams taken
              </span>
            </div>
            {(unreadFeedback ?? 0) > 0 && (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-sm">
                  <span className="font-medium">{unreadFeedback}</span> new feedback
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Risk alert - only show if not safe */}
      {risk.level !== "Safe" && (
        <Card className="glass-card border-amber-500/20 bg-amber-500/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className={`h-2 w-2 rounded-full ${
                risk.level === "High Risk" ? "bg-red-500" :
                risk.level === "At Risk" ? "bg-orange-500" : "bg-amber-500"
              }`} />
              <p className="text-sm text-foreground/80">
                {risk.level === "High Risk"
                  ? "Your scores need urgent attention. Consider reaching out to your teacher."
                  : risk.level === "At Risk"
                  ? "Your performance is below expectations. Focus on weaker subjects."
                  : "You're close to the threshold. A bit more effort will help."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance alert */}
      {attendancePct >= 0 && attendancePct < 75 && (
        <Card className="glass-card border-red-500/20 bg-red-500/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <p className="text-sm text-foreground/80">
                Your attendance ({fmtPct(attendancePct)}) is below the minimum 75% threshold.
                You may be ineligible to sit for exams.
              </p>
              <Link href="/student/attendance" className="text-xs text-red-600 hover:underline ml-auto whitespace-nowrap">
                View Details
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Trend Chart */}
      {allMarks.length > 0 && (
        <div className="animate-fade-in animate-delay-300">
          <PerformanceTrendChart marks={allMarks} />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Results */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Results</CardTitle>
              <Link
                href="/student/results"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentResults.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No results yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentResults.map((m, i) => {
                  const exam = m.exams as any;
                  const pct = exam ? (m.marks_obtained / exam.max_marks) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {exam?.subjects?.code ?? "—"}: {exam?.name ?? "Exam"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {exam?.exam_date ? formatDate(exam.exam_date) : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {m.marks_obtained}/{exam?.max_marks ?? 0}
                          </p>
                          <p
                            className={`text-xs ${
                              pct >= 75
                                ? "text-emerald-600"
                                : pct >= 50
                                ? "text-amber-600"
                                : "text-red-600"
                            }`}
                          >
                            {fmtPct(pct)}
                          </p>
                        </div>
                      </div>
                      {i < recentResults.length - 1 && <Separator className="mt-3" />}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subject Performance */}
        <div className="animate-fade-in animate-delay-400">
          <SubjectPerformanceChart subjectAverages={subjectAverages} />
        </div>
      </div>
    </div>
  );
}
