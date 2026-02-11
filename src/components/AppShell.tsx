"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  MessageSquare,
  ClipboardList,
  CalendarCheck,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import type { UserRole } from "@/lib/auth";
import { PageTransition } from "@/components/motion";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case "student":
      return [
        { href: "/student", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
        { href: "/student/results", label: "Results", icon: <BookOpen className="h-4 w-4" /> },
        { href: "/student/attendance", label: "Attendance", icon: <CalendarCheck className="h-4 w-4" /> },
        { href: "/student/feedback", label: "Feedback", icon: <MessageSquare className="h-4 w-4" /> },
      ];
    case "teacher":
      return [
        { href: "/teacher", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
        { href: "/teacher/marks", label: "Enter Marks", icon: <ClipboardList className="h-4 w-4" /> },
        { href: "/teacher/attendance", label: "Attendance", icon: <CalendarCheck className="h-4 w-4" /> },
        { href: "/teacher/students", label: "Students", icon: <Users className="h-4 w-4" /> },
        { href: "/teacher/feedback", label: "Feedback", icon: <MessageSquare className="h-4 w-4" /> },
      ];
    case "hod":
    case "principal":
      return [
        { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
        { href: "/admin/analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
        { href: "/admin/attendance", label: "Attendance", icon: <CalendarCheck className="h-4 w-4" /> },
        { href: "/admin/students", label: "Students", icon: <Users className="h-4 w-4" /> },
        { href: "/admin/exams", label: "Exams", icon: <BookOpen className="h-4 w-4" /> },
        { href: "/admin/teachers", label: "Teachers", icon: <Settings className="h-4 w-4" /> },
      ];
    default:
      return [];
  }
}

interface AppShellProps {
  children: React.ReactNode;
  user: {
    fullName: string;
    email: string;
    role: UserRole;
  };
}

export default function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();
  const navItems = getNavItems(user.role);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleBadge =
    user.role === "principal"
      ? "Principal"
      : user.role === "hod"
      ? "HOD"
      : user.role === "teacher"
      ? "Teacher"
      : "Student";

  return (
    <div className="flex h-screen overflow-hidden gradient-mesh">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-60 glass-sidebar flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-[var(--glass-border)]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-sm tracking-tight gradient-text">
              AcadTrack
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/30 dark:hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto glass-scrollbar">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary font-medium border border-primary/20 shadow-glass-sm"
                    : "text-muted-foreground hover:bg-white/40 dark:hover:bg-white/5 hover:text-foreground"
                )}
              >
                <span className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-lg transition-colors",
                  active ? "text-primary" : ""
                )}>
                  {item.icon}
                </span>
                {item.label}
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-[var(--glass-border)] p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {user.fullName}
              </p>
              <p className="text-xs text-muted-foreground">{roleBadge}</p>
            </div>
          </div>
          <div className="border-t border-[var(--glass-border)] my-3" />
          <form action="/auth/signout" method="POST">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="flex items-center h-14 px-4 glass-strong border-b border-[var(--glass-border)] lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-white/30 dark:hover:bg-white/10 -ml-2 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-3 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm gradient-text">
              AcadTrack
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 glass-scrollbar">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
