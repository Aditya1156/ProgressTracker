import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  CalendarCheck,
  AlertTriangle,
  Users,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { fmtPct } from "@/lib/utils";
import {
  calculateAttendancePercentage,
  getStatusCounts,
  classifyAttendance,
  ATTENDANCE_THRESHOLD,
} from "@/lib/attendance";
import { DepartmentAttendanceChart } from "./DepartmentAttendanceChart";
import { AttendanceDistributionChart } from "./AttendanceDistributionChart";
import { AttendanceTrendChart } from "./AttendanceTrendChart";
import { AttendanceReportsClient } from "./AttendanceReportsClient";
import Link from "next/link";

export default async function AdminAttendancePage() {
  const user = await getUser();
  const supabase = await createClient();

  // Parallel data fetch
  const [
    { data: students },
    { data: allAttendance },
    { data: subjects },
    { data: departments },
  ] = await Promise.all([
    supabase
      .from("students")
      .select(
        "id, roll_no, semester, batch, department_id, profiles(full_name), departments(name)"
      ),
    supabase
      .from("attendance")
      .select("student_id, subject_id, date, status, subjects(id, name, code, department_id)")
      .order("date", { ascending: false }),
    supabase.from("subjects").select("id, name, code, department_id, semester"),
    supabase.from("departments").select("id, name, full_name"),
  ]);

  const records = allAttendance ?? [];
  const allStudents = students ?? [];
  const allDepts = departments ?? [];

  // ── Overall stats ──
  const overallRate = calculateAttendancePercentage(records);
  const overallCounts = getStatusCounts(records);
  const totalRecords = records.length;

  // ── Department-wise stats ──
  const deptAttendanceMap = new Map<string, Array<{ status: string }>>();
  const deptStudentCount = new Map<string, number>();

  for (const s of allStudents) {
    deptStudentCount.set(
      s.department_id,
      (deptStudentCount.get(s.department_id) ?? 0) + 1
    );
  }

  for (const r of records) {
    const deptId = (r.subjects as any)?.department_id;
    if (!deptId) continue;
    const arr = deptAttendanceMap.get(deptId) ?? [];
    arr.push({ status: r.status });
    deptAttendanceMap.set(deptId, arr);
  }

  const deptStats = allDepts.map((d) => {
    const deptRecords = deptAttendanceMap.get(d.id) ?? [];
    const avgAttendance = calculateAttendancePercentage(deptRecords);
    return {
      name: d.name,
      fullName: d.full_name,
      avgAttendance: parseFloat(avgAttendance.toFixed(1)),
      studentCount: deptStudentCount.get(d.id) ?? 0,
    };
  });

  // ── Per-student per-subject summaries (for reports tab) ──
  const studentSubjectMap = new Map<
    string,
    {
      studentId: string;
      rollNo: string;
      name: string;
      department: string;
      departmentId: string;
      semester: number;
      subjectCode: string;
      subject: string;
      records: Array<{ status: string }>;
    }
  >();

  const studentLookup = new Map(allStudents.map((s) => [s.id, s]));

  for (const r of records) {
    const subject = r.subjects as any;
    if (!subject) continue;
    const student = studentLookup.get(r.student_id);
    if (!student) continue;

    const key = `${r.student_id}_${subject.id}`;
    const existing = studentSubjectMap.get(key) ?? {
      studentId: r.student_id,
      rollNo: student.roll_no,
      name: (student.profiles as any)?.full_name ?? "—",
      department: (student.departments as any)?.name ?? "—",
      departmentId: student.department_id,
      semester: student.semester,
      subjectCode: subject.code,
      subject: subject.name,
      records: [] as Array<{ status: string }>,
    };
    existing.records.push({ status: r.status });
    studentSubjectMap.set(key, existing);
  }

  const studentSummaries = Array.from(studentSubjectMap.values()).map((s) => {
    const counts = getStatusCounts(s.records);
    const pct = calculateAttendancePercentage(s.records);
    return {
      ...s,
      totalClasses: s.records.length,
      present: counts.present,
      absent: counts.absent,
      late: counts.late,
      excused: counts.excused,
      percentage: parseFloat(pct.toFixed(1)),
    };
  });

  // Students below threshold (unique students, not per-subject)
  const lowAttendanceStudentIds = new Set<string>();
  for (const s of studentSummaries) {
    if (s.percentage < ATTENDANCE_THRESHOLD) {
      lowAttendanceStudentIds.add(s.studentId);
    }
  }

  // At-risk list (worst offenders)
  const atRiskList = studentSummaries
    .filter((s) => s.percentage < ATTENDANCE_THRESHOLD)
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 8);

  // ── Weekly trend data ──
  const weekMap = new Map<string, { total: number; attended: number }>();
  for (const r of records) {
    const d = new Date(r.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const weekKey = weekStart.toISOString().split("T")[0];
    const existing = weekMap.get(weekKey) ?? { total: 0, attended: 0 };
    existing.total++;
    if (r.status === "present" || r.status === "late") existing.attended++;
    weekMap.set(weekKey, existing);
  }

  const trendData = Array.from(weekMap.entries())
    .map(([week, data]) => ({
      week: new Date(week).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
      rate: parseFloat(((data.attended / data.total) * 100).toFixed(1)),
      total: data.total,
    }))
    .sort(
      (a, b) => new Date(a.week).getTime() - new Date(b.week).getTime()
    )
    .slice(-12);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">
          Attendance Management
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Institution-wide attendance overview and reports
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Overall Attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span
                className={`text-2xl font-semibold ${
                  totalRecords > 0
                    ? overallRate >= 75
                      ? "text-emerald-600"
                      : "text-red-600"
                    : "text-gray-800"
                }`}
              >
                {totalRecords > 0 ? fmtPct(overallRate) : "—"}
              </span>
              <CalendarCheck className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Total Records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-gray-800">
                {totalRecords}
              </span>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Students Tracked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-gray-800">
                {new Set(records.map((r) => r.student_id)).size}
              </span>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Below {ATTENDANCE_THRESHOLD}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span
                className={`text-2xl font-semibold ${lowAttendanceStudentIds.size > 0 ? "text-red-600" : "text-gray-800"}`}
              >
                {lowAttendanceStudentIds.size}
              </span>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="animate-fade-in">
              <DepartmentAttendanceChart data={deptStats} />
            </div>
            <div className="animate-fade-in animate-delay-200">
              <AttendanceDistributionChart
                present={overallCounts.present}
                absent={overallCounts.absent}
                late={overallCounts.late}
                excused={overallCounts.excused}
              />
            </div>
          </div>

          {/* At-risk students */}
          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-base">
                    Low Attendance Students
                  </CardTitle>
                </div>
              </div>
              <CardDescription>
                Students below {ATTENDANCE_THRESHOLD}% attendance in any subject
              </CardDescription>
            </CardHeader>
            <CardContent>
              {atRiskList.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">
                  No students below threshold.
                </p>
              ) : (
                <div className="space-y-3">
                  {atRiskList.map((s, i) => {
                    const cat = classifyAttendance(s.percentage);
                    return (
                      <div key={`${s.studentId}-${s.subjectCode}-${i}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {s.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {s.rollNo} &middot; {s.department} &middot;{" "}
                              {s.subjectCode}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-medium ${cat.color}`}>
                              {fmtPct(s.percentage)}
                            </p>
                            <Badge
                              variant="secondary"
                              className={`text-xs border-0 ${cat.bgColor} ${cat.color}`}
                            >
                              {s.present + s.late}/{s.totalClasses} classes
                            </Badge>
                          </div>
                        </div>
                        {i < atRiskList.length - 1 && (
                          <Separator className="mt-3" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <AttendanceReportsClient
            summaries={studentSummaries}
            departments={allDepts.map((d) => ({ id: d.id, name: d.name }))}
          />
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="animate-fade-in">
            <AttendanceTrendChart data={trendData} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
