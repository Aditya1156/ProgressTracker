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
import { Button } from "@/components/ui/button";
import { UserPlus, Mail } from "lucide-react";
import Link from "next/link";

export default async function AdminTeachersPage() {
  const user = await getUser();
  const supabase = await createClient();

  // Fetch all teachers
  const { data: teachers } = await supabase
    .from("teachers")
    .select(
      `
      id,
      designation,
      created_at,
      profiles (full_name, email),
      departments (name, full_name)
    `
    )
    .order("created_at", { ascending: false });

  // Count exams created by each teacher
  const teacherIds = (teachers ?? []).map((t) => t.id);
  const { data: examCounts } =
    teacherIds.length > 0
      ? await supabase
          .from("exams")
          .select("created_by")
          .not("created_by", "is", null)
      : { data: [] };

  const examCountMap = new Map<string, number>();
  (examCounts ?? []).forEach((e) => {
    if (e.created_by) {
      examCountMap.set(e.created_by, (examCountMap.get(e.created_by) ?? 0) + 1);
    }
  });

  // Count feedback sent by each teacher
  const { data: feedbackCounts } =
    teacherIds.length > 0
      ? await supabase.from("feedback").select("teacher_id").in("teacher_id", teacherIds)
      : { data: [] };

  const feedbackCountMap = new Map<string, number>();
  (feedbackCounts ?? []).forEach((f) => {
    feedbackCountMap.set(
      f.teacher_id,
      (feedbackCountMap.get(f.teacher_id) ?? 0) + 1
    );
  });

  // Group teachers by designation
  const designations = [
    ...new Set((teachers ?? []).map((t) => t.designation)),
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Teachers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage faculty members and their assignments
          </p>
        </div>
        <Button size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Teacher
        </Button>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Total Teachers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold text-slate-900">
              {teachers?.length ?? 0}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Exams Created
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold text-slate-900">
              {Array.from(examCountMap.values()).reduce((a, b) => a + b, 0)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Feedback Given
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold text-slate-900">
              {Array.from(feedbackCountMap.values()).reduce((a, b) => a + b, 0)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Designations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold text-slate-900">
              {designations.length}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Teachers List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Teachers</CardTitle>
          <CardDescription>Faculty members across all departments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead className="text-right">Exams Created</TableHead>
                  <TableHead className="text-right">Feedback Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(teachers ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        No teachers found
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  (teachers ?? []).map((teacher) => {
                    const profile = teacher.profiles as any;
                    const dept = teacher.departments as any;
                    // Find matching user profile for created_by
                    const teacherProfileId = profile?.id;
                    const examsCount = teacherProfileId
                      ? examCountMap.get(teacherProfileId) ?? 0
                      : 0;
                    const feedbackCount = feedbackCountMap.get(teacher.id) ?? 0;

                    return (
                      <TableRow key={teacher.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/admin/teachers/${teacher.id}`}
                            className="hover:underline"
                          >
                            {profile?.full_name ?? "—"}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {profile?.email ?? "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{dept?.full_name ?? "—"}</span>
                            <span className="text-xs text-muted-foreground">
                              {dept?.name ?? ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {teacher.designation}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-medium">{examsCount}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-medium">
                            {feedbackCount}
                          </span>
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

      {/* Designation Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Faculty by Designation</CardTitle>
          <CardDescription>Distribution of teachers by role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {designations.map((designation) => {
              const count = (teachers ?? []).filter(
                (t) => t.designation === designation
              ).length;
              return (
                <div key={designation} className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">{designation}</span>
                  <Badge variant="outline" className="text-xs">
                    {count} {count === 1 ? "teacher" : "teachers"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Note */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> To add, edit, or delete teachers, use the Supabase
            dashboard or create custom admin tools. Teacher management features are
            coming soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
