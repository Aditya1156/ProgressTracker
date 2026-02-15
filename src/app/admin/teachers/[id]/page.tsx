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
import {
  ArrowLeft,
  Mail,
  BookOpen,
  ClipboardList,
  MessageSquare,
  Calendar,
} from "lucide-react";

export default async function TeacherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getUser();
  const supabase = await createClient();

  // Fetch teacher with profile and department
  const { data: teacher } = await supabase
    .from("teachers")
    .select(
      "id, designation, created_at, profile_id, profiles(full_name, email, role), departments(name, full_name)"
    )
    .eq("id", id)
    .single();

  if (!teacher) return notFound();

  const profile = teacher.profiles as any;
  const department = teacher.departments as any;

  // Fetch subject assignments
  const { data: assignments } = await supabase
    .from("teacher_subject_assignments")
    .select("id, section, semester, academic_year, subjects(name, code)")
    .eq("teacher_id", id)
    .order("semester")
    .order("section");

  // Fetch exams created by this teacher
  const { data: exams } = await supabase
    .from("exams")
    .select("id, name, type, max_marks, exam_date, subjects(name, code)")
    .eq("created_by", teacher.profile_id)
    .order("exam_date", { ascending: false })
    .limit(10);

  // Fetch feedback given by this teacher
  const { data: feedback } = await supabase
    .from("feedback")
    .select(
      "id, type, message, created_at, students(roll_no, profiles(full_name))"
    )
    .eq("teacher_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Counts
  const { count: totalExams } = await supabase
    .from("exams")
    .select("*", { count: "exact", head: true })
    .eq("created_by", teacher.profile_id);

  const { count: totalFeedback } = await supabase
    .from("feedback")
    .select("*", { count: "exact", head: true })
    .eq("teacher_id", id);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/teachers">
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
                <Badge variant="secondary" className="text-xs">
                  {teacher.designation}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs capitalize"
                >
                  {profile?.role}
                </Badge>
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
                Joined{" "}
                {new Date(teacher.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="py-3 px-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Subjects Assigned
            </p>
            <p className="text-2xl font-semibold text-gray-800">
              {assignments?.length ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="py-3 px-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Exams Created
            </p>
            <p className="text-2xl font-semibold text-gray-800">
              {totalExams ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="py-3 px-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Feedback Given
            </p>
            <p className="text-2xl font-semibold text-gray-800">
              {totalFeedback ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Assignments */}
      <Card className="border-gray-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gray-400" />
            <CardTitle className="text-base">Subject Assignments</CardTitle>
          </div>
          <CardDescription>
            Subjects assigned to this teacher
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!assignments || assignments.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No subjects assigned yet.{" "}
              <Link
                href="/admin/manage"
                className="text-[#0f1b4c] underline"
              >
                Manage assignments
              </Link>
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-center">Section</TableHead>
                  <TableHead className="text-center">Semester</TableHead>
                  <TableHead className="text-center">Year</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <span className="font-mono text-sm text-gray-500">
                        {(a.subjects as any)?.code}
                      </span>
                      <span className="ml-2 text-sm font-medium">
                        {(a.subjects as any)?.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {a.section}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {a.semester}
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-400">
                      {a.academic_year}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Exams */}
      <Card className="border-gray-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-gray-400" />
            <CardTitle className="text-base">Recent Exams</CardTitle>
          </div>
          <CardDescription>
            Last {exams?.length ?? 0} exams created
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!exams || exams.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No exams created yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-center">Max Marks</TableHead>
                  <TableHead className="text-center">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium text-sm">
                      {e.name}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm text-gray-500">
                        {(e.subjects as any)?.code}
                      </span>
                      <span className="ml-1 text-sm">
                        {(e.subjects as any)?.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        {e.type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {e.max_marks}
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-400">
                      {new Date(e.exam_date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Feedback */}
      <Card className="border-gray-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            <CardTitle className="text-base">Recent Feedback</CardTitle>
          </div>
          <CardDescription>
            Last {feedback?.length ?? 0} feedback entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!feedback || feedback.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No feedback given yet.
            </p>
          ) : (
            <div className="space-y-3">
              {feedback.map((f) => {
                const student = f.students as any;
                return (
                  <div
                    key={f.id}
                    className="p-3 rounded-lg border border-gray-200/80"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {student?.profiles?.full_name ?? "—"}
                        </span>
                        <span className="font-mono text-xs text-gray-400">
                          {student?.roll_no}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
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
