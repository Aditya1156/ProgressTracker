"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { classifyLearner, fmtPct } from "@/lib/utils";
import { downloadCSV, formatStudentDataForExport } from "@/lib/export";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Student {
  id: string;
  roll_no: string;
  semester: number;
  batch: string;
  avg: number;
  examCount: number;
  profiles: any;
  departments: any;
}

interface StudentsClientProps {
  students: Student[];
}

export default function StudentsClient({ students }: StudentsClientProps) {
  const router = useRouter();

  // Define table columns
  const columns: ColumnDef<Student>[] = useMemo(
    () => [
      {
        accessorKey: "roll_no",
        header: ({ column }) => <SortableHeader column={column}>Roll No</SortableHeader>,
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium">{row.original.roll_no}</span>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
        accessorFn: (row) => (row.profiles as any)?.full_name ?? "—",
        cell: ({ row }) => (
          <span className="font-medium">
            {(row.original.profiles as any)?.full_name ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        accessorFn: (row) => (row.profiles as any)?.email ?? "—",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {(row.original.profiles as any)?.email ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "department",
        header: ({ column }) => <SortableHeader column={column}>Department</SortableHeader>,
        accessorFn: (row) => (row.departments as any)?.name ?? "—",
        cell: ({ row }) => (
          <span className="text-sm">{(row.original.departments as any)?.name ?? "—"}</span>
        ),
      },
      {
        accessorKey: "semester",
        header: ({ column }) => <SortableHeader column={column}>Semester</SortableHeader>,
        cell: ({ row }) => (
          <span className="text-center block text-sm">{row.original.semester}</span>
        ),
      },
      {
        accessorKey: "batch",
        header: ({ column }) => <SortableHeader column={column}>Batch</SortableHeader>,
        cell: ({ row }) => (
          <span className="text-center block text-sm">{row.original.batch}</span>
        ),
      },
      {
        accessorKey: "examCount",
        header: ({ column }) => <SortableHeader column={column}>Exams</SortableHeader>,
        cell: ({ row }) => (
          <span className="text-right block text-sm">{row.original.examCount}</span>
        ),
      },
      {
        accessorKey: "avg",
        header: ({ column }) => <SortableHeader column={column}>Average</SortableHeader>,
        cell: ({ row }) => {
          const cat = row.original.avg >= 0 ? classifyLearner(row.original.avg) : null;
          return (
            <span className={`text-right block font-medium ${cat?.color ?? ""}`}>
              {row.original.avg >= 0 ? fmtPct(row.original.avg) : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const cat = row.original.avg >= 0 ? classifyLearner(row.original.avg) : null;
          return (
            <div className="text-right">
              {cat ? (
                <Badge
                  variant="secondary"
                  className={`text-xs border-0 badge-transition ${cat.bgColor} ${cat.color}`}
                >
                  {cat.label}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">No data</span>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  const handleExport = () => {
    if (students.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = formatStudentDataForExport(students);
    const timestamp = new Date().toISOString().split("T")[0];
    downloadCSV(exportData, `students-${timestamp}.csv`);
    toast.success(`Exported ${students.length} student(s)`);
  };

  // Calculate stats
  const stats = useMemo(() => {
    const withResults = students.filter((s) => s.examCount > 0).length;
    const excellent = students.filter((s) => s.avg >= 75).length;
    const atRisk = students.filter((s) => s.avg >= 0 && s.avg < 40).length;

    return {
      total: students.length,
      withResults,
      excellent,
      atRisk,
    };
  }, [students]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div className="p-3 bg-slate-50 rounded-lg border hover-lift transition-all">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Total
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.total}</div>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 hover-lift transition-all">
          <div className="text-xs text-blue-700 uppercase tracking-wider mb-1">
            With Results
          </div>
          <div className="text-2xl font-semibold text-blue-900">
            {stats.withResults}
          </div>
        </div>
        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 hover-lift transition-all">
          <div className="text-xs text-emerald-700 uppercase tracking-wider mb-1">
            Excellent
          </div>
          <div className="text-2xl font-semibold text-emerald-900">
            {stats.excellent}
          </div>
        </div>
        <div className="p-3 bg-red-50 rounded-lg border border-red-200 hover-lift transition-all">
          <div className="text-xs text-red-700 uppercase tracking-wider mb-1">
            At Risk
          </div>
          <div className="text-2xl font-semibold text-red-900">{stats.atRisk}</div>
        </div>
      </div>

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
        data={students}
        searchPlaceholder="Search by name, roll no, email, department..."
        onRowClick={(row) => router.push(`/admin/students/${row.id}`)}
      />
    </div>
  );
}
