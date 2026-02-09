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
import { Loader2, Plus, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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

// Validation schema for exam creation
const examSchema = z.object({
  name: z
    .string()
    .min(2, "Exam name must be at least 2 characters")
    .max(100, "Exam name must be less than 100 characters"),
  type: z.enum(["class_test", "mid_sem", "end_sem", "assignment", "practical"]),
  max_marks: z
    .number()
    .min(1, "Maximum marks must be at least 1")
    .max(1000, "Maximum marks cannot exceed 1000"),
  exam_date: z.string().min(1, "Exam date is required"),
});

type ExamFormData = z.infer<typeof examSchema>;

export default function TeacherMarksPage() {
  const supabase = createClient();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [marksMap, setMarksMap] = useState<Record<string, string>>({});
  const [marksErrors, setMarksErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // New exam dialog
  const [showNewExam, setShowNewExam] = useState(false);
  const [creatingExam, setCreatingExam] = useState(false);

  // Form validation for exam creation
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      name: "",
      type: "class_test",
      max_marks: 100,
      exam_date: new Date().toISOString().split("T")[0],
    },
  });

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
        setMarksErrors({}); // Clear any validation errors
      })();
    }
  }, [selectedExam]);

  async function handleCreateExam(formData: ExamFormData) {
    if (!selectedSubject) {
      toast.error("Please select a subject first");
      return;
    }

    setCreatingExam(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("exams")
      .insert({
        name: formData.name.trim(),
        type: formData.type,
        max_marks: formData.max_marks,
        exam_date: formData.exam_date,
        subject_id: selectedSubject,
        created_by: user?.id,
      })
      .select("id, name, type, max_marks, exam_date, subject_id, subjects(name, code)")
      .single();

    if (error) {
      toast.error("Failed to create exam: " + error.message);
    } else if (data) {
      toast.success("Exam created successfully");
      setExams((prev) => [data as any, ...prev]);
      setSelectedExam(data.id);
      setShowNewExam(false);
      reset(); // Reset form to default values
    }

    setCreatingExam(false);
  }

  // Validate individual mark entry
  function validateMark(value: string, maxMarks: number): string | null {
    if (value.trim() === "") return null; // Empty is allowed

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return "Must be a valid number";
    }
    if (numValue < 0) {
      return "Cannot be negative";
    }
    if (numValue > maxMarks) {
      return `Cannot exceed ${maxMarks}`;
    }
    return null;
  }

  // Handle marks input with validation
  function handleMarksChange(studentId: string, value: string) {
    setMarksMap((prev) => ({
      ...prev,
      [studentId]: value,
    }));

    // Validate the input
    const maxMarks = selectedExamObj?.max_marks ?? 100;
    const error = validateMark(value, maxMarks);

    setMarksErrors((prev) => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[studentId] = error;
      } else {
        delete newErrors[studentId];
      }
      return newErrors;
    });
  }

  async function handleSaveMarks() {
    if (!selectedExam) return;

    // Check for validation errors
    const hasErrors = Object.keys(marksErrors).length > 0;
    if (hasErrors) {
      toast.error("Please fix validation errors before saving");
      return;
    }

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
      toast.success(`Saved marks for ${entries.length} student${entries.length > 1 ? "s" : ""}`);
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
                      <form onSubmit={handleSubmit(handleCreateExam)}>
                        <DialogHeader>
                          <DialogTitle>Create Exam</DialogTitle>
                          <DialogDescription>
                            Add a new exam for the selected subject
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">
                              Exam Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="name"
                              {...register("name")}
                              placeholder="e.g. Mid Sem 1"
                              className={errors.name ? "border-red-500" : ""}
                            />
                            {errors.name && (
                              <div className="flex items-center gap-1 text-xs text-red-600">
                                <AlertCircle className="h-3 w-3" />
                                {errors.name.message}
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="type">Type</Label>
                              <Select
                                defaultValue="class_test"
                                onValueChange={(value) => {
                                  const field = register("type");
                                  field.onChange({
                                    target: { value, name: "type" },
                                  });
                                }}
                              >
                                <SelectTrigger id="type">
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
                              <Label htmlFor="max_marks">
                                Max Marks <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="max_marks"
                                type="number"
                                {...register("max_marks", {
                                  valueAsNumber: true,
                                })}
                                className={errors.max_marks ? "border-red-500" : ""}
                              />
                              {errors.max_marks && (
                                <div className="flex items-center gap-1 text-xs text-red-600">
                                  <AlertCircle className="h-3 w-3" />
                                  {errors.max_marks.message}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="exam_date">
                              Date <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="exam_date"
                              type="date"
                              {...register("exam_date")}
                              className={errors.exam_date ? "border-red-500" : ""}
                            />
                            {errors.exam_date && (
                              <div className="flex items-center gap-1 text-xs text-red-600">
                                <AlertCircle className="h-3 w-3" />
                                {errors.exam_date.message}
                              </div>
                            )}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={creatingExam} className="btn-ripple">
                            {creatingExam && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Create Exam
                          </Button>
                        </DialogFooter>
                      </form>
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
              <Button onClick={handleSaveMarks} disabled={saving} className="btn-ripple">
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
                  {students.map((s) => {
                    const hasError = marksErrors[s.id];
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-sm">
                          {s.roll_no}
                        </TableCell>
                        <TableCell>
                          {(s.profiles as { full_name: string } | null)?.full_name ?? "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <Input
                              type="number"
                              min={0}
                              max={selectedExamObj?.max_marks ?? 100}
                              step="0.5"
                              className={`w-24 text-right ${
                                hasError ? "border-red-500 focus-visible:ring-red-500" : ""
                              }`}
                              value={marksMap[s.id] ?? ""}
                              onChange={(e) => handleMarksChange(s.id, e.target.value)}
                              placeholder="—"
                            />
                            {hasError && (
                              <div className="flex items-center gap-1 text-xs text-red-600 whitespace-nowrap">
                                <AlertCircle className="h-3 w-3" />
                                {hasError}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
