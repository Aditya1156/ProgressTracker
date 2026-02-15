"use client";

import { useMemo, useState } from "react";
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
import { ArrowLeft, Download, Search, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { formatDate, fmtPct } from "@/lib/utils";
import { downloadCSV, formatAttendanceDataForExport } from "@/lib/export";
import { calculateAttendancePercentage, classifyAttendance } from "@/lib/attendance";
import { toast } from "sonner";

interface Session {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  date: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  semester: number;
}

interface AttendanceHistoryClientProps {
  sessions: Session[];
  subjects: Subject[];
  records: any[];
}

export function AttendanceHistoryClient({
  sessions,
  subjects,
  records,
}: AttendanceHistoryClientProps) {
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (filterSubject !== "all" && s.subjectId !== filterSubject) return false;
      if (filterDateFrom && s.date < filterDateFrom) return false;
      if (filterDateTo && s.date > filterDateTo) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !s.subjectCode.toLowerCase().includes(q) &&
          !s.subjectName.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [sessions, filterSubject, filterDateFrom, filterDateTo, searchQuery]);

  const [showLowOnly, setShowLowOnly] = useState(false);

  const stats = useMemo(() => {
    const totalSessions = filteredSessions.length;
    const totalRecords = filteredSessions.reduce((a, s) => a + s.total, 0);
    const totalPresent = filteredSessions.reduce((a, s) => a + s.present + s.late, 0);
    const avgRate = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;
    return { totalSessions, totalRecords, avgRate };
  }, [filteredSessions]);

  // Student-level attendance aggregation
  const studentAttendance = useMemo(() => {
    // Filter records matching current filters
    let filtered = records;
    if (filterSubject !== "all") {
      filtered = filtered.filter((r: any) => r.subject_id === filterSubject);
    }
    if (filterDateFrom) {
      filtered = filtered.filter((r: any) => r.date >= filterDateFrom);
    }
    if (filterDateTo) {
      filtered = filtered.filter((r: any) => r.date <= filterDateTo);
    }

    // Group by student+subject
    type StudentEntry = {
      studentId: string;
      rollNo: string;
      name: string;
      subjectCode: string;
      subjectName: string;
      records: Array<{ status: string }>;
    };
    const map = new Map<string, StudentEntry>();

    for (const r of filtered) {
      const student = (r as any).students;
      const subject = (r as any).subjects;
      if (!student || !subject) continue;

      const key = `${student.id}_${r.subject_id}`;
      const existing: StudentEntry = map.get(key) ?? {
        studentId: student.id,
        rollNo: student.roll_no,
        name: student.profiles?.full_name ?? "—",
        subjectCode: subject.code,
        subjectName: subject.name,
        records: [] as Array<{ status: string }>,
      };
      existing.records.push({ status: r.status });
      map.set(key, existing);
    }

    return Array.from(map.values()).map((entry) => {
      const rate = calculateAttendancePercentage(entry.records);
      const attended = entry.records.filter((r) => r.status === "present" || r.status === "late").length;
      return {
        ...entry,
        total: entry.records.length,
        attended,
        rate,
        category: classifyAttendance(rate),
      };
    }).sort((a, b) => a.rate - b.rate);
  }, [records, filterSubject, filterDateFrom, filterDateTo]);

  const lowAttendanceCount = studentAttendance.filter((s) => s.rate < 75).length;
  const displayStudents = showLowOnly ? studentAttendance.filter((s) => s.rate < 75) : studentAttendance;

  function handleExport() {
    let filtered = records;
    if (filterSubject !== "all") {
      filtered = filtered.filter((r: any) => r.subject_id === filterSubject);
    }
    if (filterDateFrom) {
      filtered = filtered.filter((r: any) => r.date >= filterDateFrom);
    }
    if (filterDateTo) {
      filtered = filtered.filter((r: any) => r.date <= filterDateTo);
    }

    if (filtered.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = formatAttendanceDataForExport(filtered);
    const timestamp = new Date().toISOString().split("T")[0];
    downloadCSV(exportData, `attendance-history-${timestamp}.csv`);
    toast.success(`Exported ${filtered.length} record(s)`);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/teacher/attendance">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              Attendance History
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              View and export past attendance records
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-gray-200/80 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.code} – {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="py-3 px-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Sessions
            </p>
            <p className="text-lg font-semibold">{stats.totalSessions}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="py-3 px-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Total Records
            </p>
            <p className="text-lg font-semibold">{stats.totalRecords}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="py-3 px-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Avg Attendance Rate
            </p>
            <p
              className={`text-lg font-semibold ${stats.avgRate >= 75 ? "text-emerald-600" : stats.avgRate >= 60 ? "text-amber-600" : "text-red-600"}`}
            >
              {fmtPct(stats.avgRate)}
            </p>
          </CardContent>
        </Card>
        <Card className={`shadow-sm ${lowAttendanceCount > 0 ? "border-red-200 bg-red-50/30" : "border-gray-200/80"}`}>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Below 75%
            </p>
            <p className={`text-lg font-semibold ${lowAttendanceCount > 0 ? "text-red-600" : "text-gray-800"}`}>
              {lowAttendanceCount} student{lowAttendanceCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed view: Sessions / Students */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">Sessions ({filteredSessions.length})</TabsTrigger>
          <TabsTrigger value="students">
            Students ({studentAttendance.length})
            {lowAttendanceCount > 0 && (
              <span className="ml-1.5 h-4 w-4 inline-flex items-center justify-center rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                {lowAttendanceCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Sessions</CardTitle>
              <CardDescription>
                {filteredSessions.length} session(s) found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSessions.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">
                  No attendance records found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Present</TableHead>
                      <TableHead className="text-center">Absent</TableHead>
                      <TableHead className="text-center">Late</TableHead>
                      <TableHead className="text-center">Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.map((s) => {
                      const rate =
                        s.total > 0
                          ? ((s.present + s.late) / s.total) * 100
                          : 0;
                      return (
                        <TableRow key={`${s.subjectId}_${s.date}`}>
                          <TableCell className="text-sm">
                            {formatDate(s.date)}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-sm">
                              {s.subjectCode}
                            </span>
                            <span className="text-gray-400 text-xs ml-1.5">
                              {s.subjectName}
                            </span>
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {s.total}
                          </TableCell>
                          <TableCell className="text-center text-sm text-emerald-600">
                            {s.present}
                          </TableCell>
                          <TableCell className="text-center text-sm text-red-600">
                            {s.absent}
                          </TableCell>
                          <TableCell className="text-center text-sm text-amber-600">
                            {s.late}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="secondary"
                              className={`text-xs border-0 ${
                                rate >= 75
                                  ? "bg-emerald-50 text-emerald-700"
                                  : rate >= 60
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-red-50 text-red-700"
                              }`}
                            >
                              {fmtPct(rate)}
                            </Badge>
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
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Student Attendance</CardTitle>
                  <CardDescription>
                    Per-student attendance breakdown across subjects
                  </CardDescription>
                </div>
                {lowAttendanceCount > 0 && (
                  <Button
                    variant={showLowOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowLowOnly(!showLowOnly)}
                    className={showLowOnly ? "bg-red-600 hover:bg-red-700" : "border-red-200 text-red-600 hover:bg-red-50"}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                    {showLowOnly ? "Show All" : `${lowAttendanceCount} Below 75%`}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {displayStudents.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">
                  {showLowOnly ? "No students below 75% threshold." : "No attendance data available."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-center">Attended</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Percentage</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayStudents.map((s) => (
                      <TableRow key={`${s.studentId}_${s.subjectCode}`} className={s.rate < 75 ? "bg-red-50/30" : ""}>
                        <TableCell className="font-mono text-sm">{s.rollNo}</TableCell>
                        <TableCell className="text-sm">{s.name}</TableCell>
                        <TableCell>
                          <span className="font-medium text-sm">{s.subjectCode}</span>
                        </TableCell>
                        <TableCell className="text-center text-sm">{s.attended}</TableCell>
                        <TableCell className="text-center text-sm">{s.total}</TableCell>
                        <TableCell className="text-center">
                          <span className={`text-sm font-medium ${s.rate >= 75 ? "text-emerald-600" : s.rate >= 60 ? "text-amber-600" : "text-red-600"}`}>
                            {fmtPct(s.rate)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className={`text-xs border-0 ${s.category.bgColor} ${s.category.color}`}
                          >
                            {s.category.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
