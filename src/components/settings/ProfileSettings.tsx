"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { profileUpdateSchema, type ProfileUpdateData } from "@/lib/settings-validation";
import type { UserRole } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Loader2, Save, User } from "lucide-react";
import { toast } from "sonner";
import AvatarUpload from "./AvatarUpload";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  principal: { label: "Principal", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400" },
  hod: { label: "HOD", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  teacher: { label: "Teacher", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
  class_coordinator: { label: "Coordinator", color: "bg-teal-500/10 text-teal-700 dark:text-teal-400" },
  lab_assistant: { label: "Lab Assistant", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400" },
  student: { label: "Student", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400" },
  parent: { label: "Parent", color: "bg-pink-500/10 text-pink-700 dark:text-pink-400" },
};

interface ProfileSettingsProps {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export default function ProfileSettings({ userId, fullName, email, role, avatarUrl }: ProfileSettingsProps) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileUpdateData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: { full_name: fullName },
  });

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleInfo = ROLE_LABELS[role] ?? { label: role, color: "" };

  async function onSubmit(data: ProfileUpdateData) {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: data.full_name })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to update profile: " + error.message);
    } else {
      toast.success("Profile updated");
    }
    setSaving(false);
  }

  return (
    <Card className="border-gray-200/80 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <CardTitle className="text-base">Profile Information</CardTitle>
        </div>
        <CardDescription>Manage your personal details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar */}
        <AvatarUpload
          userId={userId}
          currentUrl={currentAvatar}
          initials={initials}
          onUploaded={setCurrentAvatar}
        />

        <Separator />

        {/* Profile Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              {...register("full_name")}
              className={errors.full_name ? "border-red-500" : ""}
            />
            {errors.full_name && (
              <div className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" />
                {errors.full_name.message}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} disabled className="opacity-60" />
            <p className="text-xs text-gray-400">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <div>
              <Badge variant="secondary" className={`border-0 ${roleInfo.color}`}>
                {roleInfo.label}
              </Badge>
            </div>
          </div>

          <Button type="submit" disabled={saving || !isDirty}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
