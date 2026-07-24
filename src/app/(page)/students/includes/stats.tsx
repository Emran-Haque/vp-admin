"use client";

import { Users, Award, type LucideIcon } from "lucide-react";
import { useGetAdminDashboardQuery } from "@/redux/api/dashboardApi";
import { useGetStudentsQuery } from "@/redux/api/studentsApi";

type Stat = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  card: string;
  iconBg: string;
  iconColor: string;
  valueColor: string;
};

export default function Stats() {
  const { data: dashboardData, isLoading: isLoadingDashboard } = useGetAdminDashboardQuery();
  const { data: allStudentsData, isLoading: isLoadingAll } = useGetStudentsQuery();
  const { data: activeStudentsData, isLoading: isLoadingActive } = useGetStudentsQuery({
    is_active: true,
    is_verified: true,
  });

  const isLoading = isLoadingDashboard && isLoadingAll && isLoadingActive;

  const totalStudents = allStudentsData?.count ?? dashboardData?.students.total ?? (isLoading ? "…" : 0);
  const activeStudents = activeStudentsData?.count ?? dashboardData?.students.active ?? (isLoading ? "…" : 0);

  const stats: Stat[] = [
    {
      label: "মোট শিক্ষার্থী",
      value: totalStudents,
      icon: Users,
      card: "border-cyan-500/30 bg-cyan-500/10 hover:border-cyan-500/50",
      iconBg: "bg-cyan-500/20",
      iconColor: "text-cyan-400",
      valueColor: "text-cyan-400",
    },
    {
      label: "সক্রিয়",
      value: activeStudents,
      icon: Award,
      card: "border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-500/50",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-400",
      valueColor: "text-emerald-400",
    },
  ];

  return (
    <section className="flex flex-wrap gap-4 sm:gap-6">
      {stats.map(({ label, value, icon: Icon, card, iconBg, iconColor, valueColor }) => (
        <div
          key={label}
          className={`flex min-w-[200px] flex-1 items-center justify-between rounded-2xl border p-4.5 transition-all ${card}`}
        >
          <div className="flex items-center gap-3.5">
            <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
              <Icon size={22} className={iconColor} />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-300">{label}</p>
              <p className={`mt-0.5 text-2xl font-bold ${valueColor}`}>{value}</p>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
