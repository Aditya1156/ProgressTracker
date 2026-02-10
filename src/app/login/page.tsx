"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: email.split("@")[0] } },
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      toast.success("Account created. Check your email for verification.");
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
      const path =
        role === "principal" || role === "hod"
          ? "/admin"
          : role === "teacher"
          ? "/teacher"
          : "/student";

      router.push(path);
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <div className="gradient-mesh min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-orb-1 pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-orb-2 pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <GraduationCap className="h-8 w-8 text-slate-800" />
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              AcadTrack
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            College Academic Intelligence Platform
          </p>
        </div>

        {/* Card */}
        <Card className="glass-strong rounded-3xl shadow-glass-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">
              {mode === "login" ? "Sign in" : "Create account"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Enter your college email to continue"
                : "Register with your college email"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "login" ? "Sign in" : "Create account"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  No account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Internal platform. Authorized personnel only.
        </p>
      </div>
    </div>
  );
}
