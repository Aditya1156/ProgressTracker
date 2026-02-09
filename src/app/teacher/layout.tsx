import { getUser } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <AppShell user={{ fullName: user.fullName, email: user.email, role: user.role }}>
      {children}
    </AppShell>
  );
}
