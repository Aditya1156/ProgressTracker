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
  CalendarCheck,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { classifyLearner, fmtPct, formatDate } from "@/lib/utils";
import { calculateAttendancePercentage } from "@/lib/attendance";

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
        <h1 className="text-xl font-semibold text-gray-800">Welcome, {user.fullName}</h1>
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="py-12 text-center text-gray-400">
            <p>Your teacher profile hasn&apos;t been set up yet.</p>
            <p className="text-sm mt-1">Please contact the HOD or administrator.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check for explicit subject assignments
  const { data: assignments } = await supabase
    .from("teacher_subject_assignments")
    .select("subject_id, section, semester")
    .eq("teacher_id", teacher.id);

  let subjects: Array<{ id: string; name: string; code: string; semester: number }> = [];
  let subjectIds: string[] = [];

  if (assignments && assignments.length > 0) {
    subjectIds = [...new Set(assignments.map((a) => a.subject_id))];
    const { data } = await supabase
      .from("subjects")
      .select("id, name, code, semester")
      .in("id", subjectIds);
    subjects = data ?? [];
  }
  // No fallback: teachers only see assigned subjects

  // Get exam count for this teacher
  const { count: totalExamsCount } = await supabase
    .from("exams")
    .select("*", { count: "exact", head: true })
    .eq("created_by", user.id);

  // Get students scoped to assigned subjects/sections
  type StudentRow = { id: string; roll_no: string; profile_id: string; profiles: unknown; semester: number };
  let students: StudentRow[] = [];
  if (assignments && assignments.length > 0) {
    // Build semester → sections map from assignments
    const semesterSections = new Map<number, Set<string>>();
    for (const a of assignments) {
      const sems = semesterSections.get(a.semester) ?? new Set<string>();
      sems.add(a.section);
      semesterSections.set(a.semester, sems);
    }
    // Query students for each semester+sections combo
    const studentResults = await Promise.all(
      Array.from(semesterSections.entries()).map(([sem, sections]) =>
        supabase
          .from("students")
          .select("id, roll_no, profile_id, profiles(full_name), semester")
          .eq("department_id", teacher.department_id)
          .eq("semester", sem)
          .in("section", Array.from(sections))
      )
    );
    const allStudents: StudentRow[] = studentResults.flatMap((r) => (r.data ?? []) as StudentRow[]);
    // Deduplicate by student id
    const seen = new Set<string>();
    students = allStudents.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }
  // No fallback: teachers only see assigned students

  // Get all marks for these students
  const studentIds = students.map((s) => s.id);
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

  // Get attendance data for teacher's subjects
  const { data: attendanceRecords } = subjectIds.length > 0
    ? await supabase
        .from("attendance")
        .select("status")
        .in("subject_id", subjectIds)
    : { data: [] };

  const attendanceRate = calculateAttendancePercentage(attendanceRecords ?? []);

  // Recent exams (last 5)
  const { data: recentExams } = await supabase
    .from("exams")
    .select("name, type, exam_date, subjects(code)")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Recent attendance sessions (last 5 unique subject+date)
  const { data: recentAttendance } = subjectIds.length > 0
    ? await supabase
        .from("attendance")
        .select("date, subject_id, subjects(code, name)")
        .in("subject_id", subjectIds)
        .eq("marked_by", user.id)
        .order("date", { ascending: false })
        .limit(50)
    : { data: [] };

  // Deduplicate by subject+date
  const seenSessions = new Set<string>();
  const recentSessions = (recentAttendance ?? []).filter((r) => {
    const key = `${r.subject_id}-${r.date}`;
    if (seenSessions.has(key)) return false;
    seenSessions.add(key);
    return true;
  }).slice(0, 5);

  const totalStudents = students?.length ?? 0;
  const totalExams = totalExamsCount ?? 0;
  const totalSubjects = subjects?.length ?? 0;

  const deptName = (teacher as any).departments?.name ?? "";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-800">
          Welcome, {user.fullName.split(" ")[0]}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {teacher.designation} &middot; {deptName} Department
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Students</p>
                <p className="text-2xl font-semibold text-gray-800">{totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <BookOpen className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Subjects</p>
                <p className="text-2xl font-semibold text-gray-800">{totalSubjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <ClipboardList className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Exams</p>
                <p className="text-2xl font-semibold text-gray-800">{totalExams}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">At Risk</p>
                <p className={`text-2xl font-semibold ${atRiskStudents.length > 0 ? "text-amber-600" : "text-gray-800"}`}>
                  {atRiskStudents.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${attendanceRate >= 75 ? "bg-emerald-50" : attendanceRate > 0 ? "bg-amber-50" : "bg-gray-50"}`}>
                <CalendarCheck className={`h-4 w-4 ${attendanceRate >= 75 ? "text-emerald-600" : attendanceRate > 0 ? "text-amber-600" : "text-gray-400"}`} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Attendance</p>
                <p className={`text-2xl font-semibold ${attendanceRate >= 75 ? "text-emerald-600" : attendanceRate > 0 ? "text-amber-600" : "text-gray-400"}`}>
                  {(attendanceRecords ?? []).length > 0 ? fmtPct(attendanceRate) : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* At-Risk Students */}
        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-800">Students Needing Attention</CardTitle>
              <Link
                href="/teacher/students"
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
              >
                All students <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {atRiskStudents.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
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
                      className="flex items-center justify-between py-1"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {profile?.full_name ?? "Student"}
                        </p>
                        <p className="text-xs text-gray-400">
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

        {/* Recent Activity + Quick Actions */}
        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-800">Recent Activity</CardTitle>
              <Link
                href="/teacher/analytics"
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
              >
                Analytics <BarChart3 className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recent Exams */}
            {(recentExams ?? []).length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Recent Exams</p>
                <div className="space-y-1.5">
                  {(recentExams ?? []).map((e, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#0f1b4c]" />
                        <span className="text-gray-700">{(e as any).name}</span>
                        <span className="text-xs text-gray-400">({(e.subjects as any)?.code})</span>
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(e.exam_date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Attendance Sessions */}
            {recentSessions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Recent Attendance</p>
                <div className="space-y-1.5">
                  {recentSessions.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-gray-700">{(s.subjects as any)?.name}</span>
                        <span className="text-xs text-gray-400">({(s.subjects as any)?.code})</span>
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(s.date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(recentExams ?? []).length === 0 && recentSessions.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">No recent activity yet.</p>
            )}

            {/* Quick Action Links */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
              <Link
                href="/teacher/marks"
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-[#0f1b4c]/5 flex items-center justify-center">
                  <ClipboardList className="h-4 w-4 text-[#0f1b4c]" />
                </div>
                <span className="text-xs font-medium text-gray-600">Enter Marks</span>
              </Link>
              <Link
                href="/teacher/attendance"
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CalendarCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-gray-600">Attendance</span>
              </Link>
              <Link
                href="/teacher/feedback"
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-gray-600">Feedback</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
