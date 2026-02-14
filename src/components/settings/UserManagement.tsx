"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Shield, Users } from "lucide-react";
import { toast } from "sonner";

const ALL_ROLES: UserRole[] = [
  "student", "teacher", "class_coordinator", "lab_assistant", "hod", "principal", "parent",
];

const ROLE_COLORS: Record<string, string> = {
  principal: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  hod: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  teacher: "bg-green-500/10 text-green-700 dark:text-green-400",
  class_coordinator: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
  lab_assistant: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  student: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  parent: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
};

const ROLE_LABELS: Record<string, string> = {
  principal: "Principal",
  hod: "HOD",
  teacher: "Teacher",
  class_coordinator: "Coordinator",
  lab_assistant: "Lab Assistant",
  student: "Student",
  parent: "Parent",
};

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export default function UserManagement() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Role change dialog
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("student");
  const [changing, setChanging] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (roleFilter !== "all") {
      query = query.eq("role", roleFilter);
    }

    const { data, error } = await query;
    if (error) {
      toast.error("Failed to load users");
    } else {
      setUsers((data ?? []) as UserProfile[]);
    }
    setLoading(false);
  }, [supabase, roleFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  async function handleRoleChange() {
    if (!editUser) return;
    setChanging(true);

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", editUser.id);

    if (error) {
      toast.error("Failed to change role: " + error.message);
    } else {
      toast.success(`${editUser.full_name} is now ${ROLE_LABELS[newRole]}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === editUser.id ? { ...u, role: newRole } : u))
      );
      setEditUser(null);
    }
    setChanging(false);
  }

  return (
    <Card className="border-gray-200/80 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-400" />
          <CardTitle className="text-base">User Management</CardTitle>
        </div>
        <CardDescription>View and manage user accounts and roles</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ALL_ROLES.map((r) => (
                <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Users table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No users found.</p>
        ) : (
          <div className="max-h-[500px] overflow-y-auto glass-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell className="text-sm text-gray-400">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`border-0 text-xs ${ROLE_COLORS[u.role] ?? ""}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditUser(u);
                          setNewRole(u.role);
                        }}
                      >
                        <Shield className="mr-1 h-3.5 w-3.5" />
                        Change Role
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <p className="text-xs text-gray-400 text-right">
          Showing {filteredUsers.length} of {users.length} users
        </p>
      </CardContent>

      {/* Role Change Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for <strong>{editUser?.full_name}</strong> ({editUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Role</Label>
              <Badge variant="secondary" className={`border-0 ${ROLE_COLORS[editUser?.role ?? ""] ?? ""}`}>
                {ROLE_LABELS[editUser?.role ?? ""] ?? editUser?.role}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button
              onClick={handleRoleChange}
              disabled={changing || newRole === editUser?.role}
              className="btn-ripple"
            >
              {changing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
