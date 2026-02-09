import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, BarChart3, Users, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-slate-800" />
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              AcadTrack
            </span>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-5xl px-6">
        <section className="py-20 space-y-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 max-w-2xl mx-auto leading-tight">
            Academic Intelligence for your College
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Track exams, monitor student progress, identify at-risk learners,
            and empower teachers with data-driven insights &mdash; all in one
            calm, clean platform.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button asChild size="lg">
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="grid sm:grid-cols-3 gap-8 pb-20">
          <FeatureCard
            icon={<BarChart3 className="h-5 w-5" />}
            title="Progress Tracking"
            desc="Trends, risk prediction, and learner classification — updated in real time as marks are entered."
          />
          <FeatureCard
            icon={<Users className="h-5 w-5" />}
            title="Role-Based Views"
            desc="Students see motivation. Teachers see class performance. HODs see department analytics."
          />
          <FeatureCard
            icon={<Shield className="h-5 w-5" />}
            title="Secure by Default"
            desc="Row-level security ensures every query only returns data the user is authorized to see."
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-muted-foreground">
        Internal academic platform &middot; Authorized personnel only
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-6 space-y-3">
      <div className="flex items-center gap-2 text-slate-800">
        {icon}
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
