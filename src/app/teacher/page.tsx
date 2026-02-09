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
import {
  Users,
  BookOpen,
  ClipboardList,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { classifyLearner, fmtPct } from "@/lib/utils";

export default async function TeacherDashboard() {
  const user = await getUser();
  const supabase = await createClient();

  // Get teacher record
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, department_id, designation, departments(name)")
    .eq("profile_id", user.id)
    .single();

  if (!teacher) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">Welcome, {user.fullName}</h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Your teacher profile hasn&apos;t been set up yet.</p>
            <p className="text-sm mt-1">Please contact the HOD or administrator.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get subjects in teacher's department
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, code, semester")
    .eq("department_id", teacher.department_id);

  // Get exams created by this teacher
  const { data: exams } = await supabase
    .from("exams")
    .select("id, name, type, max_marks, exam_date, subjects(name, code)")
    .eq("created_by", user.id)
    .order("exam_date", { ascending: false })
    .limit(10);

  // Get students in teacher's department
  const { data: students } = await supabase
    .from("students")
    .select("id, roll_no, profile_id, profiles(full_name), semester")
    .eq("department_id", teacher.department_id);

  // Get all marks for these students
  const studentIds = (students ?? []).map((s) => s.id);
  const { data: allMarks } = studentIds.length > 0
    ? await supabase
        .from("marks")
        .select("student_id, marks_obtained, exams(max_marks)")
        .in("student_id", studentIds)
    : { data: [] };

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

  // At-risk students
  const atRiskStudents = (students ?? [])
    .map((s) => {
      const pcts = studentAvgs.get(s.id) ?? [];
      const avg = pcts.length > 0 ? pcts.reduce((a, b) => a + b, 0) / pcts.length : -1;
      return { ...s, avg };
    })
    .filter((s) => s.avg >= 0 && s.avg < 50)
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 5);

  const totalStudents = students?.length ?? 0;
  const totalExams = exams?.length ?? 0;
  const totalSubjects = subjects?.length ?? 0;

  const deptName = (teacher as any).departments?.name ?? "";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Welcome, {user.fullName.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {teacher.designation} &middot; {deptName} Department
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-500" />
              <span className="text-2xl font-semibold text-slate-900">
                {totalStudents}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-slate-500" />
              <span className="text-2xl font-semibold text-slate-900">
                {totalSubjects}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Exams Created
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-slate-500" />
              <span className="text-2xl font-semibold text-slate-900">
                {totalExams}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              At Risk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-2xl font-semibold text-amber-600">
                {atRiskStudents.length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* At-Risk Students */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Students Needing Attention</CardTitle>
              <Link
                href="/teacher/students"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                All students <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {atRiskStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No at-risk students. Great work!
              </p>
            ) : (
              <div className="space-y-3">
                {atRiskStudents.map((s) => {
                  const profile = s.profiles as any;
                  const cat = classifyLearner(s.avg);
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {profile?.full_name ?? "Student"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Roll: {s.roll_no} &middot; Sem {s.semester}
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
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/teacher/marks"
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <ClipboardList className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Enter Marks</p>
                <p className="text-xs text-muted-foreground">
                  Record exam scores for your students
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 ml-auto" />
            </Link>
            <Link
              href="/teacher/feedback"
              className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <Users className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Give Feedback</p>
                <p className="text-xs text-muted-foreground">
                  Send personalized feedback to students
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 ml-auto" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
