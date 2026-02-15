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
import { Loader2, Plus, AlertCircle, Upload, BarChart3, TrendingUp, TrendingDown, Target, CheckCircle2, XCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { chartColors, chartDefaults, tooltipStyles, axisStyle, gridStyle, getPerformanceColor } from "@/lib/chart-config";
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
  const [assignedSections, setAssignedSections] = useState<Record<string, string[]>>({});

  // New exam dialog
  const [showNewExam, setShowNewExam] = useState(false);
  const [creatingExam, setCreatingExam] = useState(false);

  // CSV import
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvRows, setCsvRows] = useState<Array<{ rollNo: string; marks: string; name: string; studentId: string | null; error: string | null }>>([]);
  const [csvImporting, setCsvImporting] = useState(false);

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

      // Check for explicit subject assignments
      const { data: assignments } = await supabase
        .from("teacher_subject_assignments")
        .select("subject_id, section")
        .eq("teacher_id", teacher.id);

      let subs: Subject[] = [];
      if (assignments && assignments.length > 0) {
        // Scoped: only assigned subjects
        const subjectIds = [...new Set(assignments.map((a) => a.subject_id))];
        const { data } = await supabase
          .from("subjects")
          .select("id, name, code, semester")
          .in("id", subjectIds)
          .order("semester")
          .order("code");
        subs = (data ?? []) as Subject[];

        // Build section map: subjectId -> [sections]
        const sectionMap: Record<string, string[]> = {};
        for (const a of assignments) {
          if (!sectionMap[a.subject_id]) sectionMap[a.subject_id] = [];
          if (!sectionMap[a.subject_id].includes(a.section)) {
            sectionMap[a.subject_id].push(a.section);
          }
        }
        setAssignedSections(sectionMap);
      }
      // No fallback: teachers only see assigned subjects

      setSubjects(subs);
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

    let query = supabase
      .from("students")
      .select("id, roll_no, semester, profiles(full_name)")
      .eq("department_id", teacher.department_id)
      .eq("semester", subject.semester);

    // Filter by assigned sections if teacher has assignments
    const sections = assignedSections[subjectId];
    if (sections && sections.length > 0) {
      query = query.in("section", sections);
    }

    const { data } = await query.order("roll_no");
    setStudents(data as any ?? []);
  }, [subjects, assignedSections]);

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

  // ─── Exam Analytics ───
  const examStats = (() => {
    if (!selectedExam || !selectedExamObj) return null;
    const filled = Object.values(marksMap).filter((v) => v.trim() !== "").map((v) => parseFloat(v));
    if (filled.length === 0) return null;
    const maxMarks = selectedExamObj.max_marks;
    const sorted = [...filled].sort((a, b) => a - b);
    const avg = filled.reduce((a, b) => a + b, 0) / filled.length;
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    const passCount = filled.filter((m) => (m / maxMarks) * 100 >= 40).length;
    const pcts = filled.map((m) => (m / maxMarks) * 100);

    // Distribution buckets
    const buckets = [
      { name: "0-20%", value: 0 },
      { name: "20-40%", value: 0 },
      { name: "40-60%", value: 0 },
      { name: "60-80%", value: 0 },
      { name: "80-100%", value: 0 },
    ];
    for (const p of pcts) {
      if (p < 20) buckets[0].value++;
      else if (p < 40) buckets[1].value++;
      else if (p < 60) buckets[2].value++;
      else if (p < 80) buckets[3].value++;
      else buckets[4].value++;
    }

    return {
      count: filled.length,
      avg: (avg / maxMarks) * 100,
      highest: sorted[sorted.length - 1],
      lowest: sorted[0],
      median,
      passRate: (passCount / filled.length) * 100,
      buckets,
    };
  })();

  // ─── CSV Import ───
  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      const maxMarks = selectedExamObj?.max_marks ?? 100;

      // Skip header if it looks like one
      const startIdx = lines[0]?.toLowerCase().includes("roll") ? 1 : 0;

      const parsed = lines.slice(startIdx).map((line) => {
        const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
        const rollNo = parts[0]?.toUpperCase() ?? "";
        const marks = parts[1] ?? "";
        const student = students.find((s) => s.roll_no === rollNo);
        let error: string | null = null;

        if (!student) {
          error = "Unknown roll number";
        } else if (marks.trim() === "") {
          error = "No marks value";
        } else {
          const num = parseFloat(marks);
          if (isNaN(num)) error = "Invalid number";
          else if (num < 0) error = "Negative marks";
          else if (num > maxMarks) error = `Exceeds max (${maxMarks})`;
        }

        return {
          rollNo,
          marks,
          name: student ? ((student.profiles as any)?.full_name ?? "—") : "—",
          studentId: student?.id ?? null,
          error,
        };
      });

      setCsvRows(parsed);
    };
    reader.readAsText(file);
  }

  async function handleCsvImport() {
    if (!selectedExam) return;
    setCsvImporting(true);

    const { data: { user } } = await supabase.auth.getUser();
    const validRows = csvRows.filter((r) => !r.error && r.studentId);
    const entries = validRows.map((r) => ({
      student_id: r.studentId!,
      exam_id: selectedExam,
      marks_obtained: parseFloat(r.marks),
      entered_by: user?.id,
    }));

    const { error } = await supabase
      .from("marks")
      .upsert(entries, { onConflict: "student_id,exam_id" });

    if (error) {
      toast.error("Import failed: " + error.message);
    } else {
      toast.success(`Imported marks for ${entries.length} students`);
      // Update local marks map
      const newMap = { ...marksMap };
      for (const r of validRows) {
        if (r.studentId) newMap[r.studentId] = r.marks;
      }
      setMarksMap(newMap);
      setShowCsvImport(false);
      setCsvRows([]);
    }

    setCsvImporting(false);
  }

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
        <h1 className="text-xl font-semibold text-gray-800">Enter Marks</h1>
        <p className="text-sm text-gray-400 mt-1">
          Select a subject and exam, then enter student marks
        </p>
      </div>

      {/* Filters */}
      <Card className="border-gray-200/80 shadow-sm">
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
                  <div className="flex items-center gap-1">
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
                          <Button type="submit" disabled={creatingExam}>
                            {creatingExam && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Create Exam
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  {selectedExam && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => { setShowCsvImport(true); setCsvRows([]); }}
                    >
                      <Upload className="h-3 w-3 mr-1" /> Import CSV
                    </Button>
                  )}
                  </div>
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
        <Card className="border-gray-200/80 shadow-sm">
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
              <p className="text-sm text-gray-400 py-4 text-center">
                No students found for this semester.
              </p>
            ) : (
              <div className="overflow-x-auto">
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
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══════════════ EXAM ANALYTICS ═══════════════ */}
      {examStats && (
        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#0f1b4c]" />
              Exam Analytics
            </CardTitle>
            <CardDescription>
              {examStats.count} marks entered out of {students.length} students
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-xs text-blue-600 font-medium">Average</div>
                <div className="text-lg font-bold text-blue-700">{examStats.avg.toFixed(1)}%</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <div className="text-xs text-emerald-600 font-medium flex items-center justify-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Highest
                </div>
                <div className="text-lg font-bold text-emerald-700">{examStats.highest}/{selectedExamObj?.max_marks}</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-xs text-red-600 font-medium flex items-center justify-center gap-1">
                  <TrendingDown className="h-3 w-3" /> Lowest
                </div>
                <div className="text-lg font-bold text-red-700">{examStats.lowest}/{selectedExamObj?.max_marks}</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-xs text-purple-600 font-medium flex items-center justify-center gap-1">
                  <Target className="h-3 w-3" /> Median
                </div>
                <div className="text-lg font-bold text-purple-700">{examStats.median}/{selectedExamObj?.max_marks}</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <div className="text-xs text-amber-600 font-medium">Pass Rate</div>
                <div className="text-lg font-bold text-amber-700">{examStats.passRate.toFixed(0)}%</div>
              </div>
            </div>

            {/* Score Distribution Chart */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Score Distribution</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={examStats.buckets} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <CartesianGrid {...gridStyle} />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={tooltipStyles.contentStyle}
                    labelStyle={tooltipStyles.labelStyle}
                    formatter={(v: unknown) => [`${v} students`, "Count"]}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={800}>
                    {examStats.buckets.map((_, i) => (
                      <Cell key={i} fill={["#ef4444", "#f97316", "#eab308", "#3b82f6", "#10b981"][i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════════ CSV IMPORT DIALOG ═══════════════ */}
      <Dialog open={showCsvImport} onOpenChange={setShowCsvImport}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Marks from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with columns: Roll No, Marks
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              type="file"
              accept=".csv"
              onChange={handleCsvFile}
              className="cursor-pointer"
            />

            {csvRows.length > 0 && (
              <>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" />
                    {csvRows.filter((r) => !r.error).length} valid
                  </span>
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-3 w-3" />
                    {csvRows.filter((r) => r.error).length} errors
                  </span>
                </div>
                <div className="max-h-60 overflow-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Roll No</TableHead>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs text-right">Marks</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvRows.map((r, i) => (
                        <TableRow key={i} className={r.error ? "bg-red-50/50" : ""}>
                          <TableCell className="font-mono text-xs py-1.5">{r.rollNo}</TableCell>
                          <TableCell className="text-xs py-1.5">{r.name}</TableCell>
                          <TableCell className="text-xs text-right py-1.5">{r.marks}</TableCell>
                          <TableCell className="text-xs py-1.5">
                            {r.error ? (
                              <span className="text-red-600">{r.error}</span>
                            ) : (
                              <span className="text-emerald-600">OK</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCsvImport(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCsvImport}
              disabled={csvImporting || csvRows.filter((r) => !r.error).length === 0}
            >
              {csvImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import {csvRows.filter((r) => !r.error).length} Marks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
