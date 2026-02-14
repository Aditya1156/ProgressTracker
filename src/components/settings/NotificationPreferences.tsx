"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface NotificationSettings {
  marks_published: boolean;
  feedback_received: boolean;
  attendance_alert: boolean;
  system_announcements: boolean;
}

interface Preferences {
  email_notifications: boolean;
  in_app_notifications: boolean;
  notification_settings: NotificationSettings;
}

const DEFAULT_PREFS: Preferences = {
  email_notifications: true,
  in_app_notifications: true,
  notification_settings: {
    marks_published: true,
    feedback_received: true,
    attendance_alert: true,
    system_announcements: true,
  },
};

const NOTIFICATION_LABELS: Record<keyof NotificationSettings, { label: string; description: string }> = {
  marks_published: { label: "Marks Published", description: "When new exam results are available" },
  feedback_received: { label: "Feedback Received", description: "When a teacher sends you feedback" },
  attendance_alert: { label: "Attendance Alerts", description: "Low attendance warnings" },
  system_announcements: { label: "System Announcements", description: "Important institution-wide updates" },
};

interface NotificationPreferencesProps {
  userId: string;
}

export default function NotificationPreferences({ userId }: NotificationPreferencesProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [prefsId, setPrefsId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("user_preferences")
        .select("id, email_notifications, in_app_notifications, notification_settings")
        .eq("user_id", userId)
        .single();

      if (data) {
        setPrefsId(data.id);
        setPrefs({
          email_notifications: data.email_notifications,
          in_app_notifications: data.in_app_notifications,
          notification_settings: data.notification_settings as NotificationSettings,
        });
      }
      setLoading(false);
    }
    load();
  }, [userId, supabase]);

  async function updatePref(updates: Partial<Preferences>) {
    const newPrefs = { ...prefs, ...updates };
    setPrefs(newPrefs);

    const payload = {
      user_id: userId,
      email_notifications: newPrefs.email_notifications,
      in_app_notifications: newPrefs.in_app_notifications,
      notification_settings: newPrefs.notification_settings,
    };

    if (prefsId) {
      const { error } = await supabase
        .from("user_preferences")
        .update(payload)
        .eq("id", prefsId);
      if (error) toast.error("Failed to save");
    } else {
      const { data, error } = await supabase
        .from("user_preferences")
        .insert(payload)
        .select("id")
        .single();
      if (error) {
        toast.error("Failed to save");
      } else if (data) {
        setPrefsId(data.id);
      }
    }
  }

  function toggleNotifSetting(key: keyof NotificationSettings) {
    const newSettings = {
      ...prefs.notification_settings,
      [key]: !prefs.notification_settings[key],
    };
    updatePref({ notification_settings: newSettings });
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
          <Bell className="h-4 w-4 text-gray-400" />
          <CardTitle className="text-base">Notification Preferences</CardTitle>
        </div>
        <CardDescription>Choose how you want to be notified</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global toggles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Email Notifications</Label>
              <p className="text-xs text-gray-400">Receive notifications via email</p>
            </div>
            <Switch
              checked={prefs.email_notifications}
              onCheckedChange={(checked) => updatePref({ email_notifications: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">In-App Notifications</Label>
              <p className="text-xs text-gray-400">Show notifications in the dashboard</p>
            </div>
            <Switch
              checked={prefs.in_app_notifications}
              onCheckedChange={(checked) => updatePref({ in_app_notifications: checked })}
            />
          </div>
        </div>

        <Separator />

        {/* Specific notification types */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            Notification Types
          </p>
          {(Object.entries(NOTIFICATION_LABELS) as [keyof NotificationSettings, { label: string; description: string }][]).map(
            ([key, { label, description }]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">{label}</Label>
                  <p className="text-xs text-gray-400">{description}</p>
                </div>
                <Switch
                  checked={prefs.notification_settings[key]}
                  onCheckedChange={() => toggleNotifSetting(key)}
                />
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
