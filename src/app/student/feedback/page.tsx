import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { MessageSquare } from "lucide-react";

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

  // Mark all as read
  if (student?.id) {
    await supabase
      .from("feedback")
      .update({ is_read: true })
      .eq("student_id", student.id)
      .eq("is_read", false);
  }

  const allFeedback = feedbackList ?? [];

  const typeColors: Record<string, string> = {
    appreciation: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    improvement: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    concern: "bg-red-500/10 text-red-700 dark:text-red-400",
    general: "bg-white/40 dark:bg-white/5 text-foreground/80",
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Feedback</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Feedback from your teachers
        </p>
      </div>

      {allFeedback.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
            <p>No feedback yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {allFeedback.map((fb) => {
            const teacher = fb.teachers as any;
            const subject = fb.subjects as any;
            return (
              <Card key={fb.id} className="glass-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={`text-xs border-0 ${
                          typeColors[fb.type] ?? typeColors.general
                        }`}
                      >
                        {fb.type.charAt(0).toUpperCase() + fb.type.slice(1)}
                      </Badge>
                      {subject && (
                        <span className="text-xs text-muted-foreground">
                          {subject.code}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(fb.created_at)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {fb.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-3">
                    — {teacher?.profiles?.full_name ?? "Teacher"}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
