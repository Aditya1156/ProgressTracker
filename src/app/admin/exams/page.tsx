import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import ExamsClient from "./ExamsClient";

export default async function AdminExamsPage() {
  const user = await getUser();
  const supabase = await createClient();

  // Fetch all exams
  const { data: exams } = await supabase
    .from("exams")
    .select(
      `
      id,
      name,
      type,
      max_marks,
      exam_date,
      created_at,
      subjects (name, code, semester, departments(name))
    `
    )
    .order("exam_date", { ascending: false });

  // Count marks entries per exam
  const examIds = (exams ?? []).map((e) => e.id);
  const { data: marksCount } =
    examIds.length > 0
      ? await supabase
          .from("marks")
          .select("exam_id")
          .in("exam_id", examIds)
      : { data: [] };

  const marksCountMap = new Map<string, number>();
  (marksCount ?? []).forEach((m) => {
    marksCountMap.set(m.exam_id, (marksCountMap.get(m.exam_id) ?? 0) + 1);
  });

  // Enrich exams with marks count
  const examsWithCounts = (exams ?? []).map((exam) => ({
    ...exam,
    marksCount: marksCountMap.get(exam.id) ?? 0,
  }));

  // Group exams by type
  const examsByType = {
    class_test: examsWithCounts.filter((e) => e.type === "class_test"),
    mid_sem: examsWithCounts.filter((e) => e.type === "mid_sem"),
    end_sem: examsWithCounts.filter((e) => e.type === "end_sem"),
    assignment: examsWithCounts.filter((e) => e.type === "assignment"),
    practical: examsWithCounts.filter((e) => e.type === "practical"),
  };

  const typeLabels: Record<string, string> = {
    class_test: "Class Test",
    mid_sem: "Mid Sem",
    end_sem: "End Sem",
    assignment: "Assignment",
    practical: "Practical",
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Exams</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage exams and view schedules
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Exam
        </Button>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-5 gap-4">
        {Object.entries(examsByType).map(([type, typeExams]) => (
          <Card key={type}>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider">
                {typeLabels[type]}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-semibold text-gray-800">
                {typeExams.length}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* All Exams Table with Search & Export */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">All Exams</CardTitle>
              <CardDescription>
                Complete list of scheduled and completed exams
              </CardDescription>
            </div>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ExamsClient exams={examsWithCounts} />
        </CardContent>
      </Card>

      {/* Note */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Exams are currently created by teachers. Admin
            exam scheduling and policy management features are coming soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
