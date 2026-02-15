"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Plus, Trash2 } from "lucide-react";
import { classifyLearner, fmtPct } from "@/lib/utils";
import { downloadCSV, formatStudentDataForExport } from "@/lib/export";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Student {
  id: string;
  roll_no: string;
  semester: number;
  batch: string;
  section?: string;
  avg: number;
  examCount: number;
  profiles: any;
  departments: any;
}

interface StudentsClientProps {
  students: Student[];
  departmentId: string | null;
}

export default function StudentsClient({ students, departmentId }: StudentsClientProps) {
  const router = useRouter();
  const [filterSemester, setFilterSemester] = useState("all");
  const [filterBatch, setFilterBatch] = useState("all");
  const [filterSection, setFilterSection] = useState("all");

  // Add student dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addUSN, setAddUSN] = useState("");
  const [addBatch, setAddBatch] = useState("");
  const [addSemester, setAddSemester] = useState("1");
  const [addSection, setAddSection] = useState("");
  const [isLateral, setIsLateral] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Remove student dialog state
  const [removeTarget, setRemoveTarget] = useState<Student | null>(null);
  const [removeSubmitting, setRemoveSubmitting] = useState(false);

  // Extract unique values for filter dropdowns
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

  // Apply filters
  const filteredStudents = useMemo(() => {
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

  // Handle add student
  async function handleAddStudent() {
    if (!addName.trim() || !addUSN.trim() || !addBatch || !addSection) {
      toast.error("Please fill all required fields");
      return;
    }

    setAddSubmitting(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: addName.trim(),
          roll_no: addUSN.trim().toUpperCase(),
          batch: addBatch,
          semester: Number(addSemester),
          section: addSection,
          is_lateral: isLateral,
          department_id: departmentId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to add student");
        return;
      }

      toast.success(`Student ${addUSN.toUpperCase()} added successfully`);
      setAddOpen(false);
      resetAddForm();
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setAddSubmitting(false);
    }
  }

  function resetAddForm() {
    setAddName("");
    setAddUSN("");
    setAddBatch("");
    setAddSemester("1");
    setAddSection("");
    setIsLateral(false);
  }

  // Handle remove student
  async function handleRemoveStudent() {
    if (!removeTarget) return;

    setRemoveSubmitting(true);
    try {
      const res = await fetch("/api/students", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: removeTarget.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to remove student");
        return;
      }

      toast.success(`${removeTarget.roll_no} removed`);
      setRemoveTarget(null);
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setRemoveSubmitting(false);
    }
  }

  // Define table columns
  const columns: ColumnDef<Student>[] = useMemo(
    () => [
      {
        accessorKey: "roll_no",
        header: ({ column }) => (
          <SortableHeader column={column}>Roll No</SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium">
            {row.original.roll_no}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <SortableHeader column={column}>Name</SortableHeader>
        ),
        accessorFn: (row) => (row.profiles as any)?.full_name ?? "—",
        cell: ({ row }) => (
          <span className="font-medium">
            {(row.original.profiles as any)?.full_name ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "semester",
        header: ({ column }) => (
          <SortableHeader column={column}>Sem</SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="text-center block text-sm">
            {row.original.semester}
          </span>
        ),
      },
      {
        accessorKey: "section",
        header: "Section",
        cell: ({ row }) => (
          <span className="text-center block text-sm">
            {row.original.section ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "batch",
        header: ({ column }) => (
          <SortableHeader column={column}>Batch</SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="text-center block text-sm">
            {row.original.batch}
          </span>
        ),
      },
      {
        accessorKey: "examCount",
        header: ({ column }) => (
          <SortableHeader column={column}>Exams</SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="text-right block text-sm">
            {row.original.examCount}
          </span>
        ),
      },
      {
        accessorKey: "avg",
        header: ({ column }) => (
          <SortableHeader column={column}>Average</SortableHeader>
        ),
        cell: ({ row }) => {
          const cat =
            row.original.avg >= 0 ? classifyLearner(row.original.avg) : null;
          return (
            <span
              className={`text-right block font-medium ${cat?.color ?? ""}`}
            >
              {row.original.avg >= 0 ? fmtPct(row.original.avg) : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const cat =
            row.original.avg >= 0 ? classifyLearner(row.original.avg) : null;
          return (
            <div className="text-right">
              {cat ? (
                <Badge
                  variant="secondary"
                  className={`text-xs border-0 ${cat.bgColor} ${cat.color}`}
                >
                  {cat.label}
                </Badge>
              ) : (
                <span className="text-xs text-gray-400">No data</span>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRemoveTarget(row.original);
            }}
            className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Remove student"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ),
      },
    ],
    []
  );

  const handleExport = () => {
    if (filteredStudents.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = formatStudentDataForExport(filteredStudents);
    const timestamp = new Date().toISOString().split("T")[0];
    const suffix = [
      filterSemester !== "all" ? `sem${filterSemester}` : "",
      filterBatch !== "all" ? filterBatch : "",
      filterSection !== "all" ? `sec${filterSection}` : "",
    ]
      .filter(Boolean)
      .join("-");
    downloadCSV(
      exportData,
      `students${suffix ? `-${suffix}` : ""}-${timestamp}.csv`
    );
    toast.success(`Exported ${filteredStudents.length} student(s)`);
  };

  // Calculate stats based on filtered data
  const stats = useMemo(() => {
    const withResults = filteredStudents.filter((s) => s.examCount > 0).length;
    const excellent = filteredStudents.filter((s) => s.avg >= 75).length;
    const atRisk = filteredStudents.filter(
      (s) => s.avg >= 0 && s.avg < 40
    ).length;

    return {
      total: filteredStudents.length,
      withResults,
      excellent,
      atRisk,
    };
  }, [filteredStudents]);

  const currentYear = new Date().getFullYear();
  const batchYears = Array.from({ length: 5 }, (_, i) => String(currentYear - 2 + i));

  return (
    <div className="space-y-6">
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

        <div className="ml-auto flex items-center gap-2">
          <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) resetAddForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[#0f1b4c] hover:bg-[#0f1b4c]/90">
                <Plus className="h-4 w-4 mr-1" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Create a new student account. Default password: student123
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="add-name">Full Name *</Label>
                  <Input
                    id="add-name"
                    placeholder="e.g. ABHISHEK V"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add-usn">USN / Roll No *</Label>
                  <Input
                    id="add-usn"
                    placeholder="e.g. 4PM24CS001"
                    value={addUSN}
                    onChange={(e) => setAddUSN(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                  {addUSN && (
                    <p className="text-xs text-gray-400">
                      Email: {addUSN.toLowerCase()}@college.edu
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Batch *</Label>
                    <Select value={addBatch} onValueChange={setAddBatch}>
                      <SelectTrigger>
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {batchYears.map((y) => (
                          <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Section *</Label>
                    <Select value={addSection} onValueChange={setAddSection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Section" />
                      </SelectTrigger>
                      <SelectContent>
                        {["A", "B", "C", "D", "E"].map((s) => (
                          <SelectItem key={s} value={s}>Section {s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Semester *</Label>
                  <Select
                    value={addSemester}
                    onValueChange={setAddSemester}
                    disabled={!isLateral}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <SelectItem key={s} value={String(s)}>
                          Semester {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="lateral"
                    checked={isLateral}
                    onCheckedChange={(checked) => {
                      setIsLateral(checked === true);
                      if (checked !== true) setAddSemester("1");
                    }}
                  />
                  <Label htmlFor="lateral" className="text-sm font-normal cursor-pointer">
                    Lateral Entry
                  </Label>
                </div>
                {isLateral && (
                  <p className="text-xs text-amber-600 -mt-2">
                    Lateral entry students typically join at Semester 3
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddStudent}
                  disabled={addSubmitting}
                  className="bg-[#0f1b4c] hover:bg-[#0f1b4c]/90"
                >
                  {addSubmitting ? "Adding..." : "Add Student"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div className="p-3 rounded-lg border border-gray-200/80 shadow-sm">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            Total
          </div>
          <div className="text-2xl font-semibold text-gray-800">
            {stats.total}
          </div>
        </div>
        <div className="p-3 rounded-lg border border-gray-200/80 shadow-sm bg-blue-50">
          <div className="text-xs text-blue-700 uppercase tracking-wider mb-1">
            With Results
          </div>
          <div className="text-2xl font-semibold text-blue-800">
            {stats.withResults}
          </div>
        </div>
        <div className="p-3 rounded-lg border border-gray-200/80 shadow-sm bg-emerald-50">
          <div className="text-xs text-emerald-700 uppercase tracking-wider mb-1">
            Excellent
          </div>
          <div className="text-2xl font-semibold text-emerald-800">
            {stats.excellent}
          </div>
        </div>
        <div className="p-3 rounded-lg border border-gray-200/80 shadow-sm bg-red-50">
          <div className="text-xs text-red-700 uppercase tracking-wider mb-1">
            At Risk
          </div>
          <div className="text-2xl font-semibold text-red-800">
            {stats.atRisk}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredStudents}
        searchPlaceholder="Search by name, roll no..."
        onRowClick={(row) => router.push(`/admin/students/${row.id}`)}
      />

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!removeTarget} onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-gray-700">
                {(removeTarget?.profiles as any)?.full_name}
              </span>{" "}
              <span className="font-mono text-sm">({removeTarget?.roll_no})</span>?
              This will permanently delete the student, their marks, attendance, and feedback.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveStudent}
              disabled={removeSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {removeSubmitting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
