"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Award,
  Users,
  BookOpen,
  TrendingUp,
  Briefcase,
  Globe,
  ChevronRight,
  CheckCircle2,
  Star
} from "lucide-react";
import { useState, useEffect } from "react";

const programs = [
  { name: "Computer Science & Engineering", icon: "💻", duration: "4 Years" },
  { name: "Electronics & Communication", icon: "📡", duration: "4 Years" },
  { name: "Mechanical Engineering", icon: "⚙️", duration: "4 Years" },
  { name: "Civil Engineering", icon: "🏗️", duration: "4 Years" },
  { name: "Electrical Engineering", icon: "⚡", duration: "4 Years" },
  { name: "Information Science", icon: "🔬", duration: "4 Years" },
  { name: "MBA", icon: "📊", duration: "2 Years" },
  { name: "MCA", icon: "🖥️", duration: "2 Years" },
];

const highlights = [
  { number: "25+", label: "Years of Excellence", icon: Star },
  { number: "5000+", label: "Students Enrolled", icon: Users },
  { number: "200+", label: "Expert Faculty", icon: Award },
  { number: "95%", label: "Placement Rate", icon: TrendingUp },
];

const accreditations = [
  "AICTE Approved",
  "VTU Affiliated",
  "NBA Accredited",
  "NAAC A+ Grade",
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Excellence in Engineering Education",
      subtitle: "Shaping Future Engineers & Leaders Since 1999",
      gradient: "from-blue-600 to-purple-600"
    },
    {
      title: "World-Class Infrastructure",
      subtitle: "State-of-the-art Labs, Libraries & Sports Facilities",
      gradient: "from-purple-600 to-pink-600"
    },
    {
      title: "Industry-Ready Programs",
      subtitle: "Bridging Academia with Real-World Excellence",
      gradient: "from-pink-600 to-orange-600"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Image
              src="/pesitm.png"
              alt="PESITM Logo"
              width={50}
              height={50}
              className="object-contain"
            />
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                PES Institute of Technology & Management
              </h1>
              <p className="text-xs text-slate-600">Shivamogga, Karnataka</p>
            </div>
          </div>
          <Button asChild size="sm" className="btn-ripple">
            <Link href="/login">Portal Login</Link>
          </Button>
        </div>
      </header>

      {/* Hero Slider */}
      <section className="relative h-[500px] overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className={`h-full w-full bg-gradient-to-r ${slide.gradient} flex items-center justify-center`}>
              <div className="text-center text-white px-6 space-y-4 animate-fade-in">
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
                  {slide.title}
                </h2>
                <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
                  {slide.subtitle}
                </p>
                <div className="flex gap-4 justify-center pt-4">
                  <Button asChild size="lg" variant="secondary" className="btn-ripple hover-lift">
                    <Link href="/login">Student Portal</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 btn-ripple">
                    <Link href="/login">Faculty Login</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Slider Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Notification Ticker */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 overflow-hidden">
        <div className="animate-slide-up px-6">
          <p className="text-center text-sm font-medium">
            🎓 Admissions Open for 2026-27 Academic Year | 📢 Placement Drive: 150+ Companies Registered | 🏆 Ranked among Top Engineering Colleges in Karnataka
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12 space-y-16">
        {/* Statistics */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {highlights.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 text-center hover-lift border border-slate-200 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <item.icon className="h-8 w-8 mx-auto mb-3 text-blue-600" />
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {item.number}
              </div>
              <div className="text-sm text-slate-600">{item.label}</div>
            </div>
          ))}
        </section>

        {/* About Section */}
        <section className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div>
              <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200">
                Established 1999
              </Badge>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                About PESITM Shivamogga
              </h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                PES Institute of Technology & Management is a premier engineering institution
                located in the cultural capital of Karnataka - Shivamogga. Established in 1999,
                we are committed to providing quality technical education and fostering innovation.
              </p>
              <p className="text-slate-700 leading-relaxed">
                Our state-of-the-art infrastructure, experienced faculty, and industry partnerships
                ensure that our students are well-prepared for successful careers in engineering
                and technology.
              </p>
            </div>

            {/* Accreditations */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                Accreditations & Affiliations
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {accreditations.map((acc, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-200"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    {acc}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center border-2 border-blue-200">
              <div className="text-center p-8">
                <GraduationCap className="h-24 w-24 mx-auto mb-4 text-blue-600" />
                <p className="text-slate-700 font-medium">
                  Empowering Students Through Quality Education
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Programs */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-slate-900">
              Academic Programs
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Comprehensive undergraduate and postgraduate programs designed to meet industry demands
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {programs.map((program, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 hover-lift border border-slate-200 transition-all group cursor-pointer"
              >
                <div className="text-4xl mb-3">{program.icon}</div>
                <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {program.name}
                </h3>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>{program.duration}</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<BookOpen className="h-6 w-6" />}
            title="Academic Excellence"
            desc="Rigorous curriculum aligned with industry standards and emerging technologies"
            color="blue"
          />
          <FeatureCard
            icon={<Briefcase className="h-6 w-6" />}
            title="Industry Connect"
            desc="Strong partnerships with leading companies for internships and placements"
            color="purple"
          />
          <FeatureCard
            icon={<Globe className="h-6 w-6" />}
            title="Global Exposure"
            desc="International collaborations and exchange programs for holistic development"
            color="pink"
          />
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Shape Your Future?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join PESITM and become part of a legacy of excellence in engineering education
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild size="lg" variant="secondary" className="btn-ripple hover-lift">
              <Link href="/login">Access Student Portal</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 btn-ripple">
              <Link href="/login">Faculty Dashboard</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 mt-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/pesitm.png"
                  alt="PESITM Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <div>
                  <h3 className="font-bold text-white">PESITM</h3>
                  <p className="text-xs text-slate-400">Shivamogga</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Excellence in Engineering Education since 1999
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-white transition-colors">Student Portal</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Faculty Login</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Admin Dashboard</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>NH-206, Shivamogga</li>
                <li>Karnataka - 577204</li>
                <li>Phone: +91-8182-235555</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
            <p>&copy; 2026 PES Institute of Technology & Management. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: "blue" | "purple" | "pink";
}) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    purple: "bg-purple-50 border-purple-200 text-purple-600",
    pink: "bg-pink-50 border-pink-200 text-pink-600",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3 hover-lift">
      <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
        {icon}
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}
