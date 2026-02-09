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
} from "lucide-react";
import { classifyLearner, detectTrend, predictRisk, fmtPct, formatDate } from "@/lib/utils";
import Link from "next/link";

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
        <h1 className="text-xl font-semibold text-slate-900">Welcome, {user.fullName}</h1>
        <Card>
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
        <h1 className="text-xl font-semibold text-slate-900">
          Welcome back, {user.fullName.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {deptName} &middot; Semester {student.semester} &middot; Roll No: {student.roll_no}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* Overall Average */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Overall Average
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-900">
                {percentages.length > 0 ? fmtPct(avg) : "—"}
              </span>
              <Badge variant="secondary" className={`${category.bgColor} ${category.color} border-0 text-xs`}>
                {category.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Trend */}
        <Card>
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

        {/* Exams Taken / Feedback */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-slate-500" />
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
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className={`h-2 w-2 rounded-full ${
                risk.level === "High Risk" ? "bg-red-500" :
                risk.level === "At Risk" ? "bg-orange-500" : "bg-amber-500"
              }`} />
              <p className="text-sm text-slate-700">
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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Results */}
        <Card>
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
                          <p className="text-sm font-medium text-slate-900">
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Subject Performance</CardTitle>
            <CardDescription>Average across all exams</CardDescription>
          </CardHeader>
          <CardContent>
            {subjectAverages.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No data yet.
              </p>
            ) : (
              <div className="space-y-3">
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
