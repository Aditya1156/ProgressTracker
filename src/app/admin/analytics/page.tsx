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
import { PerformanceDistributionChart } from "./PerformanceDistributionChart";
import { DepartmentsChart } from "./DepartmentsChart";
import { SemestersChart } from "./SemestersChart";
import { ExamTypesChart } from "./ExamTypesChart";

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
        <h1 className="text-xl font-semibold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Detailed insights and performance metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Overall Average
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-foreground">
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

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Total Students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-foreground">
                {totalStudents}
              </span>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Total Exams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-foreground">
                {totalExams}
              </span>
              <Award className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
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
          <PerformanceDistributionChart
            excellentCount={excellentCount}
            goodCount={goodCount}
            averageCount={averageCount}
            poorCount={poorCount}
            totalCount={percentages.length}
          />
        </TabsContent>

        {/* Departments */}
        <TabsContent value="departments" className="space-y-4">
          <DepartmentsChart deptPerformance={deptPerformance} />
        </TabsContent>

        {/* Semesters */}
        <TabsContent value="semesters" className="space-y-4">
          <SemestersChart semesterStats={semesterStats} />
        </TabsContent>

        {/* Exam Types */}
        <TabsContent value="exams" className="space-y-4">
          <ExamTypesChart examTypeStats={examTypeStats} totalExams={totalExams} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
