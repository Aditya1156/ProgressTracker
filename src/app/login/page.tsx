"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        // Fetch session to determine role-based redirect
        const res = await fetch("/api/auth/session");
        const session = await res.json();

        if (session?.user?.role === "ADMIN") {
          router.push("/dashboard");
        } else {
          router.push("/student");
        }
        router.refresh();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 text-white mb-2">
            <GraduationCap size={36} className="text-blue-400" />
            <span className="text-2xl font-bold">ProgressTracker</span>
          </div>
          <p className="text-slate-400">Sign in to your account</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-8 space-y-6"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="you@college.edu"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          {/* Demo credentials */}
          <div className="border-t pt-4">
            <p className="text-xs text-slate-500 text-center mb-3">Demo Credentials</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => { setEmail("admin@college.edu"); setPassword("admin123"); }}
                className="border border-slate-200 rounded-lg p-2 hover:bg-slate-50 transition-colors"
              >
                <p className="font-medium text-slate-700">Admin</p>
                <p className="text-slate-400">admin@college.edu</p>
              </button>
              <button
                type="button"
                onClick={() => { setEmail("rahul@college.edu"); setPassword("student123"); }}
                className="border border-slate-200 rounded-lg p-2 hover:bg-slate-50 transition-colors"
              >
                <p className="font-medium text-slate-700">Student</p>
                <p className="text-slate-400">rahul@college.edu</p>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
