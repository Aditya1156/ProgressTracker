"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ShieldCheck,
  BarChart3,
  Users,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Fetch profile to determine redirect
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role || "student";
      const rolePathMap: Record<string, string> = {
        principal: "/admin",
        hod: "/admin",
        teacher: "/teacher",
        class_coordinator: "/teacher",
        lab_assistant: "/teacher",
        parent: "/parent",
        student: "/student",
      };
      const path = rolePathMap[role] || "/student";

      router.push(path);
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-gradient-to-br from-[#060d1f] via-[#0f1b4c] to-[#1a1050] p-12 flex-col justify-between overflow-hidden">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Floating orbs */}
        <div
          className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-blue-500/[0.06] rounded-full blur-[100px] pointer-events-none"
          style={{ animation: "orb-float-1 20s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-[20%] right-[5%] w-[500px] h-[500px] bg-indigo-500/[0.05] rounded-full blur-[100px] pointer-events-none"
          style={{ animation: "orb-float-2 25s ease-in-out infinite" }}
        />
        <div
          className="absolute top-[60%] left-[40%] w-[300px] h-[300px] bg-red-500/[0.03] rounded-full blur-[80px] pointer-events-none"
          style={{
            animation: "orb-float-1 18s ease-in-out infinite reverse",
          }}
        />

        {/* Top - Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/pesitm.png"
              alt="PESITM"
              width={44}
              height={44}
              className="object-contain"
            />
            <div>
              <h1 className="text-base font-bold text-white tracking-wide group-hover:text-white/90 transition-colors">
                PESITM
              </h1>
              <p className="text-[10px] text-white/50 tracking-wider uppercase">
                Progress Tracker
              </p>
            </div>
          </Link>
        </div>

        {/* Center - Hero text */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-[1.15]">
            Your Academic
            <br />
            <span className="bg-gradient-to-r from-red-400 via-red-500 to-amber-400 bg-clip-text text-transparent">
              Command Center
            </span>
          </h2>
          <p className="text-white/40 text-lg leading-relaxed">
            Track performance, manage attendance, and access real-time insights
            &mdash; all in one platform.
          </p>

          {/* Feature pills */}
          <div className="flex flex-col gap-3 pt-2">
            {[
              {
                icon: BarChart3,
                text: "Real-time analytics & performance tracking",
              },
              {
                icon: Users,
                text: "Multi-role access for all stakeholders",
              },
              {
                icon: ShieldCheck,
                text: "Secure & role-based permission system",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-white/50 text-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-4 w-4 text-red-400/80" />
                </div>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom - footer text */}
        <div className="relative z-10">
          <p className="text-white/20 text-xs">
            &copy; 2026 PES Institute of Technology & Management, Shivamogga
          </p>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12 relative">
        {/* Subtle background accent */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#0f1b4c]/[0.02] rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-[420px] space-y-8 relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-2">
            <Image
              src="/pesitm.png"
              alt="PESITM"
              width={40}
              height={40}
              className="object-contain"
            />
            <div>
              <h1 className="text-base font-bold text-[#0f1b4c] tracking-wide">
                PESITM
              </h1>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase">
                Progress Tracker
              </p>
            </div>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[#0f1b4c]">Welcome back</h2>
            <p className="text-sm text-slate-500">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@pesitm.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="pl-10 h-12 bg-white border-slate-200 focus:border-[#0f1b4c] focus:ring-[#0f1b4c]/20 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="current-password"
                  className="pl-10 pr-11 h-12 bg-white border-slate-200 focus:border-[#0f1b4c] focus:ring-[#0f1b4c]/20 rounded-xl text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 rounded-xl text-sm font-medium transition-all duration-200"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Sign in
            </Button>
          </form>

          {/* Help text */}
          <p className="text-center text-sm text-slate-400">
            Contact your administrator if you need an account
          </p>

          {/* Footer */}
          <p className="text-center text-[11px] text-slate-400 pt-4">
            Internal platform &middot; Authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
}
