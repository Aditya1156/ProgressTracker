import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── LEARNER CLASSIFICATION ─────────────────────────────
export function classifyLearner(avgPercent: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (avgPercent >= 75) return { label: "Fast Learner", color: "text-green-700", bgColor: "bg-green-100" };
  if (avgPercent >= 50) return { label: "Average Learner", color: "text-yellow-700", bgColor: "bg-yellow-100" };
  return { label: "Slow Learner", color: "text-red-700", bgColor: "bg-red-100" };
}

// ─── PROGRESS TREND DETECTION ───────────────────────────
export function detectTrend(recentScores: number[]): {
  label: string;
  color: string;
  icon: string;
} {
  if (recentScores.length < 2) return { label: "Insufficient Data", color: "text-gray-500", icon: "−" };

  const last = recentScores.slice(-3);
  let improving = 0;
  let declining = 0;

  for (let i = 1; i < last.length; i++) {
    if (last[i] > last[i - 1]) improving++;
    else if (last[i] < last[i - 1]) declining++;
  }

  if (improving > declining) return { label: "Improving", color: "text-green-600", icon: "↑" };
  if (declining > improving) return { label: "Declining", color: "text-red-600", icon: "↓" };
  return { label: "Stable", color: "text-blue-600", icon: "→" };
}

// ─── RISK PREDICTION ────────────────────────────────────
export function predictRisk(avgPercent: number, trend: string): {
  level: string;
  color: string;
} {
  if (avgPercent < 35 && trend === "Declining") return { level: "High Risk", color: "text-red-700" };
  if (avgPercent < 50) return { level: "At Risk", color: "text-orange-600" };
  if (avgPercent < 60 && trend === "Declining") return { level: "Watch", color: "text-yellow-600" };
  return { level: "Safe", color: "text-green-600" };
}

// ─── FORMAT DATE ────────────────────────────────────────
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
