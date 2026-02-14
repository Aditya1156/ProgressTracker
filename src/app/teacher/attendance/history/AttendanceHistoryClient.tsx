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
import { ArrowLeft, Download, Search } from "lucide-react";
import Link from "next/link";
import { formatDate, fmtPct } from "@/lib/utils";
import { downloadCSV, formatAttendanceDataForExport } from "@/lib/export";
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

  const stats = useMemo(() => {
    const totalSessions = filteredSessions.length;
    const totalRecords = filteredSessions.reduce((a, s) => a + s.total, 0);
    const totalPresent = filteredSessions.reduce((a, s) => a + s.present + s.late, 0);
    const avgRate = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;
    return { totalSessions, totalRecords, avgRate };
  }, [filteredSessions]);

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
          <div className="grid sm:grid-cols-4 gap-4">
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
      <div className="grid sm:grid-cols-3 gap-4">
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
      </div>

      {/* Sessions table */}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
