import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const examId = searchParams.get("examId");
    const departmentId = searchParams.get("departmentId");
    const semester = searchParams.get("semester");

    // Build query
    let query = supabase
      .from("marks")
      .select(
        `
        marks_obtained,
        students (
          roll_no,
          semester,
          batch,
          department_id,
          profiles (full_name)
        ),
        exams (
          id,
          name,
          type,
          max_marks,
          exam_date,
          subjects (name, code, department_id)
        )
      `
      )
      .order("created_at", { ascending: false });

    if (examId) {
      query = query.eq("exam_id", examId);
    }

    const { data: marks, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter by department and semester if specified
    let filteredMarks = marks ?? [];
    if (departmentId) {
      filteredMarks = filteredMarks.filter((m) => {
        const student = m.students as any;
        return student?.department_id === departmentId;
      });
    }
    if (semester) {
      filteredMarks = filteredMarks.filter((m) => {
        const student = m.students as any;
        return student?.semester === parseInt(semester);
      });
    }

    // Format data for export
    const exportData = filteredMarks.map((m) => {
      const student = m.students as any;
      const exam = m.exams as any;
      const percentage = exam?.max_marks
        ? ((m.marks_obtained / exam.max_marks) * 100).toFixed(2)
        : "N/A";

      return {
        rollNo: student?.roll_no ?? "N/A",
        studentName: student?.profiles?.full_name ?? "N/A",
        semester: student?.semester ?? "N/A",
        batch: student?.batch ?? "N/A",
        examName: exam?.name ?? "N/A",
        examType: exam?.type ?? "N/A",
        subject: exam?.subjects?.name ?? "N/A",
        subjectCode: exam?.subjects?.code ?? "N/A",
        marksObtained: m.marks_obtained,
        maxMarks: exam?.max_marks ?? 0,
        percentage,
        examDate: exam?.exam_date ?? "N/A",
      };
    });

    return NextResponse.json({
      count: exportData.length,
      data: exportData,
    });
  } catch (error) {
    console.error("Export API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
