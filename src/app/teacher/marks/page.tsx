"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  code: string;
  semester: number;
}

interface Exam {
  id: string;
  name: string;
  type: string;
  max_marks: number;
  exam_date: string;
  subject_id: string;
  subjects: { name: string; code: string } | null;
}

interface Student {
  id: string;
  roll_no: string;
  semester: number;
  profiles: { full_name: string } | null;
}

export default function TeacherMarksPage() {
  const supabase = createClient();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [marksMap, setMarksMap] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // New exam dialog
  const [showNewExam, setShowNewExam] = useState(false);
  const [newExam, setNewExam] = useState({
    name: "",
    type: "class_test",
    max_marks: "100",
    exam_date: new Date().toISOString().split("T")[0],
  });
  const [creatingExam, setCreatingExam] = useState(false);

  useEffect(() => {
    async function load() {
      // Get current user's profile + teacher record
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: teacher } = await supabase
        .from("teachers")
        .select("id, department_id")
        .eq("profile_id", user.id)
        .single();

      if (!teacher) return;

      const { data: subs } = await supabase
        .from("subjects")
        .select("id, name, code, semester")
        .eq("department_id", teacher.department_id)
        .order("semester")
        .order("code");

      setSubjects(subs ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const loadExams = useCallback(async (subjectId: string) => {
    const { data } = await supabase
      .from("exams")
      .select("id, name, type, max_marks, exam_date, subject_id, subjects(name, code)")
      .eq("subject_id", subjectId)
      .order("exam_date", { ascending: false });
    setExams(data as any ?? []);
  }, []);

  const loadStudents = useCallback(async (subjectId: string) => {
    // Load students for the same semester as the subject
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: teacher } = await supabase
      .from("teachers")
      .select("department_id")
      .eq("profile_id", user.id)
      .single();

    if (!teacher) return;

    const { data } = await supabase
      .from("students")
      .select("id, roll_no, semester, profiles(full_name)")
      .eq("department_id", teacher.department_id)
      .eq("semester", subject.semester)
      .order("roll_no");

    setStudents(data as any ?? []);
  }, [subjects]);

  useEffect(() => {
    if (selectedSubject) {
      loadExams(selectedSubject);
      loadStudents(selectedSubject);
      setSelectedExam("");
      setMarksMap({});
    }
  }, [selectedSubject, loadExams, loadStudents]);

  useEffect(() => {
    if (selectedExam) {
      // Load existing marks for this exam
      (async () => {
        const { data } = await supabase
          .from("marks")
          .select("student_id, marks_obtained")
          .eq("exam_id", selectedExam);

        const map: Record<string, string> = {};
        for (const m of data ?? []) {
          map[m.student_id] = String(m.marks_obtained);
        }
        setMarksMap(map);
      })();
    }
  }, [selectedExam]);

  async function handleCreateExam() {
    if (!selectedSubject || !newExam.name.trim()) return;
    setCreatingExam(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("exams")
      .insert({
        name: newExam.name.trim(),
        type: newExam.type,
        max_marks: parseInt(newExam.max_marks) || 100,
        exam_date: newExam.exam_date,
        subject_id: selectedSubject,
        created_by: user?.id,
      })
      .select("id, name, type, max_marks, exam_date, subject_id, subjects(name, code)")
      .single();

    if (error) {
      toast.error("Failed to create exam: " + error.message);
    } else if (data) {
      toast.success("Exam created");
      setExams((prev) => [data as any, ...prev]);
      setSelectedExam(data.id);
      setShowNewExam(false);
      setNewExam({ name: "", type: "class_test", max_marks: "100", exam_date: new Date().toISOString().split("T")[0] });
    }

    setCreatingExam(false);
  }

  async function handleSaveMarks() {
    if (!selectedExam) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    const entries = Object.entries(marksMap)
      .filter(([, v]) => v.trim() !== "")
      .map(([studentId, marks]) => ({
        student_id: studentId,
        exam_id: selectedExam,
        marks_obtained: parseFloat(marks),
        entered_by: user?.id,
      }));

    if (entries.length === 0) {
      toast.error("No marks to save");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("marks")
      .upsert(entries, { onConflict: "student_id,exam_id" });

    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success(`Saved marks for ${entries.length} students`);
    }

    setSaving(false);
  }

  const selectedExamObj = exams.find((e) => e.id === selectedExam);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Enter Marks</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select a subject and exam, then enter student marks
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.code} – {s.name} (Sem {s.semester})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Exam</Label>
                {selectedSubject && (
                  <Dialog open={showNewExam} onOpenChange={setShowNewExam}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 text-xs">
                        <Plus className="h-3 w-3 mr-1" /> New Exam
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Exam</DialogTitle>
                        <DialogDescription>
                          Add a new exam for the selected subject
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Exam Name</Label>
                          <Input
                            value={newExam.name}
                            onChange={(e) =>
                              setNewExam({ ...newExam, name: e.target.value })
                            }
                            placeholder="e.g. Mid Sem 1"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                              value={newExam.type}
                              onValueChange={(v) =>
                                setNewExam({ ...newExam, type: v })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="class_test">Class Test</SelectItem>
                                <SelectItem value="mid_sem">Mid Sem</SelectItem>
                                <SelectItem value="end_sem">End Sem</SelectItem>
                                <SelectItem value="assignment">Assignment</SelectItem>
                                <SelectItem value="practical">Practical</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Max Marks</Label>
                            <Input
                              type="number"
                              value={newExam.max_marks}
                              onChange={(e) =>
                                setNewExam({ ...newExam, max_marks: e.target.value })
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={newExam.exam_date}
                            onChange={(e) =>
                              setNewExam({ ...newExam, exam_date: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleCreateExam} disabled={creatingExam}>
                          {creatingExam && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Create Exam
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <Select
                value={selectedExam}
                onValueChange={setSelectedExam}
                disabled={!selectedSubject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} ({e.type.replace("_", " ")}) – Max: {e.max_marks}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marks entry table */}
      {selectedExam && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {selectedExamObj?.name ?? "Exam"}
                </CardTitle>
                <CardDescription>
                  Max marks: {selectedExamObj?.max_marks ?? 0} &middot;{" "}
                  {students.length} students
                </CardDescription>
              </div>
              <Button onClick={handleSaveMarks} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No students found for this semester.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Roll No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-32 text-right">
                      Marks (/{selectedExamObj?.max_marks ?? 0})
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-sm">
                        {s.roll_no}
                      </TableCell>
                      <TableCell>
                        {(s.profiles as { full_name: string } | null)?.full_name ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={0}
                          max={selectedExamObj?.max_marks ?? 100}
                          step="0.5"
                          className="w-24 ml-auto text-right"
                          value={marksMap[s.id] ?? ""}
                          onChange={(e) =>
                            setMarksMap((prev) => ({
                              ...prev,
                              [s.id]: e.target.value,
                            }))
                          }
                          placeholder="—"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
