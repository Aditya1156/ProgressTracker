import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (user.role !== "parent") {
    redirect("/student");
  }

  return (
    <AppShell user={{ fullName: user.fullName, email: user.email, role: user.role }}>
      {children}
    </AppShell>
  );
}
