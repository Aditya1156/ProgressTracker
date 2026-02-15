import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import ResultsClient from "./ResultsClient";

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
      exam_id,
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

  // Compute class averages per exam using admin client (bypasses student RLS)
  const examIds = [...new Set(allMarks.map((m) => m.exam_id))];
  let classAvgMap: Record<string, number> = {};

  if (examIds.length > 0) {
    const admin = createAdminClient();
    const { data: classMarks } = await admin
      .from("marks")
      .select("exam_id, marks_obtained, exams(max_marks)")
      .in("exam_id", examIds);

    const grouped: Record<string, number[]> = {};
    for (const m of classMarks ?? []) {
      const exam = m.exams as any;
      const maxMarks = exam?.max_marks ?? 0;
      if (maxMarks > 0) {
        const pct = (m.marks_obtained / maxMarks) * 100;
        if (!grouped[m.exam_id]) grouped[m.exam_id] = [];
        grouped[m.exam_id].push(pct);
      }
    }
    for (const [examId, pcts] of Object.entries(grouped)) {
      classAvgMap[examId] = pcts.reduce((a, b) => a + b, 0) / pcts.length;
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">All Results</h1>
        <p className="text-sm text-gray-400 mt-1">
          Complete record of all your exam results
        </p>
      </div>

      <ResultsClient marks={allMarks} classAvgMap={classAvgMap} />
    </div>
  );
}
