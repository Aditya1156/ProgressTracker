import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidRole } from "@/lib/validation";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

  let query = supabase
    .from("role_permissions")
    .select("id, role, permission, granted")
    .order("role");

  if (role && isValidRole(role)) {
    query = query.eq("role", role);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "principal") {
    return NextResponse.json({ error: "Only principals can modify permissions" }, { status: 403 });
  }

  const body = await request.json();
  const { id, granted } = body;

  if (!id || typeof granted !== "boolean") {
    return NextResponse.json({ error: "Missing id or granted" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("role_permissions")
    .update({ granted })
    .eq("id", id)
    .select("id, role, permission, granted")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
