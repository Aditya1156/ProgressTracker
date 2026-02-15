import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import {
  Card,
  CardContent,
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
  BarChart3,
  AlertTriangle,
  GraduationCap,
  MessageSquare,
  Clock,
  Trophy,
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
      <div className="space-y-4 max-w-5xl">
        <h1 className="text-lg font-semibold">Welcome, {user.fullName}</h1>
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
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
      exam_id,
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

  // Get attendance data WITH subject info for per-subject breakdown
  const { data: attendanceRecords } = await supabase
    .from("attendance")
    .select("status, subjects(code, name)")
    .eq("student_id", student.id);

  const allAttendance = attendanceRecords ?? [];
  const totalClasses = allAttendance.length;
  const classesAttended = allAttendance.filter(
    (r) => r.status === "present" || r.status === "late"
  ).length;
  const attendancePct = totalClasses > 0 ? (classesAttended / totalClasses) * 100 : -1;

  // Subject-wise attendance breakdown
  const subjectAttMap = new Map<string, { name: string; present: number; total: number }>();
  for (const rec of allAttendance) {
    const subj = rec.subjects as any;
    if (!subj?.code) continue;
    const existing = subjectAttMap.get(subj.code) || { name: subj.name, present: 0, total: 0 };
    existing.total += 1;
    if (rec.status === "present" || rec.status === "late") existing.present += 1;
    subjectAttMap.set(subj.code, existing);
  }
  const subjectAttendance = Array.from(subjectAttMap.entries())
    .map(([code, d]) => ({ code, name: d.name, present: d.present, total: d.total, pct: (d.present / d.total) * 100 }))
    .sort((a, b) => a.pct - b.pct);
  const lowAttSubjects = subjectAttendance.filter((s) => s.pct < 75);

  // ── Compute marks analytics ──
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
  const trend = detectTrend(percentages.slice().reverse());
  const risk = predictRisk(avg, trend.label);

  // Exam type averages
  const typeMap = new Map<string, { total: number; max: number; count: number }>();
  for (const m of allMarks) {
    const exam = m.exams as any;
    if (!exam?.type || !exam?.max_marks) continue;
    const existing = typeMap.get(exam.type) || { total: 0, max: 0, count: 0 };
    existing.total += m.marks_obtained;
    existing.max += exam.max_marks;
    existing.count += 1;
    typeMap.set(exam.type, existing);
  }
  const examTypeLabels: Record<string, string> = {
    class_test: "Class Tests",
    mid_sem: "Mid Semester",
    end_sem: "End Semester",
    assignment: "Assignments",
    practical: "Practicals",
  };
  const examTypeAvgs = Array.from(typeMap.entries())
    .map(([type, d]) => ({
      type,
      label: examTypeLabels[type] || type,
      avg: (d.total / d.max) * 100,
      count: d.count,
    }))
    .sort((a, b) => b.avg - a.avg);

  // Recent 5 results
  const recentResults = allMarks.slice(0, 5);

  // Subject-wise mark averages
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

  // ── Class rank & class average for trend ──
  const examIds = [...new Set(allMarks.map((m) => m.exam_id))];
  let rank = -1;
  let totalStudents = 0;
  let percentile = 0;
  let classAvgForTrend: Record<string, number> = {};

  if (examIds.length > 0) {
    const admin = createAdminClient();
    const { data: classMarks } = await admin
      .from("marks")
      .select("student_id, exam_id, marks_obtained, exams(max_marks)")
      .in("exam_id", examIds);

    const allClassMarks = classMarks ?? [];

    // Per-exam class average (for trend chart)
    const examGroups: Record<string, number[]> = {};
    for (const m of allClassMarks) {
      const exam = m.exams as any;
      const maxMarks = exam?.max_marks ?? 0;
      if (maxMarks > 0) {
        const pct = (m.marks_obtained / maxMarks) * 100;
        if (!examGroups[m.exam_id]) examGroups[m.exam_id] = [];
        examGroups[m.exam_id].push(pct);
      }
    }
    for (const [eid, pcts] of Object.entries(examGroups)) {
      classAvgForTrend[eid] = pcts.reduce((a, b) => a + b, 0) / pcts.length;
    }

    // Per-student overall average → rank
    const studentAvgs: Record<string, { total: number; count: number }> = {};
    for (const m of allClassMarks) {
      const exam = m.exams as any;
      const maxMarks = exam?.max_marks ?? 0;
      if (maxMarks > 0) {
        if (!studentAvgs[m.student_id]) studentAvgs[m.student_id] = { total: 0, count: 0 };
        studentAvgs[m.student_id].total += (m.marks_obtained / maxMarks) * 100;
        studentAvgs[m.student_id].count += 1;
      }
    }
    const sorted = Object.entries(studentAvgs)
      .map(([sid, d]) => ({ sid, avg: d.total / d.count }))
      .sort((a, b) => b.avg - a.avg);

    totalStudents = sorted.length;
    const pos = sorted.findIndex((s) => s.sid === student.id);
    rank = pos >= 0 ? pos + 1 : -1;
    percentile = totalStudents > 0 && rank > 0
      ? ((totalStudents - rank) / totalStudents) * 100
      : 0;
  }

  const TrendIcon =
    trend.label === "Improving"
      ? TrendingUp
      : trend.label === "Declining"
      ? TrendingDown
      : Minus;

  const deptName = (student as any).departments?.name ?? "";

  return (
    <div className="space-y-5 max-w-5xl">
      {/* ─── Welcome Header ─── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f1b4c]">
            Welcome back, {user.fullName.split(" ")[0]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {deptName} &middot; Semester {student.semester} &middot; {student.roll_no}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5">
          <GraduationCap className="h-4 w-4 text-[#0f1b4c]/40" />
          <span className="text-xs text-gray-400">Semester {student.semester}</span>
        </div>
      </div>

      {/* ─── Summary Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Average */}
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="pt-4 pb-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-lg bg-[#0f1b4c]/5 flex items-center justify-center">
                <BarChart3 className="h-3.5 w-3.5 text-[#0f1b4c]" />
              </div>
              <span className="text-[11px] text-gray-400 uppercase tracking-wider">Average</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0f1b4c]">
                {percentages.length > 0 ? fmtPct(avg) : "—"}
              </span>
            </div>
            <Badge variant="secondary" className={`${category.bgColor} ${category.color} border-0 text-[10px] mt-1.5`}>
              {category.label}
            </Badge>
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="pt-4 pb-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                attendancePct >= 75 ? "bg-emerald-50" : attendancePct >= 0 ? "bg-red-50" : "bg-gray-50"
              }`}>
                <CalendarCheck className={`h-3.5 w-3.5 ${
                  attendancePct >= 75 ? "text-emerald-600" : attendancePct >= 0 ? "text-red-500" : "text-gray-400"
                }`} />
              </div>
              <span className="text-[11px] text-gray-400 uppercase tracking-wider">Attendance</span>
            </div>
            <span className={`text-2xl font-bold ${
              attendancePct >= 75 ? "text-emerald-600" : attendancePct >= 0 ? "text-red-600" : "text-gray-900"
            }`}>
              {attendancePct >= 0 ? fmtPct(attendancePct) : "—"}
            </span>
            {attendancePct >= 0 && (
              <p className="text-[11px] text-gray-400 mt-1.5">{classesAttended}/{totalClasses} classes</p>
            )}
          </CardContent>
        </Card>

        {/* Trend */}
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="pt-4 pb-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                trend.label === "Improving" ? "bg-emerald-50" :
                trend.label === "Declining" ? "bg-red-50" : "bg-gray-50"
              }`}>
                <TrendIcon className={`h-3.5 w-3.5 ${trend.color}`} />
              </div>
              <span className="text-[11px] text-gray-400 uppercase tracking-wider">Trend</span>
            </div>
            <span className={`text-lg font-semibold ${trend.color}`}>
              {trend.label}
            </span>
            <p className="text-[11px] text-gray-400 mt-1.5">Last 3 exams</p>
          </CardContent>
        </Card>

        {/* Exams */}
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="pt-4 pb-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <BookOpen className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <span className="text-[11px] text-gray-400 uppercase tracking-wider">Exams</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">{allMarks.length}</span>
            <p className="text-[11px] text-gray-400 mt-1.5">
              {subjectAverages.length} subject{subjectAverages.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        {/* Feedback */}
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="pt-4 pb-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                (unreadFeedback ?? 0) > 0 ? "bg-red-50" : "bg-gray-50"
              }`}>
                <MessageSquare className={`h-3.5 w-3.5 ${
                  (unreadFeedback ?? 0) > 0 ? "text-red-500" : "text-gray-400"
                }`} />
              </div>
              <span className="text-[11px] text-gray-400 uppercase tracking-wider">Feedback</span>
            </div>
            {(unreadFeedback ?? 0) > 0 ? (
              <Link href="/student/feedback" className="group">
                <span className="text-2xl font-bold text-red-600">{unreadFeedback}</span>
                <p className="text-[11px] text-red-500 group-hover:text-red-600 mt-1.5">Unread &rarr;</p>
              </Link>
            ) : (
              <>
                <span className="text-2xl font-bold text-gray-900">0</span>
                <p className="text-[11px] text-gray-400 mt-1.5">All read</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Rank */}
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="pt-4 pb-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                rank > 0 && rank <= 10 ? "bg-amber-50" : "bg-gray-50"
              }`}>
                <Trophy className={`h-3.5 w-3.5 ${
                  rank > 0 && rank <= 10 ? "text-amber-500" : "text-gray-400"
                }`} />
              </div>
              <span className="text-[11px] text-gray-400 uppercase tracking-wider">Rank</span>
            </div>
            {rank > 0 ? (
              <>
                <span className="text-2xl font-bold text-gray-900">#{rank}</span>
                <span className="text-sm text-gray-400 ml-1">/ {totalStudents}</span>
                <p className="text-[11px] text-gray-400 mt-1.5">Top {fmtPct(percentile)}</p>
              </>
            ) : (
              <>
                <span className="text-2xl font-bold text-gray-900">&mdash;</span>
                <p className="text-[11px] text-gray-400 mt-1.5">No data</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Alerts ─── */}
      {(risk.level !== "Safe" || (attendancePct >= 0 && attendancePct < 75) || lowAttSubjects.length > 0) && (
        <div className="space-y-2">
          {risk.level !== "Safe" && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm ${
              risk.level === "High Risk"
                ? "bg-red-50 text-red-700 border border-red-200/60"
                : risk.level === "At Risk"
                ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                : "bg-yellow-50 text-yellow-700 border border-yellow-200/60"
            }`}>
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <p className="flex-1">
                <span className="font-medium">{risk.level}:</span>{" "}
                {risk.level === "High Risk"
                  ? "Your scores need urgent attention. Reach out to your teacher."
                  : risk.level === "At Risk"
                  ? "Performance is below expectations. Focus on weaker subjects."
                  : "You're close to the threshold. A bit more effort will help."
                }
              </p>
            </div>
          )}

          {attendancePct >= 0 && attendancePct < 75 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200/60">
              <CalendarCheck className="h-4 w-4 flex-shrink-0" />
              <p className="flex-1">
                Overall attendance <span className="font-medium">{fmtPct(attendancePct)}</span> is below 75%. You may be ineligible for exams.
              </p>
              <Link href="/student/attendance" className="text-xs font-medium hover:underline whitespace-nowrap">
                Details &rarr;
              </Link>
            </div>
          )}

          {lowAttSubjects.length > 0 && attendancePct >= 75 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm bg-amber-50 text-amber-700 border border-amber-200/60">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <p className="flex-1">
                Low attendance in {lowAttSubjects.length} subject{lowAttSubjects.length > 1 ? "s" : ""}:{" "}
                <span className="font-medium">{lowAttSubjects.map((s) => `${s.code} (${fmtPct(s.pct)})`).join(", ")}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── Subject Attendance ─── */}
      {subjectAttendance.length > 0 && (
        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-800">Attendance by Subject</CardTitle>
              <Link
                href="/student/attendance"
                className="text-xs text-gray-400 hover:text-[#0f1b4c] flex items-center gap-1 transition-colors"
              >
                View calendar <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subjectAttendance.map((s) => (
                <div key={s.code} className="flex items-center gap-3">
                  <div className="w-16 flex-shrink-0">
                    <span className="text-xs font-medium text-gray-700">{s.code}</span>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          s.pct >= 85 ? "bg-emerald-500" : s.pct >= 75 ? "bg-amber-400" : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(s.pct, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-20 flex items-center justify-end gap-2">
                    <span className={`text-xs font-semibold ${
                      s.pct >= 85 ? "text-emerald-600" : s.pct >= 75 ? "text-amber-600" : "text-red-600"
                    }`}>
                      {fmtPct(s.pct)}
                    </span>
                    <span className="text-[10px] text-gray-400">{s.present}/{s.total}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* 75% threshold legend */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-gray-400">85%+</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[10px] text-gray-400">75-85%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[10px] text-gray-400">Below 75%</span>
              </div>
              <span className="text-[10px] text-gray-300 ml-auto">Min. required: 75%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Performance Trend Chart ─── */}
      {allMarks.length > 0 && (
        <PerformanceTrendChart marks={allMarks} classAvgMap={classAvgForTrend} />
      )}

      {/* ─── Exam Type Performance + Recent Results ─── */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Exam Type Breakdown */}
        {examTypeAvgs.length > 0 && (
          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-800">Performance by Exam Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {examTypeAvgs.map((et) => (
                  <div key={et.type}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-700">{et.label}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${
                          et.avg >= 75 ? "text-emerald-600" : et.avg >= 50 ? "text-amber-600" : "text-red-600"
                        }`}>
                          {fmtPct(et.avg)}
                        </span>
                        <span className="text-[10px] text-gray-400">{et.count} exam{et.count !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          et.avg >= 75 ? "bg-emerald-500" : et.avg >= 50 ? "bg-amber-400" : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(et.avg, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Results */}
        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-800">Recent Results</CardTitle>
              <Link
                href="/student/results"
                className="text-xs text-gray-400 hover:text-[#0f1b4c] flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentResults.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">
                No results yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentResults.map((m, i) => {
                  const exam = m.exams as any;
                  const pct = exam ? (m.marks_obtained / exam.max_marks) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between py-0.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-800 truncate">
                            <span className="font-medium text-[#0f1b4c]">{exam?.subjects?.code ?? "—"}</span>
                            {" "}&middot; {exam?.name ?? "Exam"}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {exam?.exam_date ? formatDate(exam.exam_date) : ""}
                            {exam?.type && (
                              <span className="ml-1.5 text-gray-300">&middot; {examTypeLabels[exam.type] || exam.type}</span>
                            )}
                          </p>
                        </div>
                        <div className="text-right ml-3 flex-shrink-0">
                          <p className="text-sm font-medium text-gray-800">
                            {m.marks_obtained}<span className="text-gray-400">/{exam?.max_marks ?? 0}</span>
                          </p>
                          <p className={`text-xs font-semibold ${
                            pct >= 75 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-600"
                          }`}>
                            {fmtPct(pct)}
                          </p>
                        </div>
                      </div>
                      {i < recentResults.length - 1 && <Separator className="mt-2.5" />}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Subject Performance ─── */}
      {subjectAverages.length > 0 && (
        <SubjectPerformanceChart subjectAverages={subjectAverages} />
      )}
    </div>
  );
}
