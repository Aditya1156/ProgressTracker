import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Academic Analytics ───────────────────────────────────────────────────

export type LearnerCategory = "Fast Learner" | "Average Learner" | "Slow Learner";
export type TrendDirection = "Improving" | "Declining" | "Stable";
export type RiskLevel = "Safe" | "Watch" | "At Risk" | "High Risk";

export function classifyLearner(avgPercent: number): {
  label: LearnerCategory;
  color: string;
  bgColor: string;
} {
  if (avgPercent >= 75) return { label: "Fast Learner", color: "text-emerald-700", bgColor: "bg-emerald-50" };
  if (avgPercent >= 50) return { label: "Average Learner", color: "text-amber-700", bgColor: "bg-amber-50" };
  return { label: "Slow Learner", color: "text-red-700", bgColor: "bg-red-50" };
}

export function detectTrend(recentScores: number[]): {
  label: TrendDirection;
  color: string;
  icon: string;
} {
  if (recentScores.length < 3) return { label: "Stable", color: "text-slate-600", icon: "→" };
  const last3 = recentScores.slice(-3);
  const isImproving = last3[2] > last3[0] && last3[1] >= last3[0];
  const isDeclining = last3[2] < last3[0] && last3[1] <= last3[0];
  if (isImproving) return { label: "Improving", color: "text-emerald-600", icon: "↑" };
  if (isDeclining) return { label: "Declining", color: "text-red-600", icon: "↓" };
  return { label: "Stable", color: "text-slate-600", icon: "→" };
}

export function predictRisk(avgPercent: number, trend: TrendDirection): {
  level: RiskLevel;
  color: string;
} {
  if (avgPercent < 35 && trend === "Declining") return { level: "High Risk", color: "text-red-700" };
  if (avgPercent < 45 || (avgPercent < 55 && trend === "Declining")) return { level: "At Risk", color: "text-orange-600" };
  if (avgPercent < 55 && trend !== "Improving") return { level: "Watch", color: "text-amber-600" };
  return { level: "Safe", color: "text-emerald-600" };
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

/** Format percentage with one decimal place */
export function fmtPct(value: number): string {
  return `${value.toFixed(1)}%`;
}
