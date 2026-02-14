import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { classifyLearner, fmtPct } from "@/lib/utils";

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

  const { data: students } = await supabase
    .from("students")
    .select("id, roll_no, semester, profiles(full_name)")
    .eq("department_id", teacher.department_id)
    .order("roll_no");

  // Get all marks for these students
  const studentIds = (students ?? []).map((s) => s.id);
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Students</h1>
        <p className="text-sm text-gray-400 mt-1">
          {deptName} Department &middot; {studentStats.length} students
        </p>
      </div>

      <Card className="border-gray-200/80 shadow-sm">
        <CardContent className="pt-6">
          {studentStats.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              No students in your department yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead className="text-right">Exams</TableHead>
                  <TableHead className="text-right">Average</TableHead>
                  <TableHead className="text-right">Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentStats.map((s) => {
                  const profile = s.profiles as any;
                  const cat = s.avg >= 0 ? classifyLearner(s.avg) : null;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-sm">
                        {s.roll_no}
                      </TableCell>
                      <TableCell className="font-medium">
                        {profile?.full_name ?? "—"}
                      </TableCell>
                      <TableCell>Sem {s.semester}</TableCell>
                      <TableCell className="text-right">{s.examCount}</TableCell>
                      <TableCell className={`text-right font-medium ${cat?.color ?? ""}`}>
                        {s.avg >= 0 ? fmtPct(s.avg) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {cat ? (
                          <Badge
                            variant="secondary"
                            className={`text-xs border-0 ${cat.bgColor} ${cat.color}`}
                          >
                            {cat.label}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
