import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      !profile ||
      !["hod", "principal", "teacher"].includes(profile.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const subjectId = searchParams.get("subjectId");
    const departmentId = searchParams.get("departmentId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Build query
    let query = supabase
      .from("attendance")
      .select(
        `
        date, status, remarks,
        students(roll_no, semester, department_id, profiles(full_name)),
        subjects(name, code, department_id)
      `
      )
      .order("date", { ascending: false });

    if (subjectId) query = query.eq("subject_id", subjectId);
    if (dateFrom) query = query.gte("date", dateFrom);
    if (dateTo) query = query.lte("date", dateTo);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch attendance" },
        { status: 500 }
      );
    }

    // Client-side department filter
    let filtered = data ?? [];
    if (departmentId) {
      filtered = filtered.filter(
        (r: any) => r.students?.department_id === departmentId
      );
    }

    const exportData = filtered.map((r: any) => ({
      rollNo: r.students?.roll_no ?? "N/A",
      studentName: r.students?.profiles?.full_name ?? "N/A",
      subject: r.subjects?.name ?? "N/A",
      subjectCode: r.subjects?.code ?? "N/A",
      date: r.date,
      status: r.status,
      remarks: r.remarks ?? "",
    }));

    return NextResponse.json({ count: exportData.length, data: exportData });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
