import { getUser, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileSettings from "@/components/settings/ProfileSettings";
import PasswordChange from "@/components/settings/PasswordChange";
import NotificationPreferences from "@/components/settings/NotificationPreferences";
import SystemSettings from "@/components/settings/SystemSettings";
import UserManagement from "@/components/settings/UserManagement";
import RolePermissionsManager from "@/components/settings/RolePermissionsManager";

export default async function AdminSettingsPage() {
  const user = await getUser();

  if (!isAdmin(user.role)) {
    redirect("/student");
  }

  const isPrincipal = user.role === "principal";

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage system configuration, users, and permissions
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          {isPrincipal && <TabsTrigger value="permissions">Permissions</TabsTrigger>}
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 space-y-6">
          <ProfileSettings
            userId={user.id}
            fullName={user.fullName}
            email={user.email}
            role={user.role}
            avatarUrl={user.avatarUrl}
          />
          <PasswordChange />
        </TabsContent>

        <TabsContent value="system" className="mt-4">
          <SystemSettings />
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <UserManagement />
        </TabsContent>

        {isPrincipal && (
          <TabsContent value="permissions" className="mt-4">
            <RolePermissionsManager />
          </TabsContent>
        )}

        <TabsContent value="notifications" className="mt-4">
          <NotificationPreferences userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
