"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PerformanceBarChart } from "@/components/charts/PerformanceBarChart";
import { PerformancePieChart } from "@/components/charts/PerformancePieChart";
import { chartColors } from "@/lib/chart-config";
import { AlertTriangle } from "lucide-react";

interface Props {
  subjectPerformance: Array<{ name: string; fullName: string; value: number; count: number }>;
  distribution: { excellentCount: number; goodCount: number; averageCount: number; poorCount: number; total: number };
  examAnalysis: Array<{
    id: string; name: string; type: string; subject: string; date: string;
    maxMarks: number; studentsCount: number; avg: number; highest: number;
    lowest: number; passRate: number;
  }>;
  subjectAttendance: Array<{
    name: string; fullName: string; value: number; students: number;
    totalRecords: number; lowCount: number;
  }>;
}

export default function AnalyticsClient({
  subjectPerformance,
  distribution,
  examAnalysis,
  subjectAttendance,
}: Props) {
  const pieData = [
    { name: "Excellent (75%+)", value: distribution.excellentCount, color: chartColors.excellent },
    { name: "Good (60-74%)", value: distribution.goodCount, color: chartColors.good },
    { name: "Average (40-59%)", value: distribution.averageCount, color: chartColors.average },
    { name: "Poor (<40%)", value: distribution.poorCount, color: chartColors.poor },
  ].filter((d) => d.value > 0);

  const totalLowAttendance = subjectAttendance.reduce((sum, s) => sum + s.lowCount, 0);

  return (
    <Tabs defaultValue="subjects" className="space-y-4">
      <TabsList>
        <TabsTrigger value="subjects">Subject Performance</TabsTrigger>
        <TabsTrigger value="distribution">Score Distribution</TabsTrigger>
        <TabsTrigger value="exams">Exam Analysis</TabsTrigger>
        <TabsTrigger value="attendance">Attendance</TabsTrigger>
      </TabsList>

      {/* Subject Performance */}
      <TabsContent value="subjects" className="space-y-4">
        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Average Score by Subject</CardTitle>
            <CardDescription>
              Performance comparison across your subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subjectPerformance.length > 0 ? (
              <PerformanceBarChart
                data={subjectPerformance}
                height={Math.max(200, subjectPerformance.length * 60)}
              />
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No marks data available yet.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Score Distribution */}
      <TabsContent value="distribution" className="space-y-4">
        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Performance Distribution</CardTitle>
            <CardDescription>
              {distribution.total} mark entries across all exams
            </CardDescription>
          </CardHeader>
          <CardContent>
            {distribution.total > 0 ? (
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <PerformancePieChart data={pieData} height={280} />
                <div className="space-y-3">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{d.name}</span>
                      <span className="text-sm font-semibold text-gray-800">
                        {d.value} ({((d.value / distribution.total) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No marks data available yet.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Exam Analysis */}
      <TabsContent value="exams" className="space-y-4">
        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Exam-wise Analysis</CardTitle>
            <CardDescription>
              Detailed breakdown of each exam you created
            </CardDescription>
          </CardHeader>
          <CardContent>
            {examAnalysis.length > 0 ? (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Students</TableHead>
                    <TableHead className="text-right">Avg %</TableHead>
                    <TableHead className="text-right">Highest</TableHead>
                    <TableHead className="text-right">Lowest</TableHead>
                    <TableHead className="text-right">Pass Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examAnalysis.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.name}</TableCell>
                      <TableCell className="text-gray-500">{exam.subject}</TableCell>
                      <TableCell>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {exam.type.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{exam.studentsCount}</TableCell>
                      <TableCell className="text-right">
                        <span className={exam.avg >= 60 ? "text-emerald-600 font-medium" : exam.avg >= 40 ? "text-amber-600 font-medium" : "text-red-600 font-medium"}>
                          {exam.avg}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{exam.highest}/{exam.maxMarks}</TableCell>
                      <TableCell className="text-right">{exam.lowest}/{exam.maxMarks}</TableCell>
                      <TableCell className="text-right">
                        <span className={exam.passRate >= 80 ? "text-emerald-600" : exam.passRate >= 50 ? "text-amber-600" : "text-red-600"}>
                          {exam.passRate}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No exams created yet.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Attendance */}
      <TabsContent value="attendance" className="space-y-4">
        {/* Attendance by Subject */}
        <Card className="border-gray-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Attendance by Subject</CardTitle>
            <CardDescription>
              Overall attendance rate for each subject
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subjectAttendance.length > 0 ? (
              <div className="space-y-3">
                {subjectAttendance.map((sub) => (
                  <div key={sub.name} className="flex items-center gap-3">
                    <div className="w-16 sm:w-20 text-xs sm:text-sm font-mono text-gray-600 shrink-0 truncate">{sub.name}</div>
                    <div className="flex-1 min-w-0">
                      <div className="h-5 sm:h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${sub.value >= 75 ? "bg-emerald-500" : sub.value >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${Math.min(sub.value, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-12 sm:w-14 text-xs sm:text-sm font-semibold text-right shrink-0">
                      {sub.value.toFixed(0)}%
                    </div>
                    <div className="hidden sm:block w-24 text-xs text-gray-400 text-right shrink-0">
                      {sub.students} students
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No attendance data available yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Low Attendance Alert */}
        {totalLowAttendance > 0 && (
          <Card className="border-amber-200 bg-amber-50/30 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Low Attendance Alert
              </CardTitle>
              <CardDescription>
                {totalLowAttendance} student-subject combinations below 75% threshold
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {subjectAttendance
                  .filter((s) => s.lowCount > 0)
                  .map((sub) => (
                    <div key={sub.name} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {sub.fullName} ({sub.name})
                      </span>
                      <span className="text-red-600 font-medium">
                        {sub.lowCount} student{sub.lowCount !== 1 ? "s" : ""} below 75%
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
