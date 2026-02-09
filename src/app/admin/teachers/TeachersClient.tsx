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
import { Search, Download, Mail } from "lucide-react";
import { downloadCSV, formatTeacherDataForExport } from "@/lib/export";
import Link from "next/link";
import { toast } from "sonner";

interface TeachersClientProps {
  teachers: any[];
}

export default function TeachersClient({ teachers }: TeachersClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter teachers based on search query
  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return teachers;

    const query = searchQuery.toLowerCase();
    return teachers.filter((t) => {
      const profile = t.profiles as any;
      const dept = t.departments as any;

      return (
        profile?.full_name?.toLowerCase().includes(query) ||
        profile?.email?.toLowerCase().includes(query) ||
        dept?.name?.toLowerCase().includes(query) ||
        dept?.full_name?.toLowerCase().includes(query) ||
        t.designation.toLowerCase().includes(query)
      );
    });
  }, [teachers, searchQuery]);

  const handleExport = () => {
    if (filteredTeachers.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = formatTeacherDataForExport(filteredTeachers);
    const timestamp = new Date().toISOString().split("T")[0];
    downloadCSV(exportData, `teachers-${timestamp}.csv`);
    toast.success(`Exported ${filteredTeachers.length} teacher(s)`);
  };

  return (
    <>
      {/* Search and Export */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, department, designation..."
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
          Found {filteredTeachers.length} teacher(s) matching "{searchQuery}"
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead className="text-right">Exams Created</TableHead>
              <TableHead className="text-right">Feedback Sent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "No teachers found matching your search"
                      : "No teachers found"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredTeachers.map((teacher) => {
                const profile = teacher.profiles as any;
                const dept = teacher.departments as any;
                const examsCount = teacher.examsCount ?? 0;
                const feedbackCount = teacher.feedbackCount ?? 0;

                return (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/teachers/${teacher.id}`}
                        className="hover:underline"
                      >
                        {profile?.full_name ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {profile?.email ?? "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{dept?.full_name ?? "—"}</span>
                        <span className="text-xs text-muted-foreground">
                          {dept?.name ?? ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {teacher.designation}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-medium">{examsCount}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-medium">{feedbackCount}</span>
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
