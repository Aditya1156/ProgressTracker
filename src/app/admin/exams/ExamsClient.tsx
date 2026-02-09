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
import { formatDate } from "@/lib/utils";
import { downloadCSV, formatExamDataForExport } from "@/lib/export";
import { toast } from "sonner";

interface ExamsClientProps {
  exams: any[];
}

const typeColors: Record<string, string> = {
  class_test: "bg-blue-50 text-blue-700 border-blue-200",
  mid_sem: "bg-purple-50 text-purple-700 border-purple-200",
  end_sem: "bg-red-50 text-red-700 border-red-200",
  assignment: "bg-green-50 text-green-700 border-green-200",
  practical: "bg-amber-50 text-amber-700 border-amber-200",
};

const typeLabels: Record<string, string> = {
  class_test: "Class Test",
  mid_sem: "Mid Sem",
  end_sem: "End Sem",
  assignment: "Assignment",
  practical: "Practical",
};

export default function ExamsClient({ exams }: ExamsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter exams based on search query
  const filteredExams = useMemo(() => {
    if (!searchQuery.trim()) return exams;

    const query = searchQuery.toLowerCase();
    return exams.filter((e) => {
      const subject = e.subjects as any;
      const dept = subject?.departments as any;

      return (
        e.name.toLowerCase().includes(query) ||
        subject?.name?.toLowerCase().includes(query) ||
        subject?.code?.toLowerCase().includes(query) ||
        dept?.name?.toLowerCase().includes(query) ||
        e.type.toLowerCase().includes(query) ||
        e.exam_date.includes(query) ||
        subject?.semester?.toString().includes(query)
      );
    });
  }, [exams, searchQuery]);

  const handleExport = () => {
    if (filteredExams.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = formatExamDataForExport(filteredExams);
    const timestamp = new Date().toISOString().split("T")[0];
    downloadCSV(exportData, `exams-${timestamp}.csv`);
    toast.success(`Exported ${filteredExams.length} exam(s)`);
  };

  return (
    <>
      {/* Search and Export */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by exam name, subject, department, type..."
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
          Found {filteredExams.length} exam(s) matching "{searchQuery}"
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exam Name</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Max Marks</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Entries</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "No exams found matching your search"
                      : "No exams scheduled yet"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredExams.map((exam) => {
                const subject = exam.subjects as any;
                const dept = subject?.departments as any;
                return (
                  <TableRow key={exam.id}>
                    <TableCell className="font-medium">{exam.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{subject?.name ?? "—"}</span>
                        <span className="text-xs text-muted-foreground">
                          {subject?.code ?? ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{dept?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${typeColors[exam.type] ?? ""}`}
                      >
                        {typeLabels[exam.type] ?? exam.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {exam.max_marks}
                    </TableCell>
                    <TableCell className="text-sm">
                      Sem {subject?.semester ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(exam.exam_date)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`text-sm font-medium ${
                          (exam.marksCount ?? 0) > 0
                            ? "text-emerald-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {exam.marksCount ?? 0}
                      </span>
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
