"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Plus,
  X,
  BookOpen,
  Users,
  Pencil,
  Trash2,
} from "lucide-react";

interface Teacher {
  id: string;
  designation: string;
  profiles: any;
  departments: any;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  semester: number;
  department_id: string;
}

interface Assignment {
  id: string;
  teacher_id: string;
  subject_id: string;
  section: string;
  semester: number;
  academic_year: string;
  teachers: any;
  subjects: any;
}

interface Student {
  id: string;
  roll_no: string;
  semester: number;
  batch: string;
  section?: string;
  profiles: any;
}

interface ManageClientProps {
  teachers: Teacher[];
  subjects: Subject[];
  assignments: Assignment[];
  students: Student[];
  departmentId: string | null;
}

export default function ManageClient({
  teachers,
  subjects,
  assignments: initialAssignments,
  students: initialStudents,
  departmentId,
}: ManageClientProps) {
  const supabase = createClient();

  // ─── Teacher Assignments State ───
  const [assignments, setAssignments] = useState(initialAssignments);
  const [activeSemester, setActiveSemester] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // ─── Student Sections State ───
  const [students, setStudents] = useState(initialStudents);
  const [studentFilterBatch, setStudentFilterBatch] = useState("all");
  const [studentFilterSemester, setStudentFilterSemester] = useState("all");
  const [studentFilterSection, setStudentFilterSection] = useState("all");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set()
  );
  const [moveToSection, setMoveToSection] = useState("");
  const [movingStudents, setMovingStudents] = useState(false);
  const [bulkSemester, setBulkSemester] = useState("");
  const [updatingBulkSem, setUpdatingBulkSem] = useState(false);

  // Edit student dialog state
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState("");
  const [editUSN, setEditUSN] = useState("");
  const [editBatch, setEditBatch] = useState("");
  const [editSemester, setEditSemester] = useState("");
  const [editSection, setEditSection] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Remove student state
  const [removeTarget, setRemoveTarget] = useState<Student | null>(null);
  const [removeSubmitting, setRemoveSubmitting] = useState(false);

  // Add student dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addUSN, setAddUSN] = useState("");
  const [addBatch, setAddBatch] = useState("");
  const [addSemester, setAddSemester] = useState("1");
  const [addSection, setAddSection] = useState("");
  const [addLateral, setAddLateral] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);

  // ─── Derived Data ───

  // Build semester → batch + sections mapping from students
  const semesterInfo = useMemo(() => {
    const map = new Map<
      number,
      { batch: string; sections: string[] }
    >();
    for (const s of initialStudents) {
      if (!map.has(s.semester)) {
        map.set(s.semester, { batch: s.batch, sections: [] });
      }
      const info = map.get(s.semester)!;
      if (s.section && !info.sections.includes(s.section)) {
        info.sections.push(s.section);
      }
      // Use latest batch for this semester
      if (s.batch > info.batch) info.batch = s.batch;
    }
    // Sort sections
    for (const info of map.values()) {
      info.sections.sort();
    }
    return map;
  }, [initialStudents]);

  const semesters = useMemo(
    () => [...semesterInfo.keys()].sort((a, b) => a - b),
    [semesterInfo]
  );

  // Semester-specific data
  const currentSemInfo = activeSemester
    ? semesterInfo.get(Number(activeSemester))
    : null;

  const semSubjects = useMemo(() => {
    if (!activeSemester) return [];
    return subjects.filter((s) => s.semester === Number(activeSemester));
  }, [subjects, activeSemester]);

  const semSections = currentSemInfo?.sections ?? [];

  const semAssignments = useMemo(() => {
    if (!activeSemester) return [];
    return assignments.filter(
      (a) => a.semester === Number(activeSemester)
    );
  }, [assignments, activeSemester]);

  // Teacher workload for selected semester
  const semTeacherWorkload = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of teachers) {
      map.set(t.id, 0);
    }
    for (const a of semAssignments) {
      map.set(a.teacher_id, (map.get(a.teacher_id) ?? 0) + 1);
    }
    return map;
  }, [teachers, semAssignments]);

  // All batches and sections for student tab
  const allBatches = useMemo(
    () =>
      [...new Set(initialStudents.map((s) => s.batch))]
        .sort()
        .reverse(),
    [initialStudents]
  );
  const allSections = useMemo(
    () =>
      [
        ...new Set(
          initialStudents.map((s) => s.section).filter(Boolean)
        ),
      ].sort() as string[],
    [initialStudents]
  );
  const allStudentSemesters = useMemo(
    () =>
      [...new Set(initialStudents.map((s) => s.semester))].sort(
        (a, b) => a - b
      ),
    [initialStudents]
  );

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (studentFilterBatch !== "all" && s.batch !== studentFilterBatch)
        return false;
      if (
        studentFilterSemester !== "all" &&
        s.semester !== Number(studentFilterSemester)
      )
        return false;
      if (
        studentFilterSection !== "all" &&
        s.section !== studentFilterSection
      )
        return false;
      return true;
    });
  }, [
    students,
    studentFilterBatch,
    studentFilterSemester,
    studentFilterSection,
  ]);

  // ─── Assignment Actions ───
  async function handleAssign() {
    if (!selectedTeacher || !selectedSubject || !selectedSection) {
      toast.error("Please select teacher, subject, and section");
      return;
    }

    setAssigning(true);

    const subject = subjects.find((s) => s.id === selectedSubject);
    if (!subject) {
      toast.error("Subject not found");
      setAssigning(false);
      return;
    }

    const { data, error } = await supabase
      .from("teacher_subject_assignments")
      .insert({
        teacher_id: selectedTeacher,
        subject_id: selectedSubject,
        section: selectedSection,
        semester: subject.semester,
        department_id: subject.department_id,
      })
      .select(
        "id, teacher_id, subject_id, section, semester, academic_year, teachers(id, profiles(full_name)), subjects(name, code)"
      )
      .single();

    if (error) {
      if (
        error.message.includes("duplicate") ||
        error.message.includes("unique")
      ) {
        toast.error("This assignment already exists");
      } else {
        toast.error("Failed to assign: " + error.message);
      }
    } else if (data) {
      toast.success("Teacher assigned successfully");
      setAssignments((prev) => [...prev, data as Assignment]);
      setSelectedTeacher("");
      setSelectedSubject("");
      setSelectedSection("");
    }

    setAssigning(false);
  }

  async function handleRemoveAssignment(id: string) {
    setRemovingId(id);

    const { error } = await supabase
      .from("teacher_subject_assignments")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to remove: " + error.message);
    } else {
      toast.success("Assignment removed");
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    }

    setRemovingId(null);
  }

  // ─── Student Section Actions ───
  function toggleStudent(id: string) {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllFiltered() {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map((s) => s.id)));
    }
  }

  async function handleMoveStudents() {
    if (!moveToSection || selectedStudents.size === 0) {
      toast.error("Select students and target section");
      return;
    }

    setMovingStudents(true);

    const ids = Array.from(selectedStudents);
    const { error } = await supabase
      .from("students")
      .update({ section: moveToSection })
      .in("id", ids);

    if (error) {
      toast.error("Failed to move students: " + error.message);
    } else {
      toast.success(
        `Moved ${ids.length} student${ids.length > 1 ? "s" : ""} to Section ${moveToSection}`
      );
      setStudents((prev) =>
        prev.map((s) =>
          ids.includes(s.id) ? { ...s, section: moveToSection } : s
        )
      );
      setSelectedStudents(new Set());
      setMoveToSection("");
    }

    setMovingStudents(false);
  }

  // ─── Add Student ───
  function resetAddForm() {
    setAddName("");
    setAddUSN("");
    setAddBatch("");
    setAddSemester("1");
    setAddSection("");
    setAddLateral(false);
  }

  async function handleAddStudent() {
    if (!addName.trim() || !addUSN.trim() || !addBatch || !addSection) {
      toast.error("Please fill all required fields");
      return;
    }

    setAddSubmitting(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: addName.trim(),
          roll_no: addUSN.trim().toUpperCase(),
          batch: addBatch,
          semester: Number(addSemester),
          section: addSection,
          is_lateral: addLateral,
          department_id: departmentId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to add student");
        return;
      }

      toast.success(`Student ${addUSN.toUpperCase()} added`);
      // Add to local state
      setStudents((prev) => [
        ...prev,
        {
          id: data.id,
          roll_no: addUSN.trim().toUpperCase(),
          semester: Number(addSemester),
          batch: addBatch,
          section: addSection,
          profiles: { full_name: addName.trim() },
        },
      ]);
      setAddOpen(false);
      resetAddForm();
    } catch {
      toast.error("Network error");
    } finally {
      setAddSubmitting(false);
    }
  }

  // ─── Edit Student ───
  function openEditDialog(s: Student) {
    setEditStudent(s);
    setEditName((s.profiles as any)?.full_name ?? "");
    setEditUSN(s.roll_no);
    setEditBatch(s.batch);
    setEditSemester(String(s.semester));
    setEditSection(s.section ?? "");
  }

  async function handleEditStudent() {
    if (!editStudent) return;
    setEditSubmitting(true);

    try {
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: editStudent.id,
          full_name: editName.trim(),
          roll_no: editUSN.trim().toUpperCase(),
          batch: editBatch,
          semester: Number(editSemester),
          section: editSection,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update");
        return;
      }

      toast.success(`${editUSN.toUpperCase()} updated`);
      setStudents((prev) =>
        prev.map((s) =>
          s.id === editStudent.id
            ? {
                ...s,
                roll_no: editUSN.trim().toUpperCase(),
                batch: editBatch,
                semester: Number(editSemester),
                section: editSection,
                profiles: { ...(s.profiles as any), full_name: editName.trim() },
              }
            : s
        )
      );
      setEditStudent(null);
    } catch {
      toast.error("Network error");
    } finally {
      setEditSubmitting(false);
    }
  }

  // ─── Remove Student ───
  async function handleRemoveStudent() {
    if (!removeTarget) return;
    setRemoveSubmitting(true);

    try {
      const res = await fetch("/api/students", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: removeTarget.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to remove");
        return;
      }

      toast.success(`${removeTarget.roll_no} removed`);
      setStudents((prev) => prev.filter((s) => s.id !== removeTarget.id));
      setSelectedStudents((prev) => {
        const next = new Set(prev);
        next.delete(removeTarget.id);
        return next;
      });
      setRemoveTarget(null);
    } catch {
      toast.error("Network error");
    } finally {
      setRemoveSubmitting(false);
    }
  }

  // ─── Bulk Semester Update ───
  async function handleBulkSemester() {
    if (!bulkSemester || selectedStudents.size === 0) {
      toast.error("Select students and target semester");
      return;
    }

    setUpdatingBulkSem(true);
    const ids = Array.from(selectedStudents);
    const { error } = await supabase
      .from("students")
      .update({ semester: Number(bulkSemester) })
      .in("id", ids);

    if (error) {
      toast.error("Failed: " + error.message);
    } else {
      toast.success(
        `Updated ${ids.length} student${ids.length > 1 ? "s" : ""} to Semester ${bulkSemester}`
      );
      setStudents((prev) =>
        prev.map((s) =>
          ids.includes(s.id)
            ? { ...s, semester: Number(bulkSemester) }
            : s
        )
      );
      setSelectedStudents(new Set());
      setBulkSemester("");
    }

    setUpdatingBulkSem(false);
  }

  // Helper: semester to year label
  function semLabel(sem: number) {
    const year = Math.ceil(sem / 2);
    const suffix =
      year === 1 ? "st" : year === 2 ? "nd" : year === 3 ? "rd" : "th";
    return `${year}${suffix} Year`;
  }

  return (
    <Tabs defaultValue="assignments" className="space-y-4">
      <TabsList className="bg-gray-100 border-gray-200/80">
        <TabsTrigger
          value="assignments"
          className="data-[state=active]:bg-white data-[state=active]:text-gray-800 data-[state=active]:shadow-sm text-gray-500"
        >
          <BookOpen className="h-4 w-4 mr-1.5" />
          Teacher Assignments
        </TabsTrigger>
        <TabsTrigger
          value="sections"
          className="data-[state=active]:bg-white data-[state=active]:text-gray-800 data-[state=active]:shadow-sm text-gray-500"
        >
          <Users className="h-4 w-4 mr-1.5" />
          Student Sections
        </TabsTrigger>
      </TabsList>

      {/* ═══════════════ TAB 1: TEACHER ASSIGNMENTS ═══════════════ */}
      <TabsContent value="assignments" className="space-y-4">
        {/* Semester Selector */}
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">
                  Select Year / Semester:
                </span>
                <Select
                  value={activeSemester}
                  onValueChange={(v) => {
                    setActiveSemester(v);
                    setSelectedSubject("");
                    setSelectedSection("");
                    setSelectedTeacher("");
                  }}
                >
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Choose semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((sem) => {
                      const info = semesterInfo.get(sem);
                      return (
                        <SelectItem key={sem} value={String(sem)}>
                          Semester {sem} &middot; {semLabel(sem)} &middot;
                          Batch {info?.batch}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {currentSemInfo && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>
                    Batch {currentSemInfo.batch}
                  </span>
                  <span>&middot;</span>
                  <span>
                    {semSections.length} Section
                    {semSections.length !== 1 ? "s" : ""}:{" "}
                    {semSections.join(", ")}
                  </span>
                  <span>&middot;</span>
                  <span>
                    {semSubjects.length} Subject
                    {semSubjects.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {!activeSemester ? (
          <Card className="border-gray-200/80 shadow-sm">
            <CardContent className="py-12 text-center text-gray-400">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">
                Select a semester above to manage teacher assignments
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Teacher Workload for this semester */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {teachers.map((t) => {
                const count = semTeacherWorkload.get(t.id) ?? 0;
                const name =
                  (t.profiles as any)?.full_name ?? "Unknown";
                return (
                  <div
                    key={t.id}
                    className={`p-3 rounded-lg border shadow-sm ${
                      count === 0
                        ? "border-amber-200 bg-amber-50"
                        : "border-gray-200/80 bg-white"
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t.designation}
                    </p>
                    <div className="mt-1.5">
                      <Badge
                        variant={count === 0 ? "outline" : "secondary"}
                        className={`text-xs ${
                          count === 0
                            ? "border-amber-300 text-amber-700"
                            : "bg-[#0f1b4c]/10 text-[#0f1b4c]"
                        }`}
                      >
                        {count} subject
                        {count !== 1 ? "s" : ""} (Sem{" "}
                        {activeSemester})
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Assignment Form */}
            <Card className="border-gray-200/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Assign Teacher
                </CardTitle>
                <CardDescription>
                  Assign a teacher to a Semester {activeSemester} subject
                  and section
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-4 gap-3">
                  <Select
                    value={selectedTeacher}
                    onValueChange={setSelectedTeacher}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {(t.profiles as any)?.full_name ??
                            "Unknown"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedSubject}
                    onValueChange={setSelectedSubject}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {semSubjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.code} – {s.name}
                        </SelectItem>
                      ))}
                      {semSubjects.length === 0 && (
                        <div className="px-2 py-3 text-xs text-gray-400 text-center">
                          No subjects for Semester{" "}
                          {activeSemester}
                        </div>
                      )}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedSection}
                    onValueChange={setSelectedSection}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Section" />
                    </SelectTrigger>
                    <SelectContent>
                      {semSections.map((s) => (
                        <SelectItem key={s} value={s}>
                          Section {s}
                        </SelectItem>
                      ))}
                      {semSections.length === 0 && (
                        <div className="px-2 py-3 text-xs text-gray-400 text-center">
                          No sections found
                        </div>
                      )}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={handleAssign}
                    disabled={
                      assigning ||
                      !selectedTeacher ||
                      !selectedSubject ||
                      !selectedSection
                    }
                  >
                    {assigning ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Assign
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Assignments Table */}
            <Card className="border-gray-200/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Semester {activeSemester} Assignments
                </CardTitle>
                <CardDescription>
                  {semAssignments.length} assignment
                  {semAssignments.length !== 1 ? "s" : ""} for{" "}
                  {semLabel(Number(activeSemester))} (Batch{" "}
                  {currentSemInfo?.batch})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {semAssignments.length === 0 ? (
                  <p className="text-sm text-gray-400 py-8 text-center">
                    No assignments for Semester {activeSemester}
                    yet. Use the form above to assign teachers.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-center">
                          Section
                        </TableHead>
                        <TableHead className="text-center">
                          Year
                        </TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {semAssignments.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">
                            {(a.teachers as any)?.profiles
                              ?.full_name ?? "Unknown"}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm text-gray-500">
                              {(a.subjects as any)?.code}
                            </span>
                            <span className="ml-2 text-sm">
                              {(a.subjects as any)?.name}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
                              {a.section}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm text-gray-400">
                            {a.academic_year}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() =>
                                handleRemoveAssignment(a.id)
                              }
                              disabled={removingId === a.id}
                            >
                              {removingId === a.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <X className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </TabsContent>

      {/* ═══════════════ TAB 2: STUDENT SECTIONS ═══════════════ */}
      <TabsContent value="sections" className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={studentFilterBatch}
            onValueChange={(v) => {
              setStudentFilterBatch(v);
              setSelectedStudents(new Set());
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {allBatches.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={studentFilterSemester}
            onValueChange={(v) => {
              setStudentFilterSemester(v);
              setSelectedStudents(new Set());
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              {allStudentSemesters.map((sem) => (
                <SelectItem key={sem} value={String(sem)}>
                  Semester {sem}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={studentFilterSection}
            onValueChange={(v) => {
              setStudentFilterSection(v);
              setSelectedStudents(new Set());
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {allSections.map((s) => (
                <SelectItem key={s} value={s}>
                  Section {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(studentFilterBatch !== "all" ||
            studentFilterSemester !== "all" ||
            studentFilterSection !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStudentFilterBatch("all");
                setStudentFilterSemester("all");
                setStudentFilterSection("all");
                setSelectedStudents(new Set());
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              Clear filters
            </Button>
          )}

          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm font-medium text-[#0f1b4c] bg-[#0f1b4c]/8 px-3 py-1 rounded-full">
              {filteredStudents.length} student
              {filteredStudents.length !== 1 ? "s" : ""}
            </span>
            <Button
              variant="outline"
              className="border-[#0f1b4c]/30 text-[#0f1b4c] bg-white hover:bg-[#0f1b4c]/5 shadow-sm"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Student
            </Button>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedStudents.size > 0 && (
          <Card className="border-[#0f1b4c]/20 bg-[#0f1b4c]/5 shadow-sm">
            <CardContent className="py-3 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-[#0f1b4c]">
                {selectedStudents.size} selected
              </span>

              <div className="h-5 w-px bg-gray-300" />

              {/* Move to Section */}
              <Select
                value={moveToSection}
                onValueChange={setMoveToSection}
              >
                <SelectTrigger className="w-36 bg-white">
                  <SelectValue placeholder="Move to section" />
                </SelectTrigger>
                <SelectContent>
                  {["A", "B", "C", "D", "E"].map((s) => (
                    <SelectItem key={s} value={s}>
                      Section {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleMoveStudents}
                disabled={!moveToSection || movingStudents}
              >
                {movingStudents && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                )}
                Move
              </Button>

              <div className="h-5 w-px bg-gray-300" />

              {/* Update Semester */}
              <Select
                value={bulkSemester}
                onValueChange={setBulkSemester}
              >
                <SelectTrigger className="w-36 bg-white">
                  <SelectValue placeholder="Set semester" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      Semester {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleBulkSemester}
                disabled={!bulkSemester || updatingBulkSem}
              >
                {updatingBulkSem && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                )}
                Update
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 ml-auto"
                onClick={() => {
                  setSelectedStudents(new Set());
                  setMoveToSection("");
                  setBulkSemester("");
                }}
              >
                Clear
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Students Table */}
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="pt-6">
            {filteredStudents.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">
                No students found for the selected filters.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          filteredStudents.length > 0 &&
                          selectedStudents.size ===
                            filteredStudents.length
                        }
                        onCheckedChange={toggleAllFiltered}
                      />
                    </TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-center">
                      Semester
                    </TableHead>
                    <TableHead className="text-center">
                      Batch
                    </TableHead>
                    <TableHead className="text-center">
                      Section
                    </TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.has(s.id)}
                          onCheckedChange={() =>
                            toggleStudent(s.id)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {s.roll_no}
                      </TableCell>
                      <TableCell className="font-medium">
                        {(s.profiles as any)?.full_name ?? "—"}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {s.semester}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {s.batch}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          {s.section ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditDialog(s)}
                            className="p-1.5 rounded-md text-gray-300 hover:text-[#0f1b4c] hover:bg-gray-100 transition-colors"
                            title="Edit student"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setRemoveTarget(s)}
                            className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Remove student"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ═══════════════ EDIT STUDENT DIALOG ═══════════════ */}
      <Dialog open={!!editStudent} onOpenChange={(open) => { if (!open) setEditStudent(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update details for {editStudent?.roll_no}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-usn">USN / Roll No</Label>
              <Input
                id="edit-usn"
                value={editUSN}
                onChange={(e) => setEditUSN(e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Batch</Label>
                <Select value={editBatch} onValueChange={setEditBatch}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - 2 + i)).map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Semester</Label>
                <Select value={editSemester} onValueChange={setEditSemester}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <SelectItem key={s} value={String(s)}>Sem {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={editSection} onValueChange={setEditSection}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["A", "B", "C", "D", "E"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStudent(null)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleEditStudent}
              disabled={editSubmitting}
              className="border-[#0f1b4c]/30 text-[#0f1b4c] bg-white hover:bg-[#0f1b4c]/5"
            >
              {editSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════ REMOVE STUDENT DIALOG ═══════════════ */}
      <AlertDialog open={!!removeTarget} onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-gray-700">
                {(removeTarget?.profiles as any)?.full_name}
              </span>{" "}
              <span className="font-mono text-sm">({removeTarget?.roll_no})</span>?
              This will permanently delete the student, their marks, attendance, and feedback.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveStudent}
              disabled={removeSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {removeSubmitting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══════════════ ADD STUDENT DIALOG ═══════════════ */}
      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) resetAddForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Create a new student account. Default password: student123
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="manage-add-name">Full Name *</Label>
              <Input
                id="manage-add-name"
                placeholder="e.g. ABHISHEK V"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manage-add-usn">USN / Roll No *</Label>
              <Input
                id="manage-add-usn"
                placeholder="e.g. 4PM24CS001"
                value={addUSN}
                onChange={(e) => setAddUSN(e.target.value.toUpperCase())}
                className="font-mono"
              />
              {addUSN && (
                <p className="text-xs text-gray-400">
                  Email: {addUSN.toLowerCase()}@college.edu
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Batch *</Label>
                <Select value={addBatch} onValueChange={setAddBatch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - 3 + i)).map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Section *</Label>
                <Select value={addSection} onValueChange={setAddSection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {["A", "B", "C", "D", "E"].map((s) => (
                      <SelectItem key={s} value={s}>Section {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Semester *</Label>
              <Select
                value={addSemester}
                onValueChange={setAddSemester}
                disabled={!addLateral}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="manage-lateral"
                checked={addLateral}
                onCheckedChange={(checked) => {
                  setAddLateral(checked === true);
                  if (checked !== true) setAddSemester("1");
                }}
              />
              <Label htmlFor="manage-lateral" className="text-sm font-normal cursor-pointer">
                Lateral Entry
              </Label>
            </div>
            {addLateral && (
              <p className="text-xs text-amber-600 -mt-2">
                Lateral entry students typically join at Semester 3
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleAddStudent}
              disabled={addSubmitting}
              className="border-[#0f1b4c]/30 text-[#0f1b4c] bg-white hover:bg-[#0f1b4c]/5"
            >
              {addSubmitting ? "Adding..." : "Add Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
