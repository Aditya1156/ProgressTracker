"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { classifyLearner, fmtPct } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  roll_no: string;
  semester: number;
  batch: string;
  section?: string;
  avg: number;
  examCount: number;
  profiles: any;
}

export default function TeacherStudentsClient({
  students,
}: {
  students: Student[];
}) {
  const router = useRouter();
  const [filterSemester, setFilterSemester] = useState("all");
  const [filterBatch, setFilterBatch] = useState("all");
  const [filterSection, setFilterSection] = useState("all");

  const semesters = useMemo(
    () => [...new Set(students.map((s) => s.semester))].sort((a, b) => a - b),
    [students]
  );
  const batches = useMemo(
    () => [...new Set(students.map((s) => s.batch))].sort().reverse(),
    [students]
  );
  const sections = useMemo(
    () =>
      [...new Set(students.map((s) => s.section).filter(Boolean))].sort() as string[],
    [students]
  );

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (filterSemester !== "all" && s.semester !== Number(filterSemester))
        return false;
      if (filterBatch !== "all" && s.batch !== filterBatch) return false;
      if (filterSection !== "all" && s.section !== filterSection) return false;
      return true;
    });
  }, [students, filterSemester, filterBatch, filterSection]);

  const hasActiveFilters =
    filterSemester !== "all" || filterBatch !== "all" || filterSection !== "all";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterSemester} onValueChange={setFilterSemester}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            {semesters.map((sem) => (
              <SelectItem key={sem} value={String(sem)}>
                Semester {sem}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterBatch} onValueChange={setFilterBatch}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Batch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batches.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterSection} onValueChange={setFilterSection}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {sections.map((s) => (
              <SelectItem key={s} value={s}>
                Section {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterSemester("all");
              setFilterBatch("all");
              setFilterSection("all");
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            Clear filters
          </Button>
        )}

        <span className="ml-auto text-sm text-gray-400">
          {filtered.length} student{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <Card className="border-gray-200/80 shadow-sm">
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              No students found for the selected filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Sem</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead className="text-right">Exams</TableHead>
                  <TableHead className="text-right">Average</TableHead>
                  <TableHead className="text-right">Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => {
                  const profile = s.profiles as any;
                  const cat =
                    s.avg >= 0 ? classifyLearner(s.avg) : null;
                  return (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/teacher/students/${s.id}`)}
                    >
                      <TableCell className="font-mono text-sm">
                        {s.roll_no}
                      </TableCell>
                      <TableCell className="font-medium">
                        {profile?.full_name ?? "—"}
                      </TableCell>
                      <TableCell>{s.semester}</TableCell>
                      <TableCell>{s.section ?? "—"}</TableCell>
                      <TableCell className="text-right">
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
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
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
