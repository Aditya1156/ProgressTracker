import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Users, Award } from "lucide-react";
import { fmtPct } from "@/lib/utils";

export default async function AdminAnalyticsPage() {
  const user = await getUser();
  const supabase = await createClient();

  // Fetch analytics data
  const [
    { data: students },
    { data: allMarks },
    { data: exams },
    { data: departments },
  ] = await Promise.all([
    supabase.from("students").select("id, semester, batch, department_id"),
    supabase
      .from("marks")
      .select(
        "marks_obtained, student_id, exams(max_marks, type, created_at, subjects(department_id))"
      ),
    supabase.from("exams").select("id, type, created_at, subjects(name)"),
    supabase.from("departments").select("id, name, full_name"),
  ]);

  // Calculate overall statistics
  const totalStudents = students?.length ?? 0;
  const totalExams = exams?.length ?? 0;

  // Performance trends
  const validMarks = (allMarks ?? []).filter((m) => (m.exams as any)?.max_marks);
  const percentages = validMarks.map((m) => {
    const exam = m.exams as any;
    return (m.marks_obtained / exam.max_marks) * 100;
  });

  const overallAvg =
    percentages.length > 0
      ? percentages.reduce((a, b) => a + b, 0) / percentages.length
      : 0;

  const excellentCount = percentages.filter((p) => p >= 75).length;
  const goodCount = percentages.filter((p) => p >= 60 && p < 75).length;
  const averageCount = percentages.filter((p) => p >= 40 && p < 60).length;
  const poorCount = percentages.filter((p) => p < 40).length;

  // Department-wise performance
  const deptPerformance = (departments ?? []).map((dept) => {
    const deptMarks = validMarks.filter(
      (m) => (m.exams as any)?.subjects?.department_id === dept.id
    );
    const deptPcts = deptMarks.map((m) => {
      const exam = m.exams as any;
      return (m.marks_obtained / exam.max_marks) * 100;
    });
    const avg =
      deptPcts.length > 0
        ? deptPcts.reduce((a, b) => a + b, 0) / deptPcts.length
        : 0;
    return { ...dept, avg, count: deptPcts.length };
  });

  // Semester-wise distribution
  const semesterStats = Array.from({ length: 8 }, (_, i) => {
    const sem = i + 1;
    const semStudents = (students ?? []).filter((s) => s.semester === sem);
    const semStudentIds = new Set(semStudents.map((s) => s.id));
    const semMarks = validMarks.filter((m) => semStudentIds.has(m.student_id));
    const semPcts = semMarks.map((m) => {
      const exam = m.exams as any;
      return (m.marks_obtained / exam.max_marks) * 100;
    });
    const avg =
      semPcts.length > 0 ? semPcts.reduce((a, b) => a + b, 0) / semPcts.length : 0;
    return {
      semester: sem,
      studentCount: semStudents.length,
      avg: parseFloat(avg.toFixed(2)),
    };
  }).filter((s) => s.studentCount > 0);

  // Exam type distribution
  const examTypes = ["class_test", "mid_sem", "end_sem", "assignment", "practical"];
  const examTypeStats = examTypes.map((type) => {
    const typeExams = (exams ?? []).filter((e) => e.type === type);
    return {
      type,
      count: typeExams.length,
      label: type.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    };
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Detailed insights and performance metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Overall Average
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-slate-900">
                {percentages.length > 0 ? fmtPct(overallAvg) : "—"}
              </span>
              {overallAvg >= 60 ? (
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Total Students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-slate-900">
                {totalStudents}
              </span>
              <Users className="h-5 w-5 text-slate-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Total Exams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-slate-900">
                {totalExams}
              </span>
              <Award className="h-5 w-5 text-slate-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Excellence Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-emerald-600">
                {percentages.length > 0
                  ? fmtPct((excellentCount / percentages.length) * 100)
                  : "—"}
              </span>
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance Distribution</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="semesters">Semesters</TabsTrigger>
          <TabsTrigger value="exams">Exam Types</TabsTrigger>
        </TabsList>

        {/* Performance Distribution */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Performance Category Distribution
              </CardTitle>
              <CardDescription>
                Student performance across all exams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-emerald-700">
                      Excellent (75%+)
                    </span>
                    <span className="text-slate-600">
                      {excellentCount} ({percentages.length > 0 ? fmtPct((excellentCount / percentages.length) * 100) : "0%"})
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${percentages.length > 0 ? (excellentCount / percentages.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-blue-700">Good (60-74%)</span>
                    <span className="text-slate-600">
                      {goodCount} ({percentages.length > 0 ? fmtPct((goodCount / percentages.length) * 100) : "0%"})
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${percentages.length > 0 ? (goodCount / percentages.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-amber-700">
                      Average (40-59%)
                    </span>
                    <span className="text-slate-600">
                      {averageCount} ({percentages.length > 0 ? fmtPct((averageCount / percentages.length) * 100) : "0%"})
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{
                        width: `${percentages.length > 0 ? (averageCount / percentages.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-red-700">
                      Needs Improvement (&lt;40%)
                    </span>
                    <span className="text-slate-600">
                      {poorCount} ({percentages.length > 0 ? fmtPct((poorCount / percentages.length) * 100) : "0%"})
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{
                        width: `${percentages.length > 0 ? (poorCount / percentages.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments */}
        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Department Performance</CardTitle>
              <CardDescription>
                Average performance by department
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deptPerformance
                  .sort((a, b) => b.avg - a.avg)
                  .map((dept) => (
                    <div key={dept.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium text-slate-900">
                            {dept.full_name}
                          </span>
                          <span className="text-muted-foreground ml-2">
                            ({dept.count} results)
                          </span>
                        </div>
                        <span
                          className={`font-medium ${
                            dept.avg >= 60
                              ? "text-emerald-600"
                              : dept.avg >= 45
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        >
                          {dept.count > 0 ? fmtPct(dept.avg) : "No data"}
                        </span>
                      </div>
                      {dept.count > 0 && (
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              dept.avg >= 60
                                ? "bg-emerald-500"
                                : dept.avg >= 45
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(dept.avg, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Semesters */}
        <TabsContent value="semesters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Semester-wise Analysis</CardTitle>
              <CardDescription>Performance across semesters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {semesterStats.map((sem) => (
                  <div key={sem.semester} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium text-slate-900">
                          Semester {sem.semester}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          ({sem.studentCount} students)
                        </span>
                      </div>
                      <span
                        className={`font-medium ${
                          sem.avg >= 60
                            ? "text-emerald-600"
                            : sem.avg >= 45
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {fmtPct(sem.avg)}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          sem.avg >= 60
                            ? "bg-emerald-500"
                            : sem.avg >= 45
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(sem.avg, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exam Types */}
        <TabsContent value="exams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Exam Type Distribution</CardTitle>
              <CardDescription>Number of exams by type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {examTypeStats
                  .filter((t) => t.count > 0)
                  .sort((a, b) => b.count - a.count)
                  .map((type) => (
                    <div key={type.type} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-900">
                          {type.label}
                        </span>
                        <span className="text-slate-600">{type.count} exams</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${(type.count / totalExams) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
