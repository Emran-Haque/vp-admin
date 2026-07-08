"use client";

import { ClipboardCheck, Users, TrendingUp, Trophy, type LucideIcon } from "lucide-react";
import { useGetAdminDashboardQuery } from "@/redux/api/dashboardApi";
import { useGetExamAttemptsQuery } from "@/redux/api/examsApi";

type Stat = {
  label: string;
  value: string;
  icon: LucideIcon;
  gradient: string;
  iconColor: string;
};

export default function Stats() {
  const { data: dashboard } = useGetAdminDashboardQuery();
  const { data: topAttempt } = useGetExamAttemptsQuery({
    status: "submitted",
    ordering: "-final_marks",
    page: 1,
  });

  const topScorer = topAttempt?.results?.[0];
  const averagePercentile = dashboard?.exams.average_percentile;

  const stats: Stat[] = [
    {
      label: "মোট ফলাফল",
      value: String(dashboard?.exams.total_attempts ?? "—"),
      icon: ClipboardCheck,
      gradient: "from-blue-500/20 to-blue-500/5",
      iconColor: "text-blue-500",
    },
    {
      label: "মোট শিক্ষার্থী",
      value: String(dashboard?.students.total ?? "—"),
      icon: Users,
      gradient: "from-sky-500/20 to-sky-500/5",
      iconColor: "text-sky-500",
    },
    {
      label: "গড় পার্সেন্টাইল",
      value: averagePercentile != null ? `${Math.round(averagePercentile)}%` : "—",
      icon: TrendingUp,
      gradient: "from-green-500/20 to-green-500/5",
      iconColor: "text-green-500",
    },
    {
      label: "শীর্ষ স্কোরার",
      value: topScorer?.student_name?.split(" ")[0] ?? "—",
      icon: Trophy,
      gradient: "from-amber-500/20 to-amber-500/5",
      iconColor: "text-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, gradient, iconColor }) => (
        <div
          key={label}
          className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-gray-900 to-neutral-900 p-4 shadow-[0px_3px_14px_0px_rgba(0,0,0,0.30)]`}
        >
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient} opacity-60`} />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-1.5 text-xl font-bold text-blue-50">{value}</p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-2xl border border-slate-800 bg-gray-950/60">
              <Icon size={16} className={iconColor} />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
