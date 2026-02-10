import { getUser, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";

/**
 * SECURED Admin Layout
 * - Checks authentication
 * - Verifies admin role (HOD or Principal)
 * - Redirects unauthorized users
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  // 🔒 SECURITY: Check if user has admin role
  if (!isAdmin(user.role)) {
    // Redirect non-admins to their appropriate dashboard
    if (user.role === "teacher") {
      redirect("/teacher");
    } else {
      redirect("/student");
    }
  }

  return (
    <AppShell user={{ fullName: user.fullName, email: user.email, role: user.role }}>
      {children}
    </AppShell>
  );
}
