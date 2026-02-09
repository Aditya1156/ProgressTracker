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
import { Plus, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

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

  // Group exams by type
  const examsByType = {
    class_test: (exams ?? []).filter((e) => e.type === "class_test"),
    mid_sem: (exams ?? []).filter((e) => e.type === "mid_sem"),
    end_sem: (exams ?? []).filter((e) => e.type === "end_sem"),
    assignment: (exams ?? []).filter((e) => e.type === "assignment"),
    practical: (exams ?? []).filter((e) => e.type === "practical"),
  };

  const typeColors: Record<string, string> = {
    class_test: "bg-blue-50 text-blue-700 border-blue-200",
    mid_sem: "bg-purple-50 text-purple-700 border-purple-200",
    end_sem: "bg-red-50 text-red-700 border-red-200",
    assignment: "bg-green-50 text-green-700 border-green-200",
    practical: "bg-amber-50 text-amber-700 border-amber-200",
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
          <h1 className="text-xl font-semibold text-slate-900">Exams</h1>
          <p className="text-sm text-muted-foreground mt-1">
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
              <span className="text-2xl font-semibold text-slate-900">
                {typeExams.length}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* All Exams Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">All Exams</CardTitle>
              <CardDescription>
                Complete list of scheduled and completed exams
              </CardDescription>
            </div>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Max Marks</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Entries</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(exams ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        No exams scheduled yet
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  (exams ?? []).map((exam) => {
                    const subject = exam.subjects as any;
                    const dept = subject?.departments as any;
                    return (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">{exam.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{subject?.name ?? "—"}</span>
                            <span className="text-xs text-muted-foreground">
                              {subject?.code ?? ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {dept?.name ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${typeColors[exam.type] ?? ""}`}
                          >
                            {typeLabels[exam.type] ?? exam.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {exam.max_marks}
                        </TableCell>
                        <TableCell className="text-sm">
                          Sem {subject?.semester ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(exam.exam_date)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`text-sm font-medium ${
                              (marksCountMap.get(exam.id) ?? 0) > 0
                                ? "text-emerald-600"
                                : "text-muted-foreground"
                            }`}
                          >
                            {marksCountMap.get(exam.id) ?? 0}
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
