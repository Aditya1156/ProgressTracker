"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
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
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
        { href: "/student/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
      ];
    case "teacher":
    case "class_coordinator":
    case "lab_assistant":
      return [
        { href: "/teacher", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
        { href: "/teacher/marks", label: "Enter Marks", icon: <ClipboardList className="h-4 w-4" /> },
        { href: "/teacher/attendance", label: "Attendance", icon: <CalendarCheck className="h-4 w-4" /> },
        { href: "/teacher/students", label: "Students", icon: <Users className="h-4 w-4" /> },
        { href: "/teacher/feedback", label: "Feedback", icon: <MessageSquare className="h-4 w-4" /> },
        { href: "/teacher/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
      ];
    case "hod":
    case "principal":
      return [
        { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
        { href: "/admin/analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
        { href: "/admin/attendance", label: "Attendance", icon: <CalendarCheck className="h-4 w-4" /> },
        { href: "/admin/students", label: "Students", icon: <Users className="h-4 w-4" /> },
        { href: "/admin/exams", label: "Exams", icon: <BookOpen className="h-4 w-4" /> },
        { href: "/admin/teachers", label: "Teachers", icon: <UserCog className="h-4 w-4" /> },
        { href: "/admin/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
      ];
    case "parent":
      return [
        { href: "/parent", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
        { href: "/parent/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
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

  const roleBadgeMap: Record<string, string> = {
    principal: "Principal",
    hod: "HOD",
    teacher: "Teacher",
    class_coordinator: "Coordinator",
    lab_assistant: "Lab Assistant",
    student: "Student",
    parent: "Parent",
  };
  const roleBadge = roleBadgeMap[user.role] ?? "User";

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fc]">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-56 bg-white border-r border-gray-200/80 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/pesitm.png"
              alt="PESITM"
              width={30}
              height={30}
              className="object-contain"
            />
            <div className="leading-tight">
              <span className="font-bold text-[13px] text-[#0f1b4c] block">
                PESITM
              </span>
              <span className="text-[9px] text-gray-400 uppercase tracking-widest">
                Progress Tracker
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto glass-scrollbar">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all duration-150",
                  active
                    ? "bg-[#0f1b4c] text-white font-medium shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                )}
              >
                <span className={cn("flex-shrink-0", active ? "text-white/90" : "text-gray-400")}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-2.5 px-1 mb-2.5">
            <div className="h-8 w-8 rounded-full bg-[#0f1b4c] flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-medium text-white">
                {initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-gray-800 truncate">
                {user.fullName}
              </p>
              <p className="text-[11px] text-gray-400">{roleBadge}</p>
            </div>
          </div>
          <form action="/auth/signout" method="POST">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-400 hover:text-red-600 hover:bg-red-50 h-8 text-xs"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px] lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="flex items-center h-14 px-4 bg-white border-b border-gray-200/80 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md hover:bg-gray-100 -ml-1 transition-colors"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <div className="ml-3 flex items-center gap-2">
            <Image
              src="/pesitm.png"
              alt="PESITM"
              width={24}
              height={24}
              className="object-contain"
            />
            <span className="font-bold text-[13px] text-[#0f1b4c]">
              PESITM
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
