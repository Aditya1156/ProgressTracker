import { createClient } from "@/lib/supabase/server";
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

      <ResultsClient marks={allMarks} />
    </div>
  );
}
