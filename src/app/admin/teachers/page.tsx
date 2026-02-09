import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import TeachersClient from "./TeachersClient";

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

  // Enrich teachers with counts
  const teachersWithCounts = (teachers ?? []).map((teacher) => {
    const profile = teacher.profiles as any;
    const teacherProfileId = profile?.id;
    const examsCount = teacherProfileId
      ? examCountMap.get(teacherProfileId) ?? 0
      : 0;
    const feedbackCount = feedbackCountMap.get(teacher.id) ?? 0;

    return {
      ...teacher,
      examsCount,
      feedbackCount,
    };
  });

  // Group teachers by designation
  const designations = [
    ...new Set((teachers ?? []).map((t) => t.designation)),
  ];

  // Calculate summary stats
  const totalExams = Array.from(examCountMap.values()).reduce((a, b) => a + b, 0);
  const totalFeedback = Array.from(feedbackCountMap.values()).reduce(
    (a, b) => a + b,
    0
  );

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
              {totalExams}
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
              {totalFeedback}
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

      {/* Teachers List with Search & Export */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Teachers</CardTitle>
          <CardDescription>Faculty members across all departments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TeachersClient teachers={teachersWithCounts} />
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
