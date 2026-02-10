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
  ] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("teachers").select("*", { count: "exact", head: true }),
    supabase.from("exams").select("*", { count: "exact", head: true }),
    supabase.from("departments").select("id, name, full_name"),
    supabase.from("students").select("id, roll_no, department_id, semester, profiles(full_name)"),
    supabase.from("marks").select("student_id, marks_obtained, exams(max_marks, subject_id, subjects(department_id))"),
  ]);

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
        <h1 className="text-xl font-semibold text-foreground">
          {user.role === "principal" ? "Principal" : "HOD"} Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Institution-wide academic overview
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-semibold text-foreground">
                {totalStudents ?? 0}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Teachers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-semibold text-foreground">
                {totalTeachers ?? 0}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Exams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-semibold text-foreground">
                {totalExams ?? 0}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Overall Average
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-2xl font-semibold text-foreground">
                {allPcts.length > 0 ? fmtPct(overallAvg) : "â€”"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Department Performance */}
        <div className="animate-fade-in animate-delay-400">
          <DepartmentPerformanceChart deptStats={deptStats} />
        </div>

        {/* At-Risk Students */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-base">At-Risk Students</CardTitle>
              </div>
              <Link
                href="/admin/students"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <CardDescription>Students with average below 50%</CardDescription>
          </CardHeader>
          <CardContent>
            {atRiskList.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
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
                          <p className="text-sm font-medium text-foreground">
                            {profile?.full_name ?? "Student"}
                          </p>
                          <p className="text-xs text-muted-foreground">
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
