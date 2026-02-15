import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, Award, CalendarCheck } from "lucide-react";
import { fmtPct } from "@/lib/utils";
import { calculateAttendancePercentage } from "@/lib/attendance";
import AnalyticsClient from "./AnalyticsClient";

export default async function TeacherAnalyticsPage() {
  const user = await getUser();
  const supabase = await createClient();

  // Get teacher record
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, department_id")
    .eq("profile_id", user.id)
    .single();

  if (!teacher) {
    return <p className="text-gray-500 py-8 text-center">Teacher record not found.</p>;
  }

  // Check for explicit subject assignments
  const { data: assignments } = await supabase
    .from("teacher_subject_assignments")
    .select("subject_id, section")
    .eq("teacher_id", teacher.id);

  let subjectIds: string[] = [];
  let subjects: Array<{ id: string; name: string; code: string; semester: number }> = [];

  if (assignments && assignments.length > 0) {
    subjectIds = [...new Set(assignments.map((a) => a.subject_id))];
    const { data } = await supabase
      .from("subjects")
      .select("id, name, code, semester")
      .in("id", subjectIds);
    subjects = data ?? [];
  }
  // No fallback: teachers only see assigned subjects

  // Fetch data in parallel
  const [
    { data: exams },
    { data: allMarks },
    { data: attendanceRecords },
  ] = await Promise.all([
    supabase
      .from("exams")
      .select("id, name, type, max_marks, exam_date, subject_id, subjects(name, code)")
      .eq("created_by", user.id)
      .order("exam_date", { ascending: false }),
    subjectIds.length > 0
      ? supabase
          .from("marks")
          .select("marks_obtained, student_id, exam_id, exams(id, max_marks, type, subject_id, name, exam_date, subjects(name, code))")
          .in("exams.subject_id", subjectIds)
          .not("exams", "is", null)
      : { data: [] },
    subjectIds.length > 0
      ? supabase
          .from("attendance")
          .select("student_id, subject_id, status, date")
          .in("subject_id", subjectIds)
      : { data: [] },
  ]);

  const validMarks = (allMarks ?? []).filter((m) => (m.exams as any)?.max_marks);
  const totalExams = exams?.length ?? 0;

  // Overall average
  const percentages = validMarks.map((m) => {
    const exam = m.exams as any;
    return (m.marks_obtained / exam.max_marks) * 100;
  });
  const overallAvg = percentages.length > 0
    ? percentages.reduce((a, b) => a + b, 0) / percentages.length
    : 0;

  // Unique students
  const uniqueStudents = new Set(validMarks.map((m) => m.student_id));

  // Attendance rate
  const attRecords = attendanceRecords ?? [];
  const attendanceRate = calculateAttendancePercentage(attRecords);

  // Performance distribution
  const excellentCount = percentages.filter((p) => p >= 75).length;
  const goodCount = percentages.filter((p) => p >= 60 && p < 75).length;
  const averageCount = percentages.filter((p) => p >= 40 && p < 60).length;
  const poorCount = percentages.filter((p) => p < 40).length;

  // Subject-wise performance
  const subjectPerformance = subjects.map((sub) => {
    const subMarks = validMarks.filter((m) => (m.exams as any)?.subject_id === sub.id);
    const subPcts = subMarks.map((m) => {
      const exam = m.exams as any;
      return (m.marks_obtained / exam.max_marks) * 100;
    });
    const avg = subPcts.length > 0 ? subPcts.reduce((a, b) => a + b, 0) / subPcts.length : -1;
    return { name: sub.code, fullName: sub.name, value: parseFloat(avg.toFixed(1)), count: subPcts.length };
  }).filter((s) => s.value >= 0);

  // Exam-wise analysis
  const examAnalysis = (exams ?? []).map((exam) => {
    const examMarks = validMarks.filter((m) => m.exam_id === exam.id);
    const marks = examMarks.map((m) => m.marks_obtained);
    const sorted = [...marks].sort((a, b) => a - b);
    const avg = marks.length > 0 ? marks.reduce((a, b) => a + b, 0) / marks.length : 0;
    const maxMarks = exam.max_marks;
    const passCount = marks.filter((m) => (m / maxMarks) * 100 >= 40).length;
    return {
      id: exam.id,
      name: exam.name,
      type: exam.type,
      subject: (exam.subjects as any)?.code ?? "",
      date: exam.exam_date,
      maxMarks,
      studentsCount: marks.length,
      avg: marks.length > 0 ? parseFloat(((avg / maxMarks) * 100).toFixed(1)) : 0,
      highest: sorted.length > 0 ? sorted[sorted.length - 1] : 0,
      lowest: sorted.length > 0 ? sorted[0] : 0,
      passRate: marks.length > 0 ? parseFloat(((passCount / marks.length) * 100).toFixed(0)) : 0,
    };
  });

  // Subject-wise attendance
  const subjectAttendance = subjects.map((sub) => {
    const subAtt = attRecords.filter((a) => a.subject_id === sub.id);
    const rate = calculateAttendancePercentage(subAtt);
    const uniqueStu = new Set(subAtt.map((a) => a.student_id));
    const lowStudents = Array.from(
      subAtt.reduce((map, r) => {
        const arr = map.get(r.student_id) ?? [];
        arr.push(r);
        map.set(r.student_id, arr);
        return map;
      }, new Map<string, typeof subAtt>())
    )
      .map(([sid, records]) => ({
        studentId: sid,
        rate: calculateAttendancePercentage(records),
        total: records.length,
        attended: records.filter((r) => r.status === "present" || r.status === "late").length,
      }))
      .filter((s) => s.rate < 75);

    return {
      name: sub.code,
      fullName: sub.name,
      value: parseFloat(rate.toFixed(1)),
      students: uniqueStu.size,
      totalRecords: subAtt.length,
      lowCount: lowStudents.length,
    };
  }).filter((s) => s.totalRecords > 0);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Analytics</h1>
        <p className="text-sm text-gray-400 mt-1">
          Performance insights for your subjects and students
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Avg Class Score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-gray-800">
                {percentages.length > 0 ? fmtPct(overallAvg) : "—"}
              </span>
              {overallAvg >= 60 ? (
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Students Taught
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-gray-800">
                {uniqueStudents.size}
              </span>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Exams Created
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-gray-800">
                {totalExams}
              </span>
              <Award className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Attendance Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-semibold ${attendanceRate >= 75 ? "text-emerald-600" : attendanceRate > 0 ? "text-amber-600" : "text-gray-400"}`}>
                {attRecords.length > 0 ? fmtPct(attendanceRate) : "—"}
              </span>
              <CalendarCheck className={`h-5 w-5 ${attendanceRate >= 75 ? "text-emerald-500" : "text-amber-500"}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      <AnalyticsClient
        subjectPerformance={subjectPerformance}
        distribution={{ excellentCount, goodCount, averageCount, poorCount, total: percentages.length }}
        examAnalysis={examAnalysis}
        subjectAttendance={subjectAttendance}
      />
    </div>
  );
}
