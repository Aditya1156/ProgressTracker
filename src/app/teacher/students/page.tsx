import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import TeacherStudentsClient from "./TeacherStudentsClient";

export default async function TeacherStudentsPage() {
  const user = await getUser();
  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, department_id, departments(name)")
    .eq("profile_id", user.id)
    .single();

  if (!teacher) {
    return (
      <Card className="border-gray-200/80 shadow-sm">
        <CardContent className="py-12 text-center text-gray-400">
          Teacher profile not found.
        </CardContent>
      </Card>
    );
  }

  // Check for explicit subject assignments
  const { data: assignments } = await supabase
    .from("teacher_subject_assignments")
    .select("subject_id, section, semester")
    .eq("teacher_id", teacher.id);

  let students: Array<{ id: string; roll_no: string; semester: number; batch: string; section: string; profiles: unknown }> = [];
  if (assignments && assignments.length > 0) {
    // Build semester → sections map
    const semesterSections = new Map<number, Set<string>>();
    for (const a of assignments) {
      const sems = semesterSections.get(a.semester) ?? new Set<string>();
      sems.add(a.section);
      semesterSections.set(a.semester, sems);
    }
    // Query students for each semester+sections combo
    const results = await Promise.all(
      Array.from(semesterSections.entries()).map(([sem, sections]) =>
        supabase
          .from("students")
          .select("id, roll_no, semester, batch, section, profiles(full_name)")
          .eq("department_id", teacher.department_id)
          .eq("semester", sem)
          .in("section", Array.from(sections))
          .order("roll_no")
      )
    );
    const all = results.flatMap((r) => r.data ?? []) as typeof students;
    const seen = new Set<string>();
    students = all.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }
  // No fallback: teachers only see assigned students

  // Get marks scoped to assigned subjects' exams
  const studentIds = students.map((s) => s.id);
  const { data: allMarks } = studentIds.length > 0
    ? await supabase
        .from("marks")
        .select("student_id, marks_obtained, exams(max_marks)")
        .in("student_id", studentIds)
    : { data: [] };

  // Compute per-student stats
  const studentStats = (students ?? []).map((s) => {
    const studentMarks = (allMarks ?? []).filter((m) => m.student_id === s.id);
    const pcts = studentMarks.map((m) => {
      const exam = m.exams as any;
      return exam?.max_marks ? (m.marks_obtained / exam.max_marks) * 100 : 0;
    });
    const avg = pcts.length > 0 ? pcts.reduce((a, b) => a + b, 0) / pcts.length : -1;
    return { ...s, avg, examCount: studentMarks.length };
  });

  const deptName = (teacher as any).departments?.name ?? "";

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Students</h1>
        <p className="text-sm text-gray-400 mt-1">
          {deptName} Department &middot; {studentStats.length} students
        </p>
      </div>

      <TeacherStudentsClient students={studentStats} />
    </div>
  );
}
