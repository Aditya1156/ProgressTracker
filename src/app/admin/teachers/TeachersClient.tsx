"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Mail } from "lucide-react";
import { downloadCSV, formatTeacherDataForExport } from "@/lib/export";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Teacher {
  id: string;
  designation: string;
  created_at: string;
  examsCount: number;
  feedbackCount: number;
  profiles: any;
  departments: any;
}

interface TeachersClientProps {
  teachers: Teacher[];
}

export default function TeachersClient({ teachers }: TeachersClientProps) {
  const router = useRouter();

  // Define table columns
  const columns: ColumnDef<Teacher>[] = useMemo(
    () => [
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
        header: ({ column }) => <SortableHeader column={column}>Email</SortableHeader>,
        accessorFn: (row) => (row.profiles as any)?.email ?? "—",
        cell: ({ row }) => {
          const email = (row.original.profiles as any)?.email ?? "—";
          return (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-sm text-gray-400">{email}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "department",
        header: ({ column }) => <SortableHeader column={column}>Department</SortableHeader>,
        accessorFn: (row) => (row.departments as any)?.full_name ?? "—",
        cell: ({ row }) => {
          const dept = row.original.departments as any;
          return (
            <div className="flex flex-col">
              <span className="text-sm">{dept?.full_name ?? "—"}</span>
              <span className="text-xs text-gray-400">
                {dept?.name ?? ""}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "designation",
        header: ({ column }) => <SortableHeader column={column}>Designation</SortableHeader>,
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-xs badge-transition">
            {row.original.designation}
          </Badge>
        ),
      },
      {
        accessorKey: "examsCount",
        header: ({ column }) => <SortableHeader column={column}>Exams Created</SortableHeader>,
        cell: ({ row }) => (
          <span className="text-right block text-sm font-medium">
            {row.original.examsCount ?? 0}
          </span>
        ),
      },
      {
        accessorKey: "feedbackCount",
        header: ({ column }) => <SortableHeader column={column}>Feedback Sent</SortableHeader>,
        cell: ({ row }) => (
          <span className="text-right block text-sm font-medium">
            {row.original.feedbackCount ?? 0}
          </span>
        ),
      },
    ],
    []
  );

  const handleExport = () => {
    if (teachers.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = formatTeacherDataForExport(teachers);
    const timestamp = new Date().toISOString().split("T")[0];
    downloadCSV(exportData, `teachers-${timestamp}.csv`);
    toast.success(`Exported ${teachers.length} teacher(s)`);
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
        data={teachers}
        searchPlaceholder="Search by name, email, department, designation..."
        onRowClick={(row) => router.push(`/admin/teachers/${row.id}`)}
      />
    </div>
  );
}
