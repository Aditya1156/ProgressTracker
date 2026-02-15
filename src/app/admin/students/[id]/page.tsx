import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Mail, BookOpen, MessageSquare, CalendarCheck } from "lucide-react";
import { classifyLearner, fmtPct } from "@/lib/utils";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getUser();
  const supabase = await createClient();

  // Fetch student with profile and department
  const { data: student } = await supabase
    .from("students")
    .select(
      "id, roll_no, semester, batch, section, created_at, profiles(full_name, email, role), departments(name, full_name)"
    )
    .eq("id", id)
    .single();

  if (!student) return notFound();

  const profile = student.profiles as any;
  const department = student.departments as any;

  // Fetch marks with exam + subject info
  const { data: marks } = await supabase
    .from("marks")
    .select(
      "id, marks_obtained, exams(name, type, max_marks, exam_date, subjects(name, code))"
    )
    .eq("student_id", id)
    .order("created_at", { ascending: false });

  // Calculate average
  const pcts = (marks ?? [])
    .filter((m) => (m.exams as any)?.max_marks)
    .map((m) => {
      const exam = m.exams as any;
      return (m.marks_obtained / exam.max_marks) * 100;
    });
  const avg =
    pcts.length > 0 ? pcts.reduce((a, b) => a + b, 0) / pcts.length : -1;
  const cat = avg >= 0 ? classifyLearner(avg) : null;

  // Fetch feedback received
  const { data: feedback } = await supabase
    .from("feedback")
    .select(
      "id, type, message, created_at, teachers(profiles(full_name))"
    )
    .eq("student_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Attendance stats
  const { count: totalClasses } = await supabase
    .from("attendance")
    .select("*", { count: "exact", head: true })
    .eq("student_id", id);

  const { count: presentCount } = await supabase
    .from("attendance")
    .select("*", { count: "exact", head: true })
    .eq("student_id", id)
    .eq("status", "present");

  const attendancePct =
    totalClasses && totalClasses > 0
      ? Math.round(((presentCount ?? 0) / totalClasses) * 100)
      : -1;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/students">
          <Button variant="ghost" size="sm" className="text-gray-400">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
      </div>

      {/* Profile Card */}
      <Card className="border-gray-200/80 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-full bg-[#0f1b4c] flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-medium text-white">
                {profile?.full_name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) ?? "?"}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-800">
                {profile?.full_name ?? "Unknown"}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs font-mono">
                  {student.roll_no}
                </Badge>
                {student.section && (
                  <Badge variant="outline" className="text-xs">
                    Section {student.section}
                  </Badge>
                )}
                {cat && (
                  <Badge
                    variant="secondary"
                    className={`text-xs border-0 ${cat.bgColor} ${cat.color}`}
                  >
                    {cat.label}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {profile?.email}
                </span>
                <span>
                  {department?.full_name} ({department?.name})
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Batch {student.batch} &middot; Semester {student.semester}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="py-3 px-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Average
            </p>
            <p
              className={`text-2xl font-semibold ${cat?.color ?? "text-gray-800"}`}
            >
              {avg >= 0 ? fmtPct(avg) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="py-3 px-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Exams Taken
            </p>
            <p className="text-2xl font-semibold text-gray-800">
              {marks?.length ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="py-3 px-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Attendance
            </p>
            <p
              className={`text-2xl font-semibold ${
                attendancePct >= 75
                  ? "text-emerald-600"
                  : attendancePct >= 0
                    ? "text-red-600"
                    : "text-gray-800"
              }`}
            >
              {attendancePct >= 0 ? `${attendancePct}%` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="py-3 px-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Feedback
            </p>
            <p className="text-2xl font-semibold text-gray-800">
              {feedback?.length ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Marks Table */}
      <Card className="border-gray-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gray-400" />
            <CardTitle className="text-base">Exam Results</CardTitle>
          </div>
          <CardDescription>
            {marks?.length ?? 0} exam{(marks?.length ?? 0) !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!marks || marks.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No exam results yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-right">Marks</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                  <TableHead className="text-center">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marks.map((m) => {
                  const exam = m.exams as any;
                  const pct = exam?.max_marks
                    ? (m.marks_obtained / exam.max_marks) * 100
                    : 0;
                  const mCat = classifyLearner(pct);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium text-sm">
                        {exam?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm text-gray-500">
                          {exam?.subjects?.code}
                        </span>
                        <span className="ml-1 text-sm">
                          {exam?.subjects?.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-xs">
                          {exam?.type?.replace("_", " ") ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {m.marks_obtained} / {exam?.max_marks ?? "?"}
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm font-medium ${mCat.color}`}
                      >
                        {fmtPct(pct)}
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-400">
                        {exam?.exam_date
                          ? new Date(exam.exam_date).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Feedback */}
      <Card className="border-gray-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            <CardTitle className="text-base">Feedback Received</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!feedback || feedback.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No feedback received yet.
            </p>
          ) : (
            <div className="space-y-3">
              {feedback.map((f) => {
                const teacherName =
                  (f.teachers as any)?.profiles?.full_name ?? "Unknown";
                return (
                  <div
                    key={f.id}
                    className="p-3 rounded-lg border border-gray-200/80"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {teacherName}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs capitalize"
                        >
                          {f.type}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(f.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {f.message}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
