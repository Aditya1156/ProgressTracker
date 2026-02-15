"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Student {
  id: string;
  roll_no: string;
  semester: number;
  profiles: { full_name: string } | null;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface FeedbackItem {
  id: string;
  type: string;
  message: string;
  created_at: string;
  students: { roll_no: string; profiles: { full_name: string } | null } | null;
  subjects: { code: string } | null;
}

export default function TeacherFeedbackPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<FeedbackItem[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [feedbackType, setFeedbackType] = useState("general");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: teacher } = await supabase
        .from("teachers")
        .select("id, department_id")
        .eq("profile_id", user.id)
        .single();

      if (!teacher) return;
      setTeacherId(teacher.id);

      // Check for explicit subject assignments
      const { data: assignments } = await supabase
        .from("teacher_subject_assignments")
        .select("subject_id, section, semester")
        .eq("teacher_id", teacher.id);

      // Fetch feedback (always — it's teacher's own)
      const { data: feedbackData } = await supabase
        .from("feedback")
        .select("id, type, message, created_at, students(roll_no, profiles(full_name)), subjects(code)")
        .eq("teacher_id", teacher.id)
        .order("created_at", { ascending: false })
        .limit(10);
      setRecentFeedback((feedbackData as any) ?? []);

      if (assignments && assignments.length > 0) {
        // Scoped: only assigned subjects
        const assignedSubjectIds = [...new Set(assignments.map((a: any) => a.subject_id))];
        const { data: subData } = await supabase
          .from("subjects")
          .select("id, name, code")
          .in("id", assignedSubjectIds)
          .order("code");
        setSubjects(subData as any ?? []);

        // Build semester → sections map
        const semesterSections = new Map<number, Set<string>>();
        for (const a of assignments) {
          const sems = semesterSections.get(a.semester) ?? new Set<string>();
          sems.add(a.section);
          semesterSections.set(a.semester, sems);
        }
        // Query students for each semester+section combo
        const studentResults = await Promise.all(
          Array.from(semesterSections.entries()).map(([sem, sections]) =>
            supabase
              .from("students")
              .select("id, roll_no, semester, profiles(full_name)")
              .eq("department_id", teacher.department_id)
              .eq("semester", sem)
              .in("section", Array.from(sections))
              .order("roll_no")
          )
        );
        const allStudents = studentResults.flatMap((r) => r.data ?? []);
        const seen = new Set<string>();
        const uniqueStudents = allStudents.filter((s) => {
          if (seen.has(s.id)) return false;
          seen.add(s.id);
          return true;
        });
        setStudents(uniqueStudents as any ?? []);
      }
      // No fallback: teachers only see assigned students/subjects
      setLoading(false);
    }
    load();
  }, []);

  async function handleSend() {
    if (!selectedStudent || !message.trim() || !teacherId) return;
    setSending(true);

    const { data, error } = await supabase
      .from("feedback")
      .insert({
        student_id: selectedStudent,
        teacher_id: teacherId,
        subject_id: selectedSubject || null,
        type: feedbackType,
        message: message.trim(),
      })
      .select("id, type, message, created_at, students(roll_no, profiles(full_name)), subjects(code)")
      .single();

    if (error) {
      toast.error("Failed to send: " + error.message);
    } else {
      toast.success("Feedback sent");
      setMessage("");
      setSelectedStudent("");
      if (data) {
        setRecentFeedback((prev) => [data as any, ...prev.slice(0, 9)]);
      }
    }

    setSending(false);
  }

  const typeColors: Record<string, string> = {
    appreciation: "bg-emerald-50 text-emerald-700",
    improvement: "bg-blue-50 text-blue-700",
    concern: "bg-red-50 text-red-700",
    general: "bg-gray-50 text-gray-700",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Feedback</h1>
        <p className="text-sm text-gray-400 mt-1">
          Send personalized feedback to students
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Compose */}
        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Send Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.roll_no} – {(s.profiles as { full_name: string } | null)?.full_name ?? "Student"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={feedbackType} onValueChange={setFeedbackType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="appreciation">Appreciation</SelectItem>
                    <SelectItem value="improvement">Improvement</SelectItem>
                    <SelectItem value="concern">Concern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject (optional)</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your feedback here..."
                rows={4}
              />
            </div>

            <Button
              onClick={handleSend}
              disabled={sending || !selectedStudent || !message.trim()}
              className="w-full"
            >
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Feedback
            </Button>
          </CardContent>
        </Card>

        {/* Recent */}
        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Feedback</CardTitle>
            <CardDescription>Your last 10 messages</CardDescription>
          </CardHeader>
          <CardContent>
            {recentFeedback.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                No feedback sent yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentFeedback.map((fb, i) => (
                  <div key={fb.id}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="secondary"
                            className={`text-xs border-0 ${typeColors[fb.type] ?? typeColors.general}`}
                          >
                            {fb.type}
                          </Badge>
                          {fb.subjects && (
                            <span className="text-xs text-gray-400">
                              {(fb.subjects as { code: string }).code}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {fb.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          To: {(fb.students as { roll_no: string; profiles: { full_name: string } | null } | null)?.profiles?.full_name ?? "Student"} &middot;{" "}
                          {formatDate(fb.created_at)}
                        </p>
                      </div>
                    </div>
                    {i < recentFeedback.length - 1 && <Separator className="mt-3" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
