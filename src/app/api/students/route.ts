import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidUUID, sanitizeString } from "@/lib/validation";

async function getCallerDept(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (!profile || !["hod", "principal"].includes(profile.role)) {
    return null;
  }

  let departmentId: string | null = null;
  if (profile.role === "hod") {
    const { data: teacher } = await supabase
      .from("teachers")
      .select("department_id")
      .eq("profile_id", userId)
      .single();
    departmentId = teacher?.department_id ?? null;
  }

  return { role: profile.role as string, departmentId };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const caller = await getCallerDept(supabase, user.id);
  if (!caller) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const full_name = sanitizeString(body.full_name);
  const roll_no = sanitizeString(body.roll_no)?.toUpperCase();
  const batch = sanitizeString(body.batch);
  const semester = Number(body.semester);
  const section = sanitizeString(body.section)?.toUpperCase();
  const is_lateral = Boolean(body.is_lateral);
  const department_id = caller.departmentId ?? body.department_id;

  // Validate
  if (!full_name) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  }
  if (!roll_no || !/^[0-9A-Z]+$/.test(roll_no)) {
    return NextResponse.json({ error: "Valid USN/Roll No is required" }, { status: 400 });
  }
  if (!batch || !/^\d{4}$/.test(batch)) {
    return NextResponse.json({ error: "Valid batch year is required" }, { status: 400 });
  }
  if (!semester || semester < 1 || semester > 8) {
    return NextResponse.json({ error: "Semester must be 1-8" }, { status: 400 });
  }
  if (!section || !/^[A-E]$/.test(section)) {
    return NextResponse.json({ error: "Section must be A-E" }, { status: 400 });
  }
  if (!is_lateral && semester > 1) {
    return NextResponse.json(
      { error: "Non-lateral entry students must start at Semester 1" },
      { status: 400 }
    );
  }
  if (!department_id || !isValidUUID(department_id)) {
    return NextResponse.json({ error: "Department is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const email = roll_no.toLowerCase() + "@college.edu";

  // 1. Create auth user
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    password: "student123",
    email_confirm: true,
    user_metadata: { full_name, role: "student" },
  });

  if (authErr) {
    if (authErr.message?.includes("already been registered")) {
      return NextResponse.json({ error: "This USN/email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: authErr.message }, { status: 500 });
  }

  const userId = authData.user.id;

  // 2. Upsert profile
  const { error: profErr } = await admin.from("profiles").upsert({
    id: userId,
    full_name,
    email,
    role: "student",
  });

  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  // 3. Insert student record
  const { data: student, error: stuErr } = await admin
    .from("students")
    .insert({
      profile_id: userId,
      roll_no,
      department_id,
      batch,
      semester,
      section,
    })
    .select("id")
    .single();

  if (stuErr) {
    if (stuErr.message?.includes("duplicate") || stuErr.message?.includes("unique")) {
      return NextResponse.json({ error: "This USN already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: stuErr.message }, { status: 500 });
  }

  return NextResponse.json({ id: student.id, roll_no, email }, { status: 201 });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const caller = await getCallerDept(supabase, user.id);
  if (!caller) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const studentId = body.student_id;

  if (!studentId || !isValidUUID(studentId)) {
    return NextResponse.json({ error: "Valid student_id is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch current student
  const { data: student, error: fetchErr } = await admin
    .from("students")
    .select("id, profile_id, department_id, roll_no")
    .eq("id", studentId)
    .single();

  if (fetchErr || !student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  if (caller.role === "hod" && caller.departmentId !== student.department_id) {
    return NextResponse.json({ error: "Cannot edit student from another department" }, { status: 403 });
  }

  // Build student update
  const studentUpdate: Record<string, any> = {};
  if (body.semester !== undefined) {
    const sem = Number(body.semester);
    if (sem < 1 || sem > 8) {
      return NextResponse.json({ error: "Semester must be 1-8" }, { status: 400 });
    }
    studentUpdate.semester = sem;
  }
  if (body.section !== undefined) {
    const sec = sanitizeString(body.section)?.toUpperCase();
    if (!sec || !/^[A-E]$/.test(sec)) {
      return NextResponse.json({ error: "Section must be A-E" }, { status: 400 });
    }
    studentUpdate.section = sec;
  }
  if (body.batch !== undefined) {
    const batch = sanitizeString(body.batch);
    if (!batch || !/^\d{4}$/.test(batch)) {
      return NextResponse.json({ error: "Valid batch year is required" }, { status: 400 });
    }
    studentUpdate.batch = batch;
  }
  if (body.roll_no !== undefined) {
    const roll = sanitizeString(body.roll_no)?.toUpperCase();
    if (!roll || !/^[0-9A-Z]+$/.test(roll)) {
      return NextResponse.json({ error: "Valid USN is required" }, { status: 400 });
    }
    studentUpdate.roll_no = roll;
  }

  // Update student record
  if (Object.keys(studentUpdate).length > 0) {
    const { error: stuErr } = await admin
      .from("students")
      .update(studentUpdate)
      .eq("id", studentId);

    if (stuErr) {
      if (stuErr.message?.includes("duplicate") || stuErr.message?.includes("unique")) {
        return NextResponse.json({ error: "This USN already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: stuErr.message }, { status: 500 });
    }
  }

  // Update profile name if provided
  if (body.full_name !== undefined) {
    const name = sanitizeString(body.full_name);
    if (!name) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    const { error: profErr } = await admin
      .from("profiles")
      .update({ full_name: name })
      .eq("id", student.profile_id);

    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 });
    }
  }

  // Update email if roll_no changed
  if (studentUpdate.roll_no && studentUpdate.roll_no !== student.roll_no) {
    const newEmail = studentUpdate.roll_no.toLowerCase() + "@college.edu";
    await admin.from("profiles").update({ email: newEmail }).eq("id", student.profile_id);
    await admin.auth.admin.updateUserById(student.profile_id, { email: newEmail });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const caller = await getCallerDept(supabase, user.id);
  if (!caller) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const studentId = body.student_id;

  if (!studentId || !isValidUUID(studentId)) {
    return NextResponse.json({ error: "Valid student_id is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch student to get profile_id and verify department
  const { data: student, error: fetchErr } = await admin
    .from("students")
    .select("id, profile_id, department_id")
    .eq("id", studentId)
    .single();

  if (fetchErr || !student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // HOD can only delete students in their own department
  if (caller.role === "hod" && caller.departmentId !== student.department_id) {
    return NextResponse.json({ error: "Cannot remove student from another department" }, { status: 403 });
  }

  // Delete auth user — cascades to profiles → students → marks/attendance/feedback
  const { error: delErr } = await admin.auth.admin.deleteUser(student.profile_id);

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
