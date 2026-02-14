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
  Users,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  CalendarCheck,
} from "lucide-react";
import Link from "next/link";
import { classifyLearner, fmtPct } from "@/lib/utils";
import { DepartmentPerformanceChart } from "./DepartmentPerformanceChart";

export default async function AdminDashboard() {
  const user = await getUser();
  const supabase = await createClient();

  // Fetch all summary data in parallel
  const [
    { count: totalStudents },
    { count: totalTeachers },
    { count: totalExams },
    { data: departments },
    { data: students },
    { data: allMarks },
    { data: attendanceData },
  ] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("teachers").select("*", { count: "exact", head: true }),
    supabase.from("exams").select("*", { count: "exact", head: true }),
    supabase.from("departments").select("id, name, full_name"),
    supabase.from("students").select("id, roll_no, department_id, semester, profiles(full_name)"),
    supabase.from("marks").select("student_id, marks_obtained, exams(max_marks, subject_id, subjects(department_id))"),
    supabase.from("attendance").select("status"),
  ]);

  // Compute attendance rate
  const totalAttendanceRecords = (attendanceData ?? []).length;
  const attendedRecords = (attendanceData ?? []).filter(
    (r) => r.status === "present" || r.status === "late"
  ).length;
  const attendanceRate = totalAttendanceRecords > 0
    ? (attendedRecords / totalAttendanceRecords) * 100
    : -1;

  // Compute per-student averages
  const studentAvgs = new Map<string, number[]>();
  for (const m of allMarks ?? []) {
    const exam = m.exams as any;
    if (!exam?.max_marks) continue;
    const pct = (m.marks_obtained / exam.max_marks) * 100;
    const arr = studentAvgs.get(m.student_id) ?? [];
    arr.push(pct);
    studentAvgs.set(m.student_id, arr);
  }

  // At-risk students (avg < 50%)
  const atRiskList = (students ?? [])
    .map((s) => {
      const pcts = studentAvgs.get(s.id) ?? [];
      const avg = pcts.length > 0 ? pcts.reduce((a, b) => a + b, 0) / pcts.length : -1;
      return { ...s, avg };
    })
    .filter((s) => s.avg >= 0 && s.avg < 50)
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 8);

  // Department-wise averages
  const deptAvgs = new Map<string, number[]>();
  for (const m of allMarks ?? []) {
    const exam = m.exams as any;
    if (!exam?.subjects?.department_id || !exam?.max_marks) continue;
    const pct = (m.marks_obtained / exam.max_marks) * 100;
    const arr = deptAvgs.get(exam.subjects.department_id) ?? [];
    arr.push(pct);
    deptAvgs.set(exam.subjects.department_id, arr);
  }

  const deptStats = (departments ?? []).map((d) => {
    const pcts = deptAvgs.get(d.id) ?? [];
    const avg = pcts.length > 0 ? pcts.reduce((a, b) => a + b, 0) / pcts.length : -1;
    const studentCount = (students ?? []).filter((s) => s.department_id === d.id).length;
    return { ...d, avg, studentCount };
  });

  // Overall average
  const allPcts = Array.from(studentAvgs.values()).flat();
  const overallAvg =
    allPcts.length > 0
      ? allPcts.reduce((a, b) => a + b, 0) / allPcts.length
      : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-800">
          {user.role === "principal" ? "Principal" : "HOD"} Dashboard
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Institution-wide academic overview
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-5 gap-4">
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg bg-[#0f1b4c]/5 flex items-center justify-center">
                <GraduationCap className="h-3.5 w-3.5 text-[#0f1b4c]" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Students</p>
                <p className="text-2xl font-semibold text-gray-800">{totalStudents ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Teachers</p>
                <p className="text-2xl font-semibold text-gray-800">{totalTeachers ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Exams</p>
                <p className="text-2xl font-semibold text-gray-800">{totalExams ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Average</p>
                <p className="text-2xl font-semibold text-gray-800">
                  {allPcts.length > 0 ? fmtPct(overallAvg) : "\u2014"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-3">
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${attendanceRate >= 75 ? "bg-emerald-50" : attendanceRate >= 0 ? "bg-amber-50" : "bg-gray-50"}`}>
                <CalendarCheck className={`h-3.5 w-3.5 ${attendanceRate >= 75 ? "text-emerald-600" : attendanceRate >= 0 ? "text-amber-600" : "text-gray-400"}`} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Attendance</p>
                <p className={`text-2xl font-semibold ${attendanceRate >= 75 ? "text-emerald-600" : attendanceRate >= 0 ? "text-amber-600" : "text-gray-800"}`}>
                  {attendanceRate >= 0 ? fmtPct(attendanceRate) : "\u2014"}
                </p>
              </div>
            </div>
            {attendanceRate >= 0 && (
              <Link href="/admin/attendance" className="text-xs text-gray-400 hover:text-gray-600 mt-2 inline-flex items-center gap-1 transition-colors">
                View details <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Department Performance */}
        <DepartmentPerformanceChart deptStats={deptStats} />

        {/* At-Risk Students */}
        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded bg-amber-50 flex items-center justify-center">
                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-gray-800">At-Risk Students</CardTitle>
              </div>
              <Link
                href="/admin/students"
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <CardDescription className="text-xs text-gray-400">Students with average below 50%</CardDescription>
          </CardHeader>
          <CardContent>
            {atRiskList.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                No at-risk students detected.
              </p>
            ) : (
              <div className="space-y-3">
                {atRiskList.map((s, i) => {
                  const profile = s.profiles as any;
                  const dept = (departments ?? []).find(
                    (d) => d.id === s.department_id
                  );
                  const cat = classifyLearner(s.avg);
                  return (
                    <div key={s.id}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {profile?.full_name ?? "Student"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {s.roll_no} &middot; {dept?.name ?? ""} &middot; Sem{" "}
                            {s.semester}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${cat.color}`}>
                            {fmtPct(s.avg)}
                          </p>
                          <Badge
                            variant="secondary"
                            className={`text-xs border-0 ${cat.bgColor} ${cat.color}`}
                          >
                            {cat.label}
                          </Badge>
                        </div>
                      </div>
                      {i < atRiskList.length - 1 && <Separator className="mt-3" />}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
