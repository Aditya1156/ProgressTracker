"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Award,
  Users,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  Star,
  BarChart3,
  Shield,
  ArrowRight,
  ClipboardCheck,
  FileText,
  Activity,
  Bell,
  MapPin,
  Phone,
  Mail,
  GraduationCap,
} from "lucide-react";
import { useState, useEffect } from "react";

const stats = [
  { number: "25+", label: "Years of Excellence", icon: Star },
  { number: "5000+", label: "Students Enrolled", icon: Users },
  { number: "200+", label: "Expert Faculty", icon: Award },
  { number: "95%", label: "Placement Rate", icon: TrendingUp },
];

const features = [
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description:
      "Interactive dashboards with comprehensive performance reports and trend analysis",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    icon: ClipboardCheck,
    title: "Attendance Tracking",
    description:
      "Automated attendance management with instant alerts for parents and administrators",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    icon: FileText,
    title: "Exam Management",
    description:
      "Streamlined exam scheduling, mark entry, and automated grade computation",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description:
      "Secure multi-role access for students, teachers, HODs, coordinators, and parents",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Activity,
    title: "Performance Insights",
    description:
      "Identify trends, at-risk students, and areas for improvement with smart analytics",
    gradient: "from-rose-500 to-red-600",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "Customizable alerts for marks, attendance, exams, and important announcements",
    gradient: "from-cyan-500 to-blue-600",
  },
];

const accreditations = [
  "AICTE Approved",
  "VTU Affiliated",
  "NBA Accredited",
  "NAAC A+ Grade",
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  const heroSlides = [
    {
      title: "Academic Excellence,",
      highlight: "Reimagined",
      subtitle:
        "A comprehensive platform for tracking, analyzing, and elevating student performance at PESITM",
    },
    {
      title: "Data-Driven",
      highlight: "Decisions",
      subtitle:
        "Real-time analytics and insights for every stakeholder in the academic ecosystem",
    },
    {
      title: "Empowering",
      highlight: "Educators & Students",
      subtitle:
        "Streamlined tools for attendance, marks, exams, and holistic progress tracking",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* ===== HEADER ===== */}
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#0a1128]/95 backdrop-blur-xl shadow-2xl shadow-black/20 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/pesitm.png"
              alt="PESITM Logo"
              width={44}
              height={44}
              className="object-contain"
            />
            <div>
              <h1 className="text-base font-bold text-white tracking-wide">
                PESITM
              </h1>
              <p className="text-[10px] text-white/60 tracking-wider uppercase">
                Progress Tracker
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
              <a
                href="#features"
                className="hover:text-white transition-colors"
              >
                Features
              </a>
              <a href="#about" className="hover:text-white transition-colors">
                About
              </a>
            </nav>
            <Button
              asChild
              className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg shadow-red-600/25 px-6"
            >
              <Link href="/login">Portal Login</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#060d1f] via-[#0f1b4c] to-[#1a1050]" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Floating orbs */}
        <div
          className="absolute top-1/4 left-[10%] w-[500px] h-[500px] bg-blue-500/[0.07] rounded-full blur-[120px] pointer-events-none"
          style={{ animation: "orb-float-1 20s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-1/4 right-[5%] w-[600px] h-[600px] bg-indigo-500/[0.05] rounded-full blur-[120px] pointer-events-none"
          style={{ animation: "orb-float-2 25s ease-in-out infinite" }}
        />
        <div
          className="absolute top-[60%] left-[50%] w-[400px] h-[400px] bg-red-500/[0.04] rounded-full blur-[100px] pointer-events-none"
          style={{ animation: "orb-float-1 18s ease-in-out infinite reverse" }}
        />

        {/* Diagonal accent */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-full h-full border-l border-b border-white/20 rounded-bl-[200px] transform rotate-12 translate-x-1/3 -translate-y-1/4" />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-6 pt-32 pb-24 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              {/* Accreditation badges */}
              <div className="flex flex-wrap gap-2 animate-fade-in">
                {accreditations.map((acc, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/60 backdrop-blur-sm"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    {acc}
                  </span>
                ))}
              </div>

              {/* Title slider */}
              <div className="relative min-h-[220px] md:min-h-[240px]">
                {heroSlides.map((slide, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                      index === currentSlide
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-8 pointer-events-none"
                    }`}
                  >
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1]">
                      {slide.title}
                      <br />
                      <span className="bg-gradient-to-r from-red-400 via-red-500 to-amber-400 bg-clip-text text-transparent">
                        {slide.highlight}
                      </span>
                    </h2>
                    <p className="text-lg text-white/50 max-w-lg mt-6 leading-relaxed">
                      {slide.subtitle}
                    </p>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 pt-2">
                <Button
                  asChild
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-xl shadow-red-600/30 text-base px-8 h-12"
                >
                  <Link href="/login">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="bg-white/5 hover:bg-white/10 text-white border-white/20 backdrop-blur-sm text-base px-8 h-12"
                >
                  <Link href="#features">Explore Features</Link>
                </Button>
              </div>

              {/* Slide indicators */}
              <div className="flex gap-2 pt-4">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      index === currentSlide
                        ? "bg-red-500 w-8"
                        : "bg-white/20 w-4 hover:bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Glow behind card */}
                <div className="absolute -inset-4 bg-gradient-to-r from-red-500/10 via-blue-500/10 to-indigo-500/10 rounded-3xl blur-2xl" />

                {/* Dashboard mockup */}
                <div className="relative bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm">
                  {/* Title bar */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                    <span className="ml-3 text-xs text-white/30">
                      ProgressTracker Dashboard
                    </span>
                  </div>

                  {/* Mock stat cards */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      {
                        label: "Students",
                        value: "2,847",
                        change: "+12%",
                        color: "text-blue-400",
                      },
                      {
                        label: "Avg. Score",
                        value: "78.5%",
                        change: "+3.2%",
                        color: "text-emerald-400",
                      },
                      {
                        label: "Attendance",
                        value: "92.1%",
                        change: "+1.8%",
                        color: "text-amber-400",
                      },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]"
                      >
                        <p className="text-[10px] text-white/40 uppercase tracking-wider">
                          {stat.label}
                        </p>
                        <p className="text-lg font-bold text-white mt-1">
                          {stat.value}
                        </p>
                        <p className={`text-[10px] ${stat.color} mt-0.5`}>
                          {stat.change}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Mock chart */}
                  <div className="bg-white/[0.03] rounded-lg p-4 border border-white/[0.06]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-white/40">
                        Performance Overview
                      </span>
                      <span className="text-[10px] text-white/25">
                        Last 6 months
                      </span>
                    </div>
                    <div className="flex items-end gap-1.5 h-24">
                      {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map(
                        (h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-sm bg-gradient-to-t from-red-500/40 to-blue-500/40 transition-all duration-1000"
                            style={{
                              height: `${h}%`,
                              animationDelay: `${i * 100}ms`,
                            }}
                          />
                        )
                      )}
                    </div>
                  </div>

                  {/* Mock table rows */}
                  <div className="mt-4 space-y-2">
                    {[
                      { name: "CSE - Semester 5", score: "82%", status: "Above Avg" },
                      { name: "ECE - Semester 3", score: "76%", status: "On Track" },
                      { name: "ME - Semester 7", score: "88%", status: "Excellent" },
                    ].map((row, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 px-3 bg-white/[0.02] rounded-lg border border-white/[0.04]"
                      >
                        <span className="text-xs text-white/50">{row.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-white/70">
                            {row.score}
                          </span>
                          <span className="text-[10px] text-emerald-400/80 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                            {row.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ===== NOTIFICATION TICKER ===== */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-2.5 overflow-hidden">
        <div className="animate-slide-up px-6">
          <p className="text-center text-sm font-medium tracking-wide">
            Admissions Open 2026-27 &nbsp;&bull;&nbsp; Ranked Top Engineering
            College in Karnataka &nbsp;&bull;&nbsp; 150+ Companies in Placement
            Drive
          </p>
        </div>
      </div>

      {/* ===== STATS ===== */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-50/80">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((item, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-slate-200 hover:-translate-y-1"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-[#0f1b4c]/5 flex items-center justify-center group-hover:bg-[#0f1b4c]/10 transition-colors">
                  <item.icon className="h-7 w-7 text-[#0f1b4c]" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-[#0f1b4c] mb-1">
                  {item.number}
                </div>
                <div className="text-sm text-slate-500 font-medium">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-24 bg-slate-50/80">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center space-y-4 mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-red-50 text-red-600 text-xs font-semibold uppercase tracking-wider">
              Platform Features
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0f1b4c]">
              Everything You Need to
              <span className="text-red-600"> Excel</span>
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              A comprehensive suite of tools designed for modern academic
              institutions
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-slate-200 hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[#0f1b4c] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ABOUT ===== */}
      <section id="about" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-[#0f1b4c]/5 text-[#0f1b4c] text-xs font-semibold uppercase tracking-wider mb-4">
                  Since 1999
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-[#0f1b4c] mb-6">
                  About PESITM
                  <span className="text-red-600"> Shivamogga</span>
                </h2>
                <p className="text-slate-600 leading-relaxed mb-4 text-base">
                  PES Institute of Technology & Management is a premier
                  engineering institution located in the cultural capital of
                  Karnataka &mdash; Shivamogga. Established in 1999, we are
                  committed to providing quality technical education and
                  fostering innovation.
                </p>
                <p className="text-slate-600 leading-relaxed text-base">
                  Our state-of-the-art infrastructure, experienced faculty, and
                  industry partnerships ensure that our students are
                  well-prepared for successful careers in engineering and
                  technology.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {accreditations.map((acc, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {acc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-[#0f1b4c]/5 to-red-500/5 rounded-3xl" />
              <div className="relative bg-gradient-to-br from-[#0a1128] to-[#1a1a5e] rounded-2xl p-10 text-center overflow-hidden">
                {/* Dot pattern */}
                <div
                  className="absolute inset-0 opacity-5"
                  style={{
                    backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
                    backgroundSize: "24px 24px",
                  }}
                />
                <div className="relative z-10">
                  <GraduationCap className="h-20 w-20 mx-auto mb-6 text-white/80" />
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Empowering Futures
                  </h3>
                  <p className="text-white/50 text-sm max-w-xs mx-auto">
                    Quality education meets cutting-edge technology for a
                    transformative academic experience
                  </p>
                  <div className="mt-8 grid grid-cols-3 gap-4">
                    {[
                      { value: "8", label: "Departments" },
                      { value: "50+", label: "Labs" },
                      { value: "100%", label: "Wi-Fi Campus" },
                    ].map((s, i) => (
                      <div key={i} className="text-center">
                        <p className="text-2xl font-bold text-red-400">
                          {s.value}
                        </p>
                        <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1">
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#060d1f] via-[#0f1b4c] to-[#1a1050]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to Transform Your
            <br />
            <span className="bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent">
              Academic Experience?
            </span>
          </h2>
          <p className="text-lg text-white/40 max-w-2xl mx-auto mb-10">
            Join thousands of students and educators who trust ProgressTracker
            for comprehensive academic management
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-xl shadow-red-600/30 text-base px-10 h-12"
            >
              <Link href="/login">
                Access Portal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-white/5 hover:bg-white/10 text-white border-white/20 text-base px-10 h-12"
            >
              <Link href="/login">Faculty Login</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#060d1f] text-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/pesitm.png"
                  alt="PESITM"
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <div>
                  <h3 className="font-bold text-white text-lg">PESITM</h3>
                  <p className="text-xs text-white/40">Progress Tracker</p>
                </div>
              </div>
              <p className="text-sm text-white/40 leading-relaxed max-w-md">
                PES Institute of Technology & Management &mdash; Shaping future
                engineers and leaders through excellence in education since 1999.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-white/80 mb-4 text-sm uppercase tracking-wider">
                Quick Links
              </h4>
              <ul className="space-y-3 text-sm">
                {[
                  "Student Portal",
                  "Faculty Login",
                  "Admin Dashboard",
                  "Parent Portal",
                ].map((label) => (
                  <li key={label}>
                    <Link
                      href="/login"
                      className="text-white/40 hover:text-red-400 transition-colors flex items-center gap-2"
                    >
                      <ChevronRight className="h-3 w-3" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-white/80 mb-4 text-sm uppercase tracking-wider">
                Contact
              </h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2 text-white/40">
                  <MapPin className="h-4 w-4 mt-0.5 text-red-400/60 flex-shrink-0" />
                  NH-206, Shivamogga, Karnataka - 577204
                </li>
                <li className="flex items-center gap-2 text-white/40">
                  <Phone className="h-4 w-4 text-red-400/60 flex-shrink-0" />
                  +91-8182-235555
                </li>
                <li className="flex items-center gap-2 text-white/40">
                  <Mail className="h-4 w-4 text-red-400/60 flex-shrink-0" />
                  info@pesitm.edu
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/30">
              &copy; 2026 PES Institute of Technology & Management. All rights
              reserved.
            </p>
            <p className="text-xs text-white/20">
              ProgressTracker &mdash; Academic Intelligence Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
