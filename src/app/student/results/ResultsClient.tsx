"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, fmtPct } from "@/lib/utils";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { ArrowUp, ArrowDown } from "lucide-react";

interface Result {
  exam_id: string;
  marks_obtained: number;
  created_at: string;
  exams: any;
}

interface ResultsClientProps {
  marks: Result[];
  classAvgMap: Record<string, number>;
}

export default function ResultsClient({ marks, classAvgMap }: ResultsClientProps) {
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const subjects = useMemo(() => {
    const set = new Set<string>();
    marks.forEach((m) => {
      const code = m.exams?.subjects?.code;
      if (code) set.add(code);
    });
    return Array.from(set).sort();
  }, [marks]);

  const types = useMemo(() => {
    const set = new Set<string>();
    marks.forEach((m) => {
      if (m.exams?.type) set.add(m.exams.type);
    });
    return Array.from(set).sort();
  }, [marks]);

  const filtered = useMemo(() => {
    return marks.filter((m) => {
      if (subjectFilter !== "all" && m.exams?.subjects?.code !== subjectFilter) return false;
      if (typeFilter !== "all" && m.exams?.type !== typeFilter) return false;
      return true;
    });
  }, [marks, subjectFilter, typeFilter]);

  // Compute delta: improvement from previous exam in same subject
  const deltaMap = useMemo(() => {
    const map: Record<string, number | null> = {};
    const bySubject: Record<string, Result[]> = {};
    for (const m of marks) {
      const code = m.exams?.subjects?.code;
      if (!code) continue;
      if (!bySubject[code]) bySubject[code] = [];
      bySubject[code].push(m);
    }
    for (const group of Object.values(bySubject)) {
      group.sort((a, b) => {
        const da = a.exams?.exam_date || a.created_at;
        const db = b.exams?.exam_date || b.created_at;
        return new Date(da).getTime() - new Date(db).getTime();
      });
      for (let i = 0; i < group.length; i++) {
        if (i === 0) {
          map[group[i].exam_id] = null;
        } else {
          const prevPct = group[i - 1].exams?.max_marks
            ? (group[i - 1].marks_obtained / group[i - 1].exams.max_marks) * 100
            : 0;
          const currPct = group[i].exams?.max_marks
            ? (group[i].marks_obtained / group[i].exams.max_marks) * 100
            : 0;
          map[group[i].exam_id] = currPct - prevPct;
        }
      }
    }
    return map;
  }, [marks]);

  const columns: ColumnDef<Result>[] = useMemo(
    () => [
      {
        accessorKey: "subject",
        header: ({ column }) => <SortableHeader column={column}>Subject</SortableHeader>,
        accessorFn: (row) => row.exams?.subjects?.code ?? "\u2014",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.exams?.subjects?.code ?? "\u2014"}
          </span>
        ),
      },
      {
        accessorKey: "exam",
        header: ({ column }) => <SortableHeader column={column}>Exam</SortableHeader>,
        accessorFn: (row) => row.exams?.name ?? "\u2014",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.exams?.name ?? "\u2014"}</span>
        ),
      },
      {
        accessorKey: "type",
        header: ({ column }) => <SortableHeader column={column}>Type</SortableHeader>,
        accessorFn: (row) => {
          return row.exams?.type?.replace("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? "\u2014";
        },
        cell: ({ row }) => {
          const typeLabel =
            row.original.exams?.type?.replace("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? "\u2014";
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
        cell: ({ row }) => (
          <span className="text-right block font-mono text-sm">
            {row.original.marks_obtained}/{row.original.exams?.max_marks ?? 0}
          </span>
        ),
      },
      {
        accessorKey: "percentage",
        header: ({ column }) => <SortableHeader column={column}>%</SortableHeader>,
        accessorFn: (row) => {
          return row.exams ? (row.marks_obtained / row.exams.max_marks) * 100 : 0;
        },
        cell: ({ row }) => {
          const pct = row.original.exams
            ? (row.original.marks_obtained / row.original.exams.max_marks) * 100
            : 0;
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
        accessorKey: "classAvg",
        header: ({ column }) => <SortableHeader column={column}>Class Avg</SortableHeader>,
        accessorFn: (row) => classAvgMap[row.exam_id] ?? 0,
        cell: ({ row }) => {
          const classAvg = classAvgMap[row.original.exam_id];
          const studentPct = row.original.exams
            ? (row.original.marks_obtained / row.original.exams.max_marks) * 100
            : 0;
          if (classAvg == null) return <span className="text-gray-300">{"\u2014"}</span>;
          const diff = studentPct - classAvg;
          return (
            <div className="text-right text-sm">
              <span className="text-gray-500">{fmtPct(classAvg)}</span>
              <span
                className={`ml-1.5 text-xs font-medium ${
                  diff >= 0 ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {diff >= 0 ? "+" : ""}{diff.toFixed(1)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "delta",
        header: ({ column }) => <SortableHeader column={column}>Delta</SortableHeader>,
        accessorFn: (row) => deltaMap[row.exam_id] ?? 0,
        cell: ({ row }) => {
          const d = deltaMap[row.original.exam_id];
          if (d == null) return <span className="text-gray-300">{"\u2014"}</span>;
          return (
            <div className={`flex items-center justify-end gap-0.5 text-sm font-medium ${
              d > 0 ? "text-emerald-600" : d < 0 ? "text-red-500" : "text-gray-400"
            }`}>
              {d > 0 ? <ArrowUp className="h-3.5 w-3.5" /> : d < 0 ? <ArrowDown className="h-3.5 w-3.5" /> : null}
              {d !== 0 ? `${Math.abs(d).toFixed(1)}%` : "\u2014"}
            </div>
          );
        },
      },
      {
        accessorKey: "date",
        header: ({ column }) => <SortableHeader column={column}>Date</SortableHeader>,
        accessorFn: (row) => row.exams?.exam_date || row.created_at,
        cell: ({ row }) => {
          const date = row.original.exams?.exam_date || row.original.created_at;
          return (
            <span className="text-right block text-sm text-gray-400">
              {formatDate(date)}
            </span>
          );
        },
      },
    ],
    [classAvgMap, deltaMap]
  );

  const stats = useMemo(() => {
    const percentages = filtered.map((m) => {
      return m.exams ? (m.marks_obtained / m.exams.max_marks) * 100 : 0;
    });

    const avg = percentages.length > 0
      ? percentages.reduce((a, b) => a + b, 0) / percentages.length
      : 0;

    const excellent = percentages.filter((p) => p >= 75).length;
    const good = percentages.filter((p) => p >= 60 && p < 75).length;
    const average = percentages.filter((p) => p >= 40 && p < 60).length;

    return { total: filtered.length, avg, excellent, good, average };
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>
                {t.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 text-sm">
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200/80">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            Total Results
          </div>
          <div className="text-2xl font-semibold text-gray-800">{stats.total}</div>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg border border-gray-200/80">
          <div className="text-xs text-blue-700 uppercase tracking-wider mb-1">
            Average
          </div>
          <div className="text-2xl font-semibold text-blue-800">
            {stats.total > 0 ? fmtPct(stats.avg) : "\u2014"}
          </div>
        </div>
        <div className="p-3 bg-emerald-50 rounded-lg border border-gray-200/80">
          <div className="text-xs text-emerald-700 uppercase tracking-wider mb-1">
            Excellent
          </div>
          <div className="text-2xl font-semibold text-emerald-800">
            {stats.excellent}
          </div>
        </div>
        <div className="p-3 bg-indigo-50 rounded-lg border border-gray-200/80">
          <div className="text-xs text-indigo-700 uppercase tracking-wider mb-1">
            Good
          </div>
          <div className="text-2xl font-semibold text-indigo-800">{stats.good}</div>
        </div>
        <div className="p-3 bg-amber-50 rounded-lg border border-gray-200/80">
          <div className="text-xs text-amber-700 uppercase tracking-wider mb-1">
            Needs Work
          </div>
          <div className="text-2xl font-semibold text-amber-800">{stats.average}</div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search by subject, exam name, type..."
      />
    </div>
  );
}
