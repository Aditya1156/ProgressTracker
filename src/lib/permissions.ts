import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/auth";

export type Permission =
  | "can_export"
  | "can_delete"
  | "can_manage_subjects"
  | "can_manage_exams"
  | "can_enter_marks"
  | "can_view_analytics"
  | "can_manage_attendance"
  | "can_give_feedback"
  | "can_manage_users";

export const ALL_PERMISSIONS: Permission[] = [
  "can_export",
  "can_delete",
  "can_manage_subjects",
  "can_manage_exams",
  "can_enter_marks",
  "can_view_analytics",
  "can_manage_attendance",
  "can_give_feedback",
  "can_manage_users",
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  can_export: "Export Data",
  can_delete: "Delete Records",
  can_manage_subjects: "Manage Subjects",
  can_manage_exams: "Manage Exams",
  can_enter_marks: "Enter Marks",
  can_view_analytics: "View Analytics",
  can_manage_attendance: "Manage Attendance",
  can_give_feedback: "Give Feedback",
  can_manage_users: "Manage Users",
};

/** Fetch all permissions for a role (server-side) */
export async function getUserPermissions(role: UserRole): Promise<Record<Permission, boolean>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("role_permissions")
    .select("permission, granted")
    .eq("role", role);

  const perms: Record<string, boolean> = {};
  for (const perm of ALL_PERMISSIONS) {
    perms[perm] = false;
  }
  for (const row of data ?? []) {
    perms[row.permission] = row.granted;
  }
  return perms as Record<Permission, boolean>;
}

/** Check a single permission for a role (server-side) */
export async function hasPermission(role: UserRole, permission: Permission): Promise<boolean> {
  const perms = await getUserPermissions(role);
  return perms[permission] ?? false;
}
