"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { downloadCSV, formatExamDataForExport } from "@/lib/export";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { toast } from "sonner";

interface Exam {
  id: string;
  name: string;
  type: string;
  max_marks: number;
  exam_date: string;
  marksCount?: number;
  subjects: any;
}

interface ExamsClientProps {
  exams: Exam[];
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
  // Define table columns
  const columns: ColumnDef<Exam>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column}>Exam Name</SortableHeader>,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "subject",
        header: ({ column }) => <SortableHeader column={column}>Subject</SortableHeader>,
        accessorFn: (row) => (row.subjects as any)?.name ?? "—",
        cell: ({ row }) => {
          const subject = row.original.subjects as any;
          return (
            <div className="flex flex-col">
              <span className="text-sm">{subject?.name ?? "—"}</span>
              <span className="text-xs text-muted-foreground">
                {subject?.code ?? ""}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "department",
        header: ({ column }) => <SortableHeader column={column}>Department</SortableHeader>,
        accessorFn: (row) => (row.subjects as any)?.departments?.name ?? "—",
        cell: ({ row }) => {
          const dept = (row.original.subjects as any)?.departments as any;
          return <span className="text-sm">{dept?.name ?? "—"}</span>;
        },
      },
      {
        accessorKey: "type",
        header: ({ column }) => <SortableHeader column={column}>Type</SortableHeader>,
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={`text-xs badge-transition ${typeColors[row.original.type] ?? ""}`}
          >
            {typeLabels[row.original.type] ?? row.original.type}
          </Badge>
        ),
      },
      {
        accessorKey: "max_marks",
        header: ({ column }) => <SortableHeader column={column}>Max Marks</SortableHeader>,
        cell: ({ row }) => (
          <span className="text-right block font-medium">
            {row.original.max_marks}
          </span>
        ),
      },
      {
        accessorKey: "semester",
        header: ({ column }) => <SortableHeader column={column}>Semester</SortableHeader>,
        accessorFn: (row) => (row.subjects as any)?.semester ?? 0,
        cell: ({ row }) => {
          const subject = row.original.subjects as any;
          return (
            <span className="text-sm">
              Sem {subject?.semester ?? "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "exam_date",
        header: ({ column }) => <SortableHeader column={column}>Date</SortableHeader>,
        cell: ({ row }) => (
          <span className="text-sm">
            {formatDate(row.original.exam_date)}
          </span>
        ),
      },
      {
        accessorKey: "marksCount",
        header: ({ column }) => <SortableHeader column={column}>Entries</SortableHeader>,
        cell: ({ row }) => (
          <span
            className={`text-right block text-sm font-medium ${
              (row.original.marksCount ?? 0) > 0
                ? "text-emerald-600"
                : "text-muted-foreground"
            }`}
          >
            {row.original.marksCount ?? 0}
          </span>
        ),
      },
    ],
    []
  );

  const handleExport = () => {
    if (exams.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = formatExamDataForExport(exams);
    const timestamp = new Date().toISOString().split("T")[0];
    downloadCSV(exportData, `exams-${timestamp}.csv`);
    toast.success(`Exported ${exams.length} exam(s)`);
  };

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={handleExport} variant="outline" size="sm" className="btn-ripple">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={exams}
        searchPlaceholder="Search by exam name, subject, department, type..."
      />
    </div>
  );
}
