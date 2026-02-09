import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["hod", "principal", "teacher"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch analytics data
    const [
      { count: totalStudents },
      { count: totalTeachers },
      { count: totalExams },
      { data: allMarks },
      { data: departments },
    ] = await Promise.all([
      supabase.from("students").select("*", { count: "exact", head: true }),
      supabase.from("teachers").select("*", { count: "exact", head: true }),
      supabase.from("exams").select("*", { count: "exact", head: true }),
      supabase.from("marks").select("marks_obtained, exams(max_marks)"),
      supabase.from("departments").select("id, name"),
    ]);

    // Calculate overall average
    const validMarks = (allMarks ?? []).filter((m) => m.exams);
    const percentages = validMarks.map((m) => {
      const exam = m.exams as any;
      return (m.marks_obtained / exam.max_marks) * 100;
    });
    const overallAverage =
      percentages.length > 0
        ? percentages.reduce((a, b) => a + b, 0) / percentages.length
        : 0;

    // Pass/fail statistics
    const passCount = percentages.filter((p) => p >= 40).length;
    const failCount = percentages.filter((p) => p < 40).length;

    return NextResponse.json({
      summary: {
        totalStudents: totalStudents ?? 0,
        totalTeachers: totalTeachers ?? 0,
        totalExams: totalExams ?? 0,
        totalMarksEntries: validMarks.length,
        overallAverage: parseFloat(overallAverage.toFixed(2)),
      },
      performance: {
        passCount,
        failCount,
        passPercentage:
          percentages.length > 0
            ? parseFloat(((passCount / percentages.length) * 100).toFixed(2))
            : 0,
      },
      departments: departments ?? [],
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
