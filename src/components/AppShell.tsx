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
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import type { UserRole } from "@/lib/auth";

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
        { href: "/student/feedback", label: "Feedback", icon: <MessageSquare className="h-4 w-4" /> },
      ];
    case "teacher":
      return [
        { href: "/teacher", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
        { href: "/teacher/marks", label: "Enter Marks", icon: <ClipboardList className="h-4 w-4" /> },
        { href: "/teacher/students", label: "Students", icon: <Users className="h-4 w-4" /> },
        { href: "/teacher/feedback", label: "Feedback", icon: <MessageSquare className="h-4 w-4" /> },
      ];
    case "hod":
    case "principal":
      return [
        { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
        { href: "/admin/analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
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
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-60 border-r border-slate-200 bg-white flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-slate-200">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-slate-800" />
            <span className="font-semibold text-sm tracking-tight text-slate-900">
              AcadTrack
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-slate-100 text-slate-900 font-medium"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-slate-200 text-slate-700 text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user.fullName}
              </p>
              <p className="text-xs text-muted-foreground">{roleBadge}</p>
            </div>
          </div>
          <Separator className="my-3" />
          <form action="/auth/signout" method="POST">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-slate-600 hover:text-slate-900"
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
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="flex items-center h-14 px-4 border-b border-slate-200 bg-white lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded hover:bg-slate-100 -ml-2"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-3 font-semibold text-sm text-slate-900">
            AcadTrack
          </span>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
