import { getUser } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileSettings from "@/components/settings/ProfileSettings";
import PasswordChange from "@/components/settings/PasswordChange";
import NotificationPreferences from "@/components/settings/NotificationPreferences";

export default async function ParentSettingsPage() {
  const user = await getUser();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage your profile and notification preferences
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
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

        <TabsContent value="notifications" className="mt-4">
          <NotificationPreferences userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
