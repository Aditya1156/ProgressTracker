import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus, Search, Download } from "lucide-react";
import { classifyLearner, fmtPct } from "@/lib/utils";
import Link from "next/link";

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
          <h1 className="text-xl font-semibold text-slate-900">Students</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage student records and view performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Total Students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold text-slate-900">
              {sortedStudents.length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              With Results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold text-slate-900">
              {sortedStudents.filter((s) => s.examCount > 0).length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Excellent (&gt;75%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold text-emerald-600">
              {sortedStudents.filter((s) => s.avg >= 75).length}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              At Risk (&lt;40%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold text-red-600">
              {sortedStudents.filter((s) => s.avg >= 0 && s.avg < 40).length}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Students</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  className="pl-8 w-64"
                  disabled
                />
              </div>
            </div>
          </div>
          <CardDescription>
            Complete list of all registered students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-center">Semester</TableHead>
                  <TableHead className="text-center">Batch</TableHead>
                  <TableHead className="text-right">Exams</TableHead>
                  <TableHead className="text-right">Average</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        No students found
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedStudents.map((s) => {
                    const profile = s.profiles as any;
                    const dept = s.departments as any;
                    const cat = s.avg >= 0 ? classifyLearner(s.avg) : null;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          {s.roll_no}
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link
                            href={`/admin/students/${s.id}`}
                            className="hover:underline"
                          >
                            {profile?.full_name ?? "—"}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {profile?.email ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {dept?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {s.semester}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {s.batch}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {s.examCount}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${cat?.color ?? ""}`}
                        >
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
                            <span className="text-xs text-muted-foreground">
                              No data
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
