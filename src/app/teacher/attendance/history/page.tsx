import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { AttendanceHistoryClient } from "./AttendanceHistoryClient";

export default async function TeacherAttendanceHistoryPage() {
  const user = await getUser();
  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, department_id, departments(name)")
    .eq("profile_id", user.id)
    .single();

  if (!teacher) {
    return (
      <div className="text-center py-12 text-gray-400">
        Teacher profile not found.
      </div>
    );
  }

  // Get subjects for this department
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, code, semester")
    .eq("department_id", teacher.department_id)
    .order("code");

  // Get attendance records marked by this teacher (or all in dept for HOD)
  const { data: attendance } = await supabase
    .from("attendance")
    .select(
      `
      id, date, status, remarks, subject_id,
      students(id, roll_no, profiles(full_name)),
      subjects(id, name, code)
    `
    )
    .order("date", { ascending: false })
    .limit(2000);

  // Group by subject+date for summary view
  const groupMap = new Map<
    string,
    {
      subjectId: string;
      subjectCode: string;
      subjectName: string;
      date: string;
      total: number;
      present: number;
      absent: number;
      late: number;
      excused: number;
    }
  >();

  for (const r of attendance ?? []) {
    const subject = r.subjects as any;
    if (!subject) continue;
    const key = `${r.subject_id}_${r.date}`;
    const existing = groupMap.get(key) ?? {
      subjectId: r.subject_id,
      subjectCode: subject.code,
      subjectName: subject.name,
      date: r.date,
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };
    existing.total++;
    if (r.status === "present") existing.present++;
    else if (r.status === "absent") existing.absent++;
    else if (r.status === "late") existing.late++;
    else if (r.status === "excused") existing.excused++;
    groupMap.set(key, existing);
  }

  const sessions = Array.from(groupMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <AttendanceHistoryClient
      sessions={sessions}
      subjects={subjects ?? []}
      records={attendance ?? []}
    />
  );
}
