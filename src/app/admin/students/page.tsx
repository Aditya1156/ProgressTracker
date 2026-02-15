import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import StudentsClient from "./StudentsClient";

export default async function AdminStudentsPage() {
  const user = await getUser();
  const supabase = await createClient();

  // Check if user is HOD (scope to department) or Principal (see all)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  let departmentId: string | null = null;
  let departmentName = "";

  if (profile?.role === "hod") {
    const { data: teacher } = await supabase
      .from("teachers")
      .select("department_id, departments(name)")
      .eq("profile_id", user.id)
      .single();
    departmentId = teacher?.department_id ?? null;
    departmentName = (teacher?.departments as any)?.name ?? "";
  }

  // Fetch students - scoped to department for HOD
  let query = supabase
    .from("students")
    .select(
      "id, roll_no, semester, batch, section, profiles(full_name, email), departments(name, full_name)"
    )
    .order("roll_no");

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  }

  const { data: students } = await query;

  // Get all marks to calculate averages
  const studentIds = (students ?? []).map((s) => s.id);
  const { data: allMarks } =
    studentIds.length > 0
      ? await supabase
          .from("marks")
          .select("student_id, marks_obtained, exams(max_marks)")
          .in("student_id", studentIds)
      : { data: [] };

  // Calculate per-student statistics
  const studentStats = (students ?? []).map((s) => {
    const studentMarks = (allMarks ?? []).filter((m) => m.student_id === s.id);
    const pcts = studentMarks
      .filter((m) => (m.exams as any)?.max_marks)
      .map((m) => {
        const exam = m.exams as any;
        return (m.marks_obtained / exam.max_marks) * 100;
      });
    const avg = pcts.length > 0 ? pcts.reduce((a, b) => a + b, 0) / pcts.length : -1;
    return { ...s, avg, examCount: studentMarks.length };
  });

  // Sort by roll number
  const sortedStudents = studentStats.sort((a, b) =>
    a.roll_no.localeCompare(b.roll_no)
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Students</h1>
        <p className="text-sm text-gray-400 mt-1">
          {departmentName ? `${departmentName} Department` : "All departments"} &middot;{" "}
          {sortedStudents.length} students
        </p>
      </div>

      <StudentsClient students={sortedStudents} departmentId={departmentId} />
    </div>
  );
}
