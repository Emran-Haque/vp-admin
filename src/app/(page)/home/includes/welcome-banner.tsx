"use client";

import { Users, ClipboardList, Package, type LucideIcon } from "lucide-react";
import { useGetAdminDashboardQuery } from "@/redux/api/dashboardApi";

type Stat = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  className: string;
};

export default function WelcomeBanner() {
  const { data, isLoading, isError } = useGetAdminDashboardQuery();

  const placeholder = isLoading ? "…" : isError ? "—" : 0;

  const stats: Stat[] = [
    {
      label: "শিক্ষার্থী",
      value: data?.students.total ?? placeholder,
      icon: Users,
      className: "bg-white/10 outline-emerald-500/20",
    },
    {
      label: "মোট পরীক্ষা",
      value: data?.exams.total ?? placeholder,
      icon: ClipboardList,
      className: "bg-violet-500/10 outline-violet-500/40",
    },
    {
      label: "নতুন অর্ডার",
      value: data?.ecommerce.pending_orders ?? placeholder,
      icon: Package,
      className: "bg-blue-500/10 outline-blue-500",
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-[0px_8px_32px_-8px_rgba(0,0,0,0.40)]">
      <div className="h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-fuchsia-500" />
      <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute top-16 -left-24 size-80 rounded-full bg-violet-500/20 blur-3xl" />

      <div className="relative px-9 py-10">
        <h1 className="text-4xl font-bold leading-10 text-blue-50">স্বাগতম, অ্যাডমিন</h1>
        <p className="mt-2 text-base text-slate-400">
          MCQ, কোর্স, বই ও অর্ডার — সবকিছু এক জায়গায় পরিচালনা করুন
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          {stats.map(({ label, value, icon: Icon, className }) => (
            <div
              key={label}
              className={`min-w-28 rounded-2xl px-4 py-3.5 outline outline-1 outline-offset-[-1px] ${className}`}
            >
              <div className="flex items-center justify-between gap-4">
                <Icon size={16} className="text-white/80" />
                <span className="text-2xl font-bold leading-7 text-white">{value}</span>
              </div>
              <p className="mt-1.5 text-xs text-white/80">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
