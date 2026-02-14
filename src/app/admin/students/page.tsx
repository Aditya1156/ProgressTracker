import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import StudentsClient from "./StudentsClient";

export default async function AdminStudentsPage() {
  const user = await getUser();
  const supabase = await createClient();

  // Fetch all students with their details
  const { data: students } = await supabase
    .from("students")
    .select(
      "id, roll_no, semester, batch, profiles(full_name, email), departments(name, full_name)"
    )
    .order("roll_no");

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Students</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage student records and view performance
          </p>
        </div>
        <Button size="sm" disabled>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      {/* Client Component with Search and Export */}
      <StudentsClient students={sortedStudents} />

      {/* Note */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> To add, edit, or delete students, use the Supabase
            dashboard or create custom admin tools. Student management features are
            coming soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
