import Link from "next/link";
import { GraduationCap, BarChart3, Users, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <GraduationCap size={32} className="text-blue-400" />
          <span className="text-xl font-bold">ProgressTracker</span>
        </div>
        <Link
          href="/login"
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Sign In
        </Link>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight">
          College Exam &<br />
          <span className="text-blue-400">Progress Tracker</span>
        </h1>
        <p className="mt-6 text-xl text-slate-300 max-w-2xl mx-auto">
          A unified platform for teachers to track student performance, identify learning patterns,
          and help every student achieve their potential.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3.5 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
          >
            Get Started →
          </Link>
        </div>

        {/* Feature cards */}
        <div className="mt-24 grid md:grid-cols-3 gap-8 text-left">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <Users className="text-blue-400" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Student Management</h3>
            <p className="mt-2 text-slate-300">
              Add, edit, and manage student records. Search by department, batch, or roll number.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="text-green-400" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Smart Analytics</h3>
            <p className="mt-2 text-slate-300">
              Auto-classify learners, detect performance trends, and predict at-risk students.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <Shield className="text-purple-400" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Role-Based Access</h3>
            <p className="mt-2 text-slate-300">
              Separate dashboards for admins and students with secure authentication.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 text-center text-slate-400 border-t border-slate-700/50">
        <p>© 2026 ProgressTracker. Built with Next.js, Prisma & TypeScript.</p>
      </footer>
    </div>
  );
}
