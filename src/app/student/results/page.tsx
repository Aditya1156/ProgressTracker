import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import {
  Card,
  CardContent,
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
import { formatDate, fmtPct } from "@/lib/utils";

export default async function StudentResultsPage() {
  const user = await getUser();
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  const { data: marks } = await supabase
    .from("marks")
    .select(`
      marks_obtained,
      created_at,
      exams (
        name,
        type,
        max_marks,
        exam_date,
        subjects (name, code)
      )
    `)
    .eq("student_id", student?.id ?? "")
    .order("created_at", { ascending: false });

  const allMarks = marks ?? [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">All Results</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete record of all your exam results
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {allMarks.length} Result{allMarks.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allMarks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No results recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allMarks.map((m, i) => {
                  const exam = m.exams as any;
                  const pct = exam
                    ? (m.marks_obtained / exam.max_marks) * 100
                    : 0;
                  const typeLabel = exam?.type
                    ?.replace("_", " ")
                    .replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? "—";
                  return (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {exam?.subjects?.code ?? "—"}
                      </TableCell>
                      <TableCell>{exam?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-normal">
                          {typeLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {m.marks_obtained}/{exam?.max_marks ?? 0}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          pct >= 75
                            ? "text-emerald-600"
                            : pct >= 50
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {fmtPct(pct)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {exam?.exam_date ? formatDate(exam.exam_date) : "—"}
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
