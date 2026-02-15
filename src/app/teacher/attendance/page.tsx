"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Users, History } from "lucide-react";
import Link from "next/link";
import type { AttendanceStatus } from "@/lib/attendance";
import {
  getStatusConfig,
  VALID_ATTENDANCE_STATUSES,
  getStatusCounts,
} from "@/lib/attendance";

interface Subject {
  id: string;
  name: string;
  code: string;
  semester: number;
}

interface Student {
  id: string;
  roll_no: string;
  semester: number;
  profiles: { full_name: string } | null;
}

export default function TeacherAttendancePage() {
  const supabase = createClient();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, AttendanceStatus>
  >({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [existingRecords, setExistingRecords] = useState(false);
  const [teacherDeptId, setTeacherDeptId] = useState<string | null>(null);
  const [assignedSections, setAssignedSections] = useState<Record<string, string[]>>({});

  // Load subjects on mount
  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: teacher } = await supabase
        .from("teachers")
        .select("id, department_id")
        .eq("profile_id", user.id)
        .single();

      if (!teacher) return;
      setTeacherDeptId(teacher.department_id);

      // Check for explicit subject assignments
      const { data: assignments } = await supabase
        .from("teacher_subject_assignments")
        .select("subject_id, section")
        .eq("teacher_id", teacher.id);

      let subs: Array<{ id: string; name: string; code: string; semester: number }> = [];
      if (assignments && assignments.length > 0) {
        const subjectIds = [...new Set(assignments.map((a) => a.subject_id))];
        const { data } = await supabase
          .from("subjects")
          .select("id, name, code, semester")
          .in("id", subjectIds)
          .order("semester")
          .order("code");
        subs = (data ?? []) as typeof subs;

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

  // Load students when subject changes
  const loadStudents = useCallback(
    async (subjectId: string) => {
      const subject = subjects.find((s) => s.id === subjectId);
      if (!subject || !teacherDeptId) return;

      setLoadingStudents(true);

      let query = supabase
        .from("students")
        .select("id, roll_no, semester, profiles(full_name)")
        .eq("department_id", teacherDeptId)
        .eq("semester", subject.semester);

      // Filter by assigned sections if teacher has assignments
      const sections = assignedSections[subjectId];
      if (sections && sections.length > 0) {
        query = query.in("section", sections);
      }

      const { data } = await query.order("roll_no");
      setStudents((data as any) ?? []);
      setLoadingStudents(false);
    },
    [subjects, teacherDeptId, assignedSections]
  );

  // Load existing attendance when subject + date change
  const loadExistingAttendance = useCallback(
    async (subjectId: string, date: string) => {
      const { data } = await supabase
        .from("attendance")
        .select("student_id, status")
        .eq("subject_id", subjectId)
        .eq("date", date);

      const map: Record<string, AttendanceStatus> = {};
      let hasRecords = false;
      for (const r of data ?? []) {
        map[r.student_id] = r.status as AttendanceStatus;
        hasRecords = true;
      }
      setAttendanceMap(map);
      setExistingRecords(hasRecords);
    },
    []
  );

  useEffect(() => {
    if (selectedSubject) {
      loadStudents(selectedSubject);
      setAttendanceMap({});
      setExistingRecords(false);
    }
  }, [selectedSubject, loadStudents]);

  useEffect(() => {
    if (selectedSubject && selectedDate) {
      loadExistingAttendance(selectedSubject, selectedDate);
    }
  }, [selectedSubject, selectedDate, loadExistingAttendance]);

  // Status counts
  const statusCounts = useMemo(() => {
    const records = Object.values(attendanceMap).map((status) => ({ status }));
    return getStatusCounts(records);
  }, [attendanceMap]);

  const markedCount = Object.keys(attendanceMap).length;

  function handleStatusChange(studentId: string, status: AttendanceStatus) {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  }

  function handleBulkMark(status: AttendanceStatus) {
    const map: Record<string, AttendanceStatus> = {};
    for (const s of students) {
      map[s.id] = status;
    }
    setAttendanceMap(map);
  }

  async function handleSave() {
    if (!selectedSubject || !selectedDate) return;

    if (markedCount === 0) {
      toast.error("No attendance marked yet");
      return;
    }

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const entries = Object.entries(attendanceMap).map(([studentId, status]) => ({
      student_id: studentId,
      subject_id: selectedSubject,
      date: selectedDate,
      status,
      marked_by: user?.id,
    }));

    const { error } = await supabase
      .from("attendance")
      .upsert(entries, { onConflict: "student_id,subject_id,date" });

    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success(
        `${existingRecords ? "Updated" : "Saved"} attendance for ${entries.length} student${entries.length > 1 ? "s" : ""}`
      );
      setExistingRecords(true);
    }

    setSaving(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">
            Take Attendance
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Select a subject and date, then mark student attendance
          </p>
        </div>
        <Link href="/teacher/attendance/history">
          <Button variant="outline" size="sm">
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="border-gray-200/80 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
              >
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
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance entry */}
      {selectedSubject && selectedDate && (
        <>
          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Card className="border-gray-200/80 shadow-sm">
              <CardContent className="py-3 px-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Total
                </p>
                <p className="text-lg font-semibold">{students.length}</p>
              </CardContent>
            </Card>
            <Card className="border-gray-200/80 shadow-sm">
              <CardContent className="py-3 px-4">
                <p className="text-xs text-emerald-600 uppercase tracking-wider">
                  Present
                </p>
                <p className="text-lg font-semibold text-emerald-600">
                  {statusCounts.present}
                </p>
              </CardContent>
            </Card>
            <Card className="border-gray-200/80 shadow-sm">
              <CardContent className="py-3 px-4">
                <p className="text-xs text-red-600 uppercase tracking-wider">
                  Absent
                </p>
                <p className="text-lg font-semibold text-red-600">
                  {statusCounts.absent}
                </p>
              </CardContent>
            </Card>
            <Card className="border-gray-200/80 shadow-sm">
              <CardContent className="py-3 px-4">
                <p className="text-xs text-amber-600 uppercase tracking-wider">
                  Late
                </p>
                <p className="text-lg font-semibold text-amber-600">
                  {statusCounts.late}
                </p>
              </CardContent>
            </Card>
            <Card className="border-gray-200/80 shadow-sm">
              <CardContent className="py-3 px-4">
                <p className="text-xs text-blue-600 uppercase tracking-wider">
                  Excused
                </p>
                <p className="text-lg font-semibold text-blue-600">
                  {statusCounts.excused}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-base">
                    {existingRecords ? "Edit Attendance" : "Mark Attendance"}
                  </CardTitle>
                  <CardDescription>
                    {markedCount}/{students.length} marked &middot;{" "}
                    {existingRecords && (
                      <span className="text-amber-600">Editing existing records</span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkMark("present")}
                    className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    All Present
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkMark("absent")}
                    className="text-red-700 border-red-200 hover:bg-red-50"
                  >
                    All Absent
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving || markedCount === 0}
                                     >
                    {saving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Attendance
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingStudents ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    No students found for this semester.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead className="w-28">Roll No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s, idx) => {
                      const currentStatus = attendanceMap[s.id];
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="text-gray-400 text-xs">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {s.roll_no}
                          </TableCell>
                          <TableCell>
                            {(s.profiles as { full_name: string } | null)
                              ?.full_name ?? "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              {VALID_ATTENDANCE_STATUSES.map((status) => {
                                const config = getStatusConfig(status);
                                const isActive = currentStatus === status;
                                return (
                                  <button
                                    key={status}
                                    onClick={() =>
                                      handleStatusChange(s.id, status)
                                    }
                                    className={`
                                      px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                                      ${
                                        isActive
                                          ? `${config.bgColor} ${config.color} ring-1 ring-current/20 shadow-sm`
                                          : "text-gray-400 hover:bg-gray-50"
                                      }
                                    `}
                                  >
                                    {config.shortLabel}
                                  </button>
                                );
                              })}
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
        </>
      )}
    </div>
  );
}
