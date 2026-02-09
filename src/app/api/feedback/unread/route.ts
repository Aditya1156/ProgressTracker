import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's student record if they're a student
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!student) {
      return NextResponse.json({ count: 0, feedback: [] });
    }

    // Get unread feedback count
    const { count, data: unreadFeedback } = await supabase
      .from("feedback")
      .select(
        `
        id,
        type,
        message,
        created_at,
        subjects (name, code),
        teachers (
          profiles (full_name)
        )
      `,
        { count: "exact" }
      )
      .eq("student_id", student.id)
      .eq("is_read", false)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      count: count ?? 0,
      feedback: unreadFeedback ?? [],
    });
  } catch (error) {
    console.error("Unread feedback API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { feedbackIds } = body;

    if (!feedbackIds || !Array.isArray(feedbackIds)) {
      return NextResponse.json(
        { error: "feedbackIds array is required" },
        { status: 400 }
      );
    }

    // Get student record
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Mark feedback as read
    const { error } = await supabase
      .from("feedback")
      .update({ is_read: true })
      .in("id", feedbackIds)
      .eq("student_id", student.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, marked: feedbackIds.length });
  } catch (error) {
    console.error("Mark feedback read API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
