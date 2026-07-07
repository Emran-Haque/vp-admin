"use client";

import { Users, Award, type LucideIcon } from "lucide-react";
import { useGetAdminDashboardQuery } from "@/redux/api/dashboardApi";

type Stat = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  card: string;
  text: string;
};

export default function Stats() {
  const { data, isLoading, isError } = useGetAdminDashboardQuery();
  const placeholder = isLoading ? "…" : isError ? "—" : 0;

  const stats: Stat[] = [
    {
      label: "মোট শিক্ষার্থী",
      value: data?.students.total ?? placeholder,
      icon: Users,
      card: "border-cyan-500/40 bg-cyan-500/10",
      text: "text-cyan-500",
    },
    {
      label: "সক্রিয়",
      value: data?.students.active ?? placeholder,
      icon: Award,
      card: "border-emerald-500/40 bg-emerald-500/10",
      text: "text-emerald-500",
    },
  ];

  return (
    <section className="flex flex-wrap gap-6">
      {stats.map(({ label, value, icon: Icon, card, text }) => (
        <div key={label} className={`w-64 rounded-3xl border p-4 ${card}`}>
          <div className="flex items-center justify-between opacity-80">
            <Icon size={24} className={text} />
            <span className={`text-2xl font-bold leading-7 ${text}`}>{value}</span>
          </div>
          <p className={`mt-2 text-xs opacity-80 ${text}`}>{label}</p>
        </div>
      ))}
    </section>
  );
}
