import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type UserRole = "student" | "teacher" | "hod" | "principal" | "class_coordinator" | "lab_assistant" | "parent";

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
}

/** Get current authenticated user with profile. Redirects to /login if not found. */
export async function getUser(): Promise<AppUser> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_url")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email!,
    fullName: profile?.full_name ?? "User",
    role: (profile?.role as UserRole) ?? "student",
    avatarUrl: profile?.avatar_url,
  };
}

/** Get user role without redirect – returns null if not logged in */
export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return (profile?.role as UserRole) ?? null;
}

/** Dashboard path by role */
export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case "principal":
    case "hod":
      return "/admin";
    case "teacher":
    case "class_coordinator":
    case "lab_assistant":
      return "/teacher";
    case "parent":
      return "/parent";
    case "student":
    default:
      return "/student";
  }
}

/** Settings path by role */
export function getSettingsPath(role: UserRole): string {
  switch (role) {
    case "principal":
    case "hod":
      return "/admin/settings";
    case "teacher":
    case "class_coordinator":
    case "lab_assistant":
      return "/teacher/settings";
    case "parent":
      return "/parent/settings";
    case "student":
    default:
      return "/student/settings";
  }
}

/** Check if role has admin-level access */
export function isAdmin(role: UserRole): boolean {
  return role === "hod" || role === "principal";
}

/** Check if role can manage marks and exams */
export function canManageAcademics(role: UserRole): boolean {
  return ["teacher", "hod", "principal", "class_coordinator", "lab_assistant"].includes(role);
}
