import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
}

export default function StatCard({ title, value, subtitle, icon: Icon, color = "text-blue-600" }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className={cn("text-3xl font-bold mt-1", color)}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={cn("p-3 rounded-lg bg-slate-50", color)}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
