"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatDate, fmtPct } from "@/lib/utils";
import { DataTable, SortableHeader } from "@/components/ui/data-table";

interface Result {
  marks_obtained: number;
  created_at: string;
  exams: any;
}

interface ResultsClientProps {
  marks: Result[];
}

export default function ResultsClient({ marks }: ResultsClientProps) {
  // Define table columns
  const columns: ColumnDef<Result>[] = useMemo(
    () => [
      {
        accessorKey: "subject",
        header: ({ column }) => <SortableHeader column={column}>Subject</SortableHeader>,
        accessorFn: (row) => (row.exams as any)?.subjects?.code ?? "—",
        cell: ({ row }) => (
          <span className="font-medium">
            {(row.original.exams as any)?.subjects?.code ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "exam",
        header: ({ column }) => <SortableHeader column={column}>Exam</SortableHeader>,
        accessorFn: (row) => (row.exams as any)?.name ?? "—",
        cell: ({ row }) => (
          <span className="text-sm">{(row.original.exams as any)?.name ?? "—"}</span>
        ),
      },
      {
        accessorKey: "type",
        header: ({ column }) => <SortableHeader column={column}>Type</SortableHeader>,
        accessorFn: (row) => {
          const exam = row.exams as any;
          return exam?.type?.replace("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? "—";
        },
        cell: ({ row }) => {
          const exam = row.original.exams as any;
          const typeLabel =
            exam?.type?.replace("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? "—";
          return (
            <Badge variant="outline" className="text-xs font-normal badge-transition">
              {typeLabel}
            </Badge>
          );
        },
      },
      {
        accessorKey: "score",
        header: ({ column }) => <SortableHeader column={column}>Score</SortableHeader>,
        accessorFn: (row) => row.marks_obtained,
        cell: ({ row }) => {
          const exam = row.original.exams as any;
          return (
            <span className="text-right block font-mono text-sm">
              {row.original.marks_obtained}/{exam?.max_marks ?? 0}
            </span>
          );
        },
      },
      {
        accessorKey: "percentage",
        header: ({ column }) => <SortableHeader column={column}>Percentage</SortableHeader>,
        accessorFn: (row) => {
          const exam = row.exams as any;
          return exam ? (row.marks_obtained / exam.max_marks) * 100 : 0;
        },
        cell: ({ row }) => {
          const exam = row.original.exams as any;
          const pct = exam ? (row.original.marks_obtained / exam.max_marks) * 100 : 0;
          return (
            <span
              className={`text-right block font-medium ${
                pct >= 75
                  ? "text-emerald-600"
                  : pct >= 50
                  ? "text-amber-600"
                  : "text-red-600"
              }`}
            >
              {fmtPct(pct)}
            </span>
          );
        },
      },
      {
        accessorKey: "date",
        header: ({ column }) => <SortableHeader column={column}>Date</SortableHeader>,
        accessorFn: (row) => {
          const exam = row.exams as any;
          return exam?.exam_date || row.created_at;
        },
        cell: ({ row }) => {
          const exam = row.original.exams as any;
          const date = exam?.exam_date || row.original.created_at;
          return (
            <span className="text-right block text-sm text-muted-foreground">
              {formatDate(date)}
            </span>
          );
        },
      },
    ],
    []
  );

  // Calculate summary stats
  const stats = useMemo(() => {
    const percentages = marks.map((m) => {
      const exam = m.exams as any;
      return exam ? (m.marks_obtained / exam.max_marks) * 100 : 0;
    });

    const avg = percentages.length > 0
      ? percentages.reduce((a, b) => a + b, 0) / percentages.length
      : 0;

    const excellent = percentages.filter((p) => p >= 75).length;
    const good = percentages.filter((p) => p >= 60 && p < 75).length;
    const average = percentages.filter((p) => p >= 40 && p < 60).length;
    const poor = percentages.filter((p) => p < 40).length;

    return { total: marks.length, avg, excellent, good, average, poor };
  }, [marks]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
        <div className="p-3 bg-slate-50 rounded-lg border hover-lift transition-all">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Total Results
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.total}</div>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 hover-lift transition-all">
          <div className="text-xs text-blue-700 uppercase tracking-wider mb-1">
            Average
          </div>
          <div className="text-2xl font-semibold text-blue-900">
            {stats.total > 0 ? fmtPct(stats.avg) : "—"}
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
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 hover-lift transition-all">
          <div className="text-xs text-blue-700 uppercase tracking-wider mb-1">
            Good
          </div>
          <div className="text-2xl font-semibold text-blue-900">{stats.good}</div>
        </div>
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 hover-lift transition-all">
          <div className="text-xs text-amber-700 uppercase tracking-wider mb-1">
            Average
          </div>
          <div className="text-2xl font-semibold text-amber-900">{stats.average}</div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={marks}
        searchPlaceholder="Search by subject, exam name, type..."
      />
    </div>
  );
}
