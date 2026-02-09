"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download } from "lucide-react";
import { classifyLearner, fmtPct } from "@/lib/utils";
import { downloadCSV, formatStudentDataForExport } from "@/lib/export";
import Link from "next/link";
import { toast } from "sonner";

interface StudentsClientProps {
  students: any[];
}

export default function StudentsClient({ students }: StudentsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;

    const query = searchQuery.toLowerCase();
    return students.filter((s) => {
      const profile = s.profiles as any;
      const dept = s.departments as any;

      return (
        s.roll_no.toLowerCase().includes(query) ||
        profile?.full_name?.toLowerCase().includes(query) ||
        profile?.email?.toLowerCase().includes(query) ||
        dept?.name?.toLowerCase().includes(query) ||
        dept?.full_name?.toLowerCase().includes(query) ||
        s.batch.toLowerCase().includes(query) ||
        s.semester.toString().includes(query)
      );
    });
  }, [students, searchQuery]);

  const handleExport = () => {
    if (filteredStudents.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = formatStudentDataForExport(filteredStudents);
    const timestamp = new Date().toISOString().split("T")[0];
    downloadCSV(exportData, `students-${timestamp}.csv`);
    toast.success(`Exported ${filteredStudents.length} student(s)`);
  };

  // Calculate stats
  const stats = useMemo(() => {
    const withResults = filteredStudents.filter((s) => s.examCount > 0).length;
    const excellent = filteredStudents.filter((s) => s.avg >= 75).length;
    const atRisk = filteredStudents.filter((s) => s.avg >= 0 && s.avg < 40).length;

    return {
      total: filteredStudents.length,
      withResults,
      excellent,
      atRisk,
    };
  }, [filteredStudents]);

  return (
    <>
      {/* Search and Export */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, roll no, email, department..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Search results info */}
      {searchQuery && (
        <div className="text-sm text-muted-foreground">
          Found {filteredStudents.length} student(s) matching "{searchQuery}"
        </div>
      )}

      {/* Stats Cards - Updated with filtered data */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div className="p-3 bg-slate-50 rounded-lg border">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Showing
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.total}</div>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs text-blue-700 uppercase tracking-wider mb-1">
            With Results
          </div>
          <div className="text-2xl font-semibold text-blue-900">
            {stats.withResults}
          </div>
        </div>
        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="text-xs text-emerald-700 uppercase tracking-wider mb-1">
            Excellent
          </div>
          <div className="text-2xl font-semibold text-emerald-900">
            {stats.excellent}
          </div>
        </div>
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="text-xs text-red-700 uppercase tracking-wider mb-1">
            At Risk
          </div>
          <div className="text-2xl font-semibold text-red-900">{stats.atRisk}</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Roll No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-center">Semester</TableHead>
              <TableHead className="text-center">Batch</TableHead>
              <TableHead className="text-right">Exams</TableHead>
              <TableHead className="text-right">Average</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "No students found matching your search"
                      : "No students found"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((s) => {
                const profile = s.profiles as any;
                const dept = s.departments as any;
                const cat = s.avg >= 0 ? classifyLearner(s.avg) : null;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      {s.roll_no}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/students/${s.id}`}
                        className="hover:underline"
                      >
                        {profile?.full_name ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {profile?.email ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">{dept?.name ?? "—"}</TableCell>
                    <TableCell className="text-center text-sm">
                      {s.semester}
                    </TableCell>
                    <TableCell className="text-center text-sm">{s.batch}</TableCell>
                    <TableCell className="text-right text-sm">
                      {s.examCount}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${cat?.color ?? ""}`}
                    >
                      {s.avg >= 0 ? fmtPct(s.avg) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {cat ? (
                        <Badge
                          variant="secondary"
                          className={`text-xs border-0 ${cat.bgColor} ${cat.color}`}
                        >
                          {cat.label}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No data
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
