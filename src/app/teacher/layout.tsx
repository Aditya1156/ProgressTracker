import { getUser, canManageAcademics } from "@/lib/auth";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";

/**
 * SECURED Teacher Layout
 * - Checks authentication
 * - Verifies teacher/admin role
 * - Redirects unauthorized users
 */
export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  // 🔒 SECURITY: Only teachers, HODs, and principals can access
  if (!canManageAcademics(user.role)) {
    redirect("/student");
  }

  return (
    <AppShell user={{ fullName: user.fullName, email: user.email, role: user.role }}>
      {children}
    </AppShell>
  );
}
