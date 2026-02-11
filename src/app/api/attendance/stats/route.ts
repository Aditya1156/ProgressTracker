import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student record
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Get all attendance records
    const { data: attendance } = await supabase
      .from("attendance")
      .select("status, subjects(id, name, code)")
      .eq("student_id", student.id);

    const records = attendance ?? [];
    const totalClasses = records.length;
    const attended = records.filter(
      (r) => r.status === "present" || r.status === "late"
    ).length;
    const overallPercentage =
      totalClasses > 0 ? (attended / totalClasses) * 100 : 0;

    // Per-subject breakdown
    const subjectMap = new Map<
      string,
      { code: string; name: string; total: number; attended: number }
    >();

    for (const r of records) {
      const subject = r.subjects as any;
      if (!subject) continue;
      const key = subject.id;
      const existing = subjectMap.get(key) ?? {
        code: subject.code,
        name: subject.name,
        total: 0,
        attended: 0,
      };
      existing.total++;
      if (r.status === "present" || r.status === "late") existing.attended++;
      subjectMap.set(key, existing);
    }

    const subjects = Array.from(subjectMap.values()).map((s) => ({
      ...s,
      percentage: s.total > 0 ? (s.attended / s.total) * 100 : 0,
    }));

    const belowThreshold = subjects.filter((s) => s.percentage < 75);

    return NextResponse.json({
      overallPercentage: parseFloat(overallPercentage.toFixed(2)),
      totalClasses,
      attended,
      subjects,
      belowThreshold,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
