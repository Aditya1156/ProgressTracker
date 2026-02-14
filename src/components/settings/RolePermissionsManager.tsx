"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type Permission =
  | "can_export"
  | "can_delete"
  | "can_manage_subjects"
  | "can_manage_exams"
  | "can_enter_marks"
  | "can_view_analytics"
  | "can_manage_attendance"
  | "can_give_feedback"
  | "can_manage_users";

const ALL_PERMISSIONS: Permission[] = [
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

const PERMISSION_LABELS: Record<Permission, string> = {
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

const MANAGEABLE_ROLES: { value: UserRole; label: string }[] = [
  { value: "teacher", label: "Teacher" },
  { value: "class_coordinator", label: "Coordinator" },
  { value: "lab_assistant", label: "Lab Assistant" },
  { value: "hod", label: "HOD" },
  { value: "student", label: "Student" },
  { value: "parent", label: "Parent" },
];

interface PermRow {
  id: string;
  role: string;
  permission: string;
  granted: boolean;
}

export default function RolePermissionsManager() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<PermRow[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("id, role, permission, granted")
        .order("role");

      if (error) {
        toast.error("Failed to load permissions");
      } else {
        setPermissions((data ?? []) as PermRow[]);
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function togglePermission(row: PermRow) {
    const key = `${row.role}-${row.permission}`;
    setUpdating(key);

    // Optimistic update
    setPermissions((prev) =>
      prev.map((p) => (p.id === row.id ? { ...p, granted: !p.granted } : p))
    );

    const { error } = await supabase
      .from("role_permissions")
      .update({ granted: !row.granted })
      .eq("id", row.id);

    if (error) {
      // Revert
      setPermissions((prev) =>
        prev.map((p) => (p.id === row.id ? { ...p, granted: row.granted } : p))
      );
      toast.error("Failed to update permission");
    }

    setUpdating(null);
  }

  function getPermsForRole(role: string): Map<Permission, PermRow> {
    const map = new Map<Permission, PermRow>();
    for (const row of permissions) {
      if (row.role === role) {
        map.set(row.permission as Permission, row);
      }
    }
    return map;
  }

  if (loading) {
    return (
      <Card className="border-gray-200/80 shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200/80 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-gray-400" />
          <CardTitle className="text-base">Role Permissions</CardTitle>
        </div>
        <CardDescription>
          Configure what each role can do. Principal permissions cannot be modified.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={MANAGEABLE_ROLES[0].value}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            {MANAGEABLE_ROLES.map((r) => (
              <TabsTrigger key={r.value} value={r.value} className="text-xs">
                {r.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {MANAGEABLE_ROLES.map((role) => {
            const rolePerms = getPermsForRole(role.value);
            return (
              <TabsContent key={role.value} value={role.value} className="mt-4 space-y-3">
                {ALL_PERMISSIONS.map((perm) => {
                  const row = rolePerms.get(perm);
                  const key = `${role.value}-${perm}`;
                  const isUpdating = updating === key;

                  return (
                    <div key={perm} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div>
                          <Label className="text-sm font-medium">
                            {PERMISSION_LABELS[perm]}
                          </Label>
                          <p className="text-xs text-gray-400">{perm}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {row?.granted ? (
                          <Badge variant="secondary" className="border-0 bg-green-500/10 text-green-700 dark:text-green-400 text-xs">
                            Granted
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="border-0 bg-red-500/10 text-red-700 dark:text-red-400 text-xs">
                            Denied
                          </Badge>
                        )}
                        {row ? (
                          <Switch
                            checked={row.granted}
                            onCheckedChange={() => togglePermission(row)}
                            disabled={isUpdating}
                          />
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
