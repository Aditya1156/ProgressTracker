import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import ManageClient from "./ManageClient";

export default async function AdminManagePage() {
  const user = await getUser();
  const supabase = await createClient();

  // Check role — HOD scoped to department, principal sees all
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

  // Fetch teachers
  let teachersQuery = supabase
    .from("teachers")
    .select("id, designation, profiles(full_name, email), departments(name)")
    .order("created_at");
  if (departmentId) teachersQuery = teachersQuery.eq("department_id", departmentId);
  const { data: teachers } = await teachersQuery;

  // Fetch subjects
  let subjectsQuery = supabase
    .from("subjects")
    .select("id, name, code, semester, department_id")
    .order("semester")
    .order("code");
  if (departmentId) subjectsQuery = subjectsQuery.eq("department_id", departmentId);
  const { data: subjects } = await subjectsQuery;

  // Fetch existing assignments
  let assignmentsQuery = supabase
    .from("teacher_subject_assignments")
    .select(
      "id, teacher_id, subject_id, section, semester, academic_year, teachers(id, profiles(full_name)), subjects(name, code)"
    )
    .order("semester")
    .order("section");
  if (departmentId) assignmentsQuery = assignmentsQuery.eq("department_id", departmentId);
  const { data: assignments } = await assignmentsQuery;

  // Fetch students for section management
  let studentsQuery = supabase
    .from("students")
    .select("id, roll_no, semester, batch, section, profiles(full_name)")
    .order("roll_no");
  if (departmentId) studentsQuery = studentsQuery.eq("department_id", departmentId);
  const { data: students } = await studentsQuery;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Manage</h1>
        <p className="text-sm text-gray-400 mt-1">
          {departmentName ? `${departmentName} Department` : "All departments"}{" "}
          &middot; Teacher assignments &amp; student sections
        </p>
      </div>

      <ManageClient
        teachers={teachers ?? []}
        subjects={subjects ?? []}
        assignments={assignments ?? []}
        students={students ?? []}
        departmentId={departmentId}
      />
    </div>
  );
}
