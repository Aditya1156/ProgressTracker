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
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CalendarCheck, BookOpen } from "lucide-react";
import { fmtPct } from "@/lib/utils";
import {
  classifyAttendance,
  calculateAttendancePercentage,
  getStatusCounts,
  ATTENDANCE_THRESHOLD,
} from "@/lib/attendance";
import { SubjectAttendanceChart } from "./SubjectAttendanceChart";
import { AttendanceCalendar } from "./AttendanceCalendar";

export default async function StudentAttendancePage() {
  const user = await getUser();
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, roll_no, semester, department_id, departments(name)")
    .eq("profile_id", user.id)
    .single();

  if (!student) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-gray-800">Attendance</h1>
        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="py-12 text-center text-gray-400">
            <p>Your student profile hasn&apos;t been set up yet.</p>
            <p className="text-sm mt-1">
              Please contact your department administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch all attendance records for this student
  const { data: attendance } = await supabase
    .from("attendance")
    .select("id, date, status, subjects(id, name, code)")
    .eq("student_id", student.id)
    .order("date", { ascending: false });

  const allRecords = attendance ?? [];

  // Overall stats
  const overallPct = calculateAttendancePercentage(allRecords);
  const overallCategory = classifyAttendance(overallPct);
  const overallCounts = getStatusCounts(allRecords);

  // Per-subject summaries
  const subjectMap = new Map<
    string,
    {
      id: string;
      code: string;
      name: string;
      records: Array<{ status: string }>;
    }
  >();

  for (const r of allRecords) {
    const subject = r.subjects as any;
    if (!subject) continue;
    const key = subject.id;
    const existing = subjectMap.get(key) ?? {
      id: subject.id,
      code: subject.code,
      name: subject.name,
      records: [] as Array<{ status: string }>,
    };
    existing.records.push({ status: r.status });
    subjectMap.set(key, existing);
  }

  const subjectSummaries = Array.from(subjectMap.values())
    .map((s) => {
      const pct = calculateAttendancePercentage(s.records);
      const counts = getStatusCounts(s.records);
      return {
        ...s,
        percentage: pct,
        total: s.records.length,
        counts,
        belowThreshold: pct < ATTENDANCE_THRESHOLD,
      };
    })
    .sort((a, b) => a.percentage - b.percentage);

  const belowThresholdCount = subjectSummaries.filter(
    (s) => s.belowThreshold
  ).length;

  // Prepare data for chart and calendar
  const chartData = subjectSummaries.map((s) => ({
    code: s.code,
    name: s.name,
    percentage: parseFloat(s.percentage.toFixed(1)),
    total: s.total,
  }));

  const calendarRecords = allRecords.map((r) => ({
    date: r.date,
    status: r.status,
    subjectCode: (r.subjects as any)?.code ?? "",
  }));

  const calendarSubjects = Array.from(subjectMap.values()).map((s) => ({
    code: s.code,
    name: s.name,
  }));

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Attendance</h1>
        <p className="text-sm text-gray-400 mt-1">
          Your attendance records and subject-wise breakdown
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Overall Attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-semibold ${allRecords.length > 0 ? overallCategory.color : "text-gray-800"}`}
              >
                {allRecords.length > 0 ? fmtPct(overallPct) : "—"}
              </span>
              {allRecords.length > 0 && (
                <Badge
                  variant="secondary"
                  className={`${overallCategory.bgColor} ${overallCategory.color} border-0 text-xs`}
                >
                  {overallCategory.label}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Total Classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-gray-400" />
              <span className="text-2xl font-semibold text-gray-800">
                {allRecords.length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Classes Attended
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-500" />
              <span className="text-2xl font-semibold text-emerald-600">
                {overallCounts.present + overallCounts.late}
              </span>
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
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span
                className={`text-2xl font-semibold ${belowThresholdCount > 0 ? "text-red-600" : "text-gray-800"}`}
              >
                {belowThresholdCount}
              </span>
              <span className="text-xs text-gray-400">subject(s)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Threshold warning */}
      {allRecords.length > 0 && overallPct < ATTENDANCE_THRESHOLD && (
        <Card className="border-gray-200/80 shadow-sm border-red-500/20 bg-red-500/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <p className="text-sm text-gray-800/80">
                Your overall attendance ({fmtPct(overallPct)}) is below the
                minimum {ATTENDANCE_THRESHOLD}% threshold. You may be ineligible
                to sit for exams.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subject-wise breakdown */}
      {subjectSummaries.length > 0 && (
        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Subject-wise Breakdown</CardTitle>
            <CardDescription>
              Detailed attendance per subject
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subjectSummaries.map((s) => {
              const category = classifyAttendance(s.percentage);
              return (
                <div key={s.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{s.code}</span>
                      <span className="text-xs text-gray-400 ml-2">
                        {s.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {s.counts.present + s.counts.late}/{s.total}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-xs border-0 ${category.bgColor} ${category.color}`}
                      >
                        {fmtPct(s.percentage)}
                      </Badge>
                    </div>
                  </div>
                  <Progress
                    value={s.percentage}
                    className="h-2"
                  />
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" />
                      Present: {s.counts.present}
                    </span>
                    <span>
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />
                      Absent: {s.counts.absent}
                    </span>
                    <span>
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1" />
                      Late: {s.counts.late}
                    </span>
                    <span>
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1" />
                      Excused: {s.counts.excused}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Charts and Calendar */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="animate-fade-in animate-delay-300">
          <SubjectAttendanceChart data={chartData} />
        </div>
        <div className="animate-fade-in animate-delay-400">
          <AttendanceCalendar
            records={calendarRecords}
            subjects={calendarSubjects}
          />
        </div>
      </div>
    </div>
  );
}
