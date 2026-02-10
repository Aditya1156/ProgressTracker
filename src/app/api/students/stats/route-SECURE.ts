import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidUUID } from "@/lib/validation";

/**
 * SECURED Student Stats API
 * - Validates authentication
 * - Validates input parameters
 * - Checks authorization
 * - Sanitizes error messages
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // 🔒 Check authentication
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔒 Get and validate student ID parameter
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    // 🔒 Validate UUID format
    if (!isValidUUID(studentId)) {
      return NextResponse.json(
        { error: "Invalid student ID format" },
        { status: 400 }
      );
    }

    // 🔒 Get user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // 🔒 Get student record
    const { data: student } = await supabase
      .from("students")
      .select("id, profile_id, roll_no, semester, batch, department_id, profiles(full_name)")
      .eq("id", studentId)
      .single();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // 🔒 Check authorization
    const isOwnRecord = student.profile_id === user.id;
    const isAuthorized =
      isOwnRecord ||
      ["teacher", "hod", "principal"].includes(profile?.role ?? "");

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch marks data
    const { data: marks } = await supabase
      .from("marks")
      .select(
        `
        marks_obtained,
        exams (
          name,
          type,
          max_marks,
          exam_date,
          subjects (name, code)
        )
      `
      )
      .eq("student_id", studentId);

    // Calculate statistics
    const validMarks = (marks ?? []).filter((m) => m.exams);
    const percentages = validMarks.map((m) => {
      const exam = m.exams as any;
      return {
        subject: exam?.subjects?.name ?? "Unknown",
        subjectCode: exam?.subjects?.code ?? "N/A",
        examName: exam?.name ?? "Unknown",
        examType: exam?.type ?? "N/A",
        marksObtained: m.marks_obtained,
        maxMarks: exam?.max_marks ?? 0,
        percentage: exam?.max_marks
          ? parseFloat(((m.marks_obtained / exam.max_marks) * 100).toFixed(2))
          : 0,
        examDate: exam?.exam_date ?? null,
      };
    });

    const overallAverage =
      percentages.length > 0
        ? parseFloat(
            (
              percentages.reduce((sum, p) => sum + p.percentage, 0) /
              percentages.length
            ).toFixed(2)
          )
        : 0;

    // Subject-wise averages
    const subjectMap = new Map<string, number[]>();
    percentages.forEach((p) => {
      const key = p.subjectCode;
      if (!subjectMap.has(key)) {
        subjectMap.set(key, []);
      }
      subjectMap.get(key)!.push(p.percentage);
    });

    const subjectAverages = Array.from(subjectMap.entries()).map(
      ([code, pcts]) => ({
        subjectCode: code,
        average: parseFloat(
          (pcts.reduce((a, b) => a + b, 0) / pcts.length).toFixed(2)
        ),
        examsCount: pcts.length,
      })
    );

    // Get feedback count
    const { count: feedbackCount } = await supabase
      .from("feedback")
      .select("*", { count: "exact", head: true })
      .eq("student_id", studentId);

    return NextResponse.json({
      student: {
        id: student.id,
        rollNo: student.roll_no,
        name: (student.profiles as any)?.full_name ?? "N/A",
        semester: student.semester,
        batch: student.batch,
      },
      statistics: {
        totalExamsTaken: validMarks.length,
        overallAverage,
        highestScore: percentages.length > 0 ? Math.max(...percentages.map((p) => p.percentage)) : 0,
        lowestScore: percentages.length > 0 ? Math.min(...percentages.map((p) => p.percentage)) : 0,
        passCount: percentages.filter((p) => p.percentage >= 40).length,
        failCount: percentages.filter((p) => p.percentage < 40).length,
        feedbackReceived: feedbackCount ?? 0,
      },
      subjectAverages,
      recentExams: percentages.slice(0, 10),
    });
  } catch (error) {
    console.error("Student stats API error:", error);

    // 🔒 DON'T LEAK ERROR DETAILS
    return NextResponse.json(
      { error: "An error occurred while fetching student statistics" },
      { status: 500 }
    );
  }
}
