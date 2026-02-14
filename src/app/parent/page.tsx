import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, BookOpen, CalendarCheck, TrendingUp } from "lucide-react";

export default async function ParentDashboard() {
  const user = await getUser();
  const supabase = await createClient();

  // Get linked students
  const { data: links } = await supabase
    .from("parent_student_links")
    .select("student_id, relationship, verified, students(id, roll_no, semester, section, department_id, profiles(full_name), departments(name))")
    .eq("parent_id", user.id);

  const linkedStudents = (links ?? []).map((link) => {
    const student = link.students as any;
    return {
      studentId: link.student_id,
      relationship: link.relationship,
      verified: link.verified,
      rollNo: student?.roll_no ?? "—",
      name: student?.profiles?.full_name ?? "Student",
      semester: student?.semester ?? 0,
      section: student?.section ?? "—",
      department: student?.departments?.name ?? "—",
    };
  });

  // Fetch marks for linked students
  const studentIds = linkedStudents.map((s) => s.studentId);
  const { data: allMarks } = studentIds.length > 0
    ? await supabase
        .from("marks")
        .select("student_id, marks_obtained, exams(max_marks)")
        .in("student_id", studentIds)
    : { data: [] };

  // Fetch attendance for linked students
  const { data: allAttendance } = studentIds.length > 0
    ? await supabase
        .from("attendance")
        .select("student_id, status")
        .in("student_id", studentIds)
    : { data: [] };

  // Compute stats per student
  const studentStats = linkedStudents.map((student) => {
    const marks = (allMarks ?? []).filter((m) => m.student_id === student.studentId);
    const attendance = (allAttendance ?? []).filter((a) => a.student_id === student.studentId);

    const totalExams = marks.length;
    const avgPercent = totalExams > 0
      ? marks.reduce((sum, m) => {
          const max = (m.exams as any)?.max_marks ?? 100;
          return sum + (m.marks_obtained / max) * 100;
        }, 0) / totalExams
      : -1;

    const totalClasses = attendance.length;
    const attended = attendance.filter((a) => a.status === "present" || a.status === "late").length;
    const attendanceRate = totalClasses > 0 ? (attended / totalClasses) * 100 : -1;

    return { ...student, totalExams, avgPercent, totalClasses, attendanceRate };
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Parent Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">
          Monitor your children&apos;s academic progress
        </p>
      </div>

      {studentStats.length === 0 ? (
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-10 w-10 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-400">
              No students linked to your account yet. Contact the administration to link your child&apos;s profile.
            </p>
          </CardContent>
        </Card>
      ) : (
        studentStats.map((student) => (
          <Card key={student.studentId} className="border-gray-200/80 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{student.name}</CardTitle>
                  <CardDescription>
                    {student.rollNo} &middot; {student.department} &middot; Sem {student.semester} &middot; Sec {student.section}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="border-0 capitalize">
                  {student.relationship}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-400">Exams Taken</p>
                    <p className="text-lg font-semibold">{student.totalExams}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-400">Average Score</p>
                    <p className="text-lg font-semibold">
                      {student.avgPercent >= 0 ? `${student.avgPercent.toFixed(1)}%` : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <CalendarCheck className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-xs text-gray-400">Attendance</p>
                    <p className="text-lg font-semibold">
                      {student.attendanceRate >= 0 ? `${student.attendanceRate.toFixed(1)}%` : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
