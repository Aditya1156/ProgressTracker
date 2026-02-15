import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import FeedbackClient from "./FeedbackClient";

export default async function StudentFeedbackPage() {
  const user = await getUser();
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  const { data: feedbackList } = await supabase
    .from("feedback")
    .select(`
      id,
      type,
      message,
      is_read,
      created_at,
      subjects (name, code),
      teachers (
        profiles (full_name)
      )
    `)
    .eq("student_id", student?.id ?? "")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Feedback</h1>
        <p className="text-sm text-gray-400 mt-1">
          Feedback from your teachers
        </p>
      </div>

      <FeedbackClient feedback={(feedbackList ?? []) as any} />
    </div>
  );
}
