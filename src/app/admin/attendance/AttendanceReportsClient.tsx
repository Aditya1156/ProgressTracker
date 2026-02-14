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
import { Download, Search } from "lucide-react";
import { fmtPct } from "@/lib/utils";
import { downloadCSV, formatAttendanceSummaryForExport } from "@/lib/export";
import { classifyAttendance, ATTENDANCE_THRESHOLD } from "@/lib/attendance";
import { toast } from "sonner";

interface StudentSummary {
  studentId: string;
  rollNo: string;
  name: string;
  department: string;
  departmentId: string;
  semester: number;
  subject: string;
  subjectCode: string;
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}

interface Department {
  id: string;
  name: string;
}

interface AttendanceReportsClientProps {
  summaries: StudentSummary[];
  departments: Department[];
}

export function AttendanceReportsClient({
  summaries,
  departments,
}: AttendanceReportsClientProps) {
  const [filterDept, setFilterDept] = useState("all");
  const [filterThreshold, setFilterThreshold] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return summaries.filter((s) => {
      if (filterDept !== "all" && s.departmentId !== filterDept) return false;
      if (filterThreshold === "below" && s.percentage >= ATTENDANCE_THRESHOLD)
        return false;
      if (filterThreshold === "above" && s.percentage < ATTENDANCE_THRESHOLD)
        return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !s.rollNo.toLowerCase().includes(q) &&
          !s.name.toLowerCase().includes(q) &&
          !s.subjectCode.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [summaries, filterDept, filterThreshold, searchQuery]);

  function handleExport() {
    if (filtered.length === 0) {
      toast.error("No data to export");
      return;
    }
    const exportData = formatAttendanceSummaryForExport(filtered);
    const timestamp = new Date().toISOString().split("T")[0];
    downloadCSV(exportData, `attendance-report-${timestamp}.csv`);
    toast.success(`Exported ${filtered.length} record(s)`);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="border-gray-200/80 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={filterDept} onValueChange={setFilterDept}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Threshold</Label>
              <Select
                value={filterThreshold}
                onValueChange={setFilterThreshold}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="below">
                    Below {ATTENDANCE_THRESHOLD}%
                  </SelectItem>
                  <SelectItem value="above">
                    Above {ATTENDANCE_THRESHOLD}%
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Roll no, name, subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-gray-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Student Attendance Report</CardTitle>
          <CardDescription>
            {filtered.length} record(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              No attendance records found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Absent</TableHead>
                    <TableHead className="text-center">Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 100).map((s, i) => {
                    const cat = classifyAttendance(s.percentage);
                    return (
                      <TableRow key={`${s.studentId}-${s.subjectCode}-${i}`}>
                        <TableCell className="font-mono text-sm">
                          {s.rollNo}
                        </TableCell>
                        <TableCell className="text-sm">{s.name}</TableCell>
                        <TableCell className="text-sm text-gray-400">
                          {s.department}
                        </TableCell>
                        <TableCell className="text-sm">
                          {s.subjectCode}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {s.totalClasses}
                        </TableCell>
                        <TableCell className="text-center text-sm text-emerald-600">
                          {s.present + s.late}
                        </TableCell>
                        <TableCell className="text-center text-sm text-red-600">
                          {s.absent}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className={`text-xs border-0 ${cat.bgColor} ${cat.color}`}
                          >
                            {fmtPct(s.percentage)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {filtered.length > 100 && (
                <p className="text-xs text-gray-400 text-center py-3">
                  Showing first 100 of {filtered.length} records. Export to see
                  all.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
